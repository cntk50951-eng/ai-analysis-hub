import pkg from 'pg';
import { createHash } from 'crypto';
const { Pool } = pkg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('缺少數據庫連接字符串');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

function hash(str) {
  return createHash('sha256').update(String(str)).digest('hex');
}

const RATE_LIMIT = 100;
const RATE_WINDOW = 3600 * 1000;
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  rateLimitMap.set(ip, record);
  return true;
}

function checkRateLimitStrict(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= 50) return false;
  record.count++;
  rateLimitMap.set(ip, record);
  return true;
}

function sanitizeTag(tag) {
  return tag
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 50);
}

// ===== GET — 話題列表 =====
async function handleList(req, res) {
  const market = req.query.market || 'US';
  const status = req.query.status || 'published';
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const offset = parseInt(req.query.offset) || 0;
  const tag = req.query.tag;

  const conditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (status !== 'all') {
    conditions.push(`wt.status = $${paramIndex++}`);
    params.push(status);
  }

  if (market !== 'all') {
    conditions.push(`wt.market = $${paramIndex++}`);
    params.push(market);
  }

  let topicIds = null;
  if (tag) {
    const tagResult = await query(
      'SELECT DISTINCT topic_id FROM topic_tags WHERE tag = $1',
      [tag]
    );
    topicIds = tagResult.rows.map(r => r.topic_id);
    if (topicIds.length > 0) {
      conditions.push(`wt.id = ANY($${paramIndex++})`);
      params.push(topicIds);
    } else {
      return res.status(200).json({
        success: true,
        data: { topics: [], total: 0 },
        meta: { timestamp: new Date().toISOString(), market, filters: { status, tag } },
      });
    }
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM weekly_topics wt WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const listParams = [...params];
  const listResult = await query(
    `SELECT 
      wt.id, wt.week_start, wt.week_end, wt.title, wt.description,
      wt.cover_image_url, wt.status, wt.market, wt.created_at, wt.updated_at,
      COALESCE(tt.tags, '[]') AS tags,
      COALESCE(aa.analysis_count, 0) AS analysis_count,
      COALESCE(vw.view_count, 0) AS view_count
    FROM weekly_topics wt
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(DISTINCT tag) AS tags
      FROM topic_tags
      WHERE topic_id = wt.id
    ) tt ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS analysis_count
      FROM ai_analyses
      WHERE topic_id = wt.id AND status = 'published'
    ) aa ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS view_count
      FROM analysis_views
      WHERE topic_id = wt.id
    ) vw ON true
    WHERE ${whereClause}
    ORDER BY wt.week_start DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...listParams, limit, offset]
  );

  const topics = listResult.rows.map(row => ({
    ...row,
    tags: row.tags || [],
    analysis_count: parseInt(row.analysis_count),
    view_count: parseInt(row.view_count),
  }));

  return res.status(200).json({
    success: true,
    data: { topics, total },
    meta: {
      timestamp: new Date().toISOString(),
      market,
      filters: { status, tag },
      pagination: { limit, offset, total },
    },
  });
}

// ===== GET — 單話題詳情 =====
async function handleDetail(req, res, id) {
  const topicResult = await query(
    `SELECT 
      wt.*,
      COALESCE(tt.tags, '[]') AS tags,
      COALESCE(vw.view_count, 0) AS view_count
    FROM weekly_topics wt
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(DISTINCT tag ORDER BY tag) AS tags
      FROM topic_tags
      WHERE topic_id = wt.id
    ) tt ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS view_count
      FROM analysis_views
      WHERE topic_id = wt.id
    ) vw ON true
    WHERE wt.id = $1`,
    [id]
  );

  if (topicResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: { code: 'TOPIC_NOT_FOUND', message: '話題不存在' },
    });
  }

  const topic = topicResult.rows[0];
  topic.tags = topic.tags || [];
  topic.view_count = parseInt(topic.view_count);

  const analysesResult = await query(
    `SELECT id, model_name, model_provider, model_icon, analysis_chain,
            confidence_score, status, created_at
     FROM ai_analyses
     WHERE topic_id = $1 AND status = 'published'
     ORDER BY id ASC`,
    [id]
  );

  const analyses = analysesResult.rows.map(row => ({
    ...row,
    analysis_chain: typeof row.analysis_chain === 'string'
      ? JSON.parse(row.analysis_chain)
      : row.analysis_chain,
  }));

  return res.status(200).json({
    success: true,
    data: { topic, analyses, tags: topic.tags },
    meta: { timestamp: new Date().toISOString() },
  });
}

// ===== POST — 記錄訪問 =====
async function handleView(req, res, topicId) {
  const { session_id, user_id, referrer, duration_seconds } = req.body || {};

  const topicResult = await query('SELECT id FROM weekly_topics WHERE id = $1', [topicId]);
  if (topicResult.rows.length === 0) {
    return res.status(404).json({ success: false, error: { code: 'TOPIC_NOT_FOUND', message: '話題不存在' } });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const ipHash = hash(ip);
  const uaHash = hash(req.headers['user-agent'] || 'unknown');

  await query(
    `INSERT INTO analysis_views 
     (topic_id, session_id, user_id, ip_hash, user_agent_hash, referrer, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [topicId, session_id || null, user_id || null, ipHash, uaHash, referrer || null, duration_seconds || null]
  );

  return res.status(200).json({ success: true, data: { recorded: true }, meta: { timestamp: new Date().toISOString() } });
}

// ===== GET/POST/DELETE — 標籤 =====
async function handleTagGet(req, res, topicId) {
  const result = await query(
    `SELECT tag, tag_type, user_id, created_at FROM topic_tags WHERE topic_id = $1 ORDER BY tag_type DESC, created_at DESC`,
    [topicId]
  );
  const systemTags = result.rows.filter(r => r.tag_type === 'system').map(r => r.tag);
  const userTags = result.rows.filter(r => r.tag_type === 'user');
  return res.status(200).json({ success: true, data: { system_tags: systemTags, user_tags: userTags }, meta: { timestamp: new Date().toISOString() } });
}

async function handleTagPost(req, res, topicId) {
  const { tag, user_id } = req.body || {};
  if (!tag || !tag.trim()) return res.status(400).json({ success: false, error: { code: 'INVALID_TAG', message: '請提供有效的標籤' } });
  if (!user_id) return res.status(400).json({ success: false, error: { code: 'USER_REQUIRED', message: '添加標籤需要用戶登錄' } });

  const cleanTag = sanitizeTag(tag);
  await query(
    `INSERT INTO topic_tags (topic_id, tag, tag_type, user_id) VALUES ($1, $2, 'user', $3)
     ON CONFLICT (topic_id, tag, user_id) DO NOTHING`,
    [topicId, cleanTag, user_id]
  );
  return res.status(200).json({ success: true, data: { tag: cleanTag, added: true }, meta: { timestamp: new Date().toISOString() } });
}

async function handleTagDelete(req, res, topicId) {
  const { tag, user_id } = req.body || {};
  if (!tag || !user_id) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: '請提供標籤和用戶 ID' } });

  const result = await query(
    `DELETE FROM topic_tags WHERE topic_id = $1 AND tag = $2 AND user_id = $3 AND tag_type = 'user' RETURNING id`,
    [topicId, sanitizeTag(tag), user_id]
  );
  return res.status(200).json({ success: true, data: { deleted: result.rowCount > 0 }, meta: { timestamp: new Date().toISOString() } });
}

// ===== GET/POST — 互動 =====
async function handleInteractGet(req, res, topicId) {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(200).json({ success: true, data: { bookmarked: false, rated: null, note: null }, meta: { timestamp: new Date().toISOString() } });
  }

  const result = await query(
    `SELECT interaction_type, interaction_value FROM topic_interactions WHERE topic_id = $1 AND user_id = $2`,
    [topicId, user_id]
  );

  const interactions = { bookmarked: false, rated: null, note: null };
  for (const row of result.rows) {
    if (row.interaction_type === 'bookmark') interactions.bookmarked = row.interaction_value === 'true';
    if (row.interaction_type === 'rate') interactions.rated = parseInt(row.interaction_value) || null;
    if (row.interaction_type === 'note') interactions.note = row.interaction_value;
  }
  return res.status(200).json({ success: true, data: interactions, meta: { timestamp: new Date().toISOString() } });
}

async function handleInteractPost(req, res, topicId) {
  const { type, value, user_id } = req.body || {};
  if (!type || !['bookmark', 'rate', 'note', 'share'].includes(type)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: '互動類型無效' } });
  }
  if (!user_id) return res.status(400).json({ success: false, error: { code: 'USER_REQUIRED', message: '需要用戶登錄' } });

  let cleanValue = String(value || '');
  if (type === 'rate') {
    const num = parseInt(cleanValue);
    if (isNaN(num) || num < 1 || num > 5) return res.status(400).json({ success: false, error: { code: 'INVALID_RATE', message: '評分必須在 1-5 之間' } });
    cleanValue = String(num);
  }
  if (type === 'note') cleanValue = cleanValue.replace(/[<>"']/g, '').substring(0, 500);

  if (type === 'bookmark') {
    const existing = await query(
      `SELECT interaction_value FROM topic_interactions WHERE topic_id = $1 AND user_id = $2 AND interaction_type = 'bookmark'`,
      [topicId, user_id]
    );
    if (existing.rows.length > 0 && existing.rows[0].interaction_value === 'true') {
      await query(`DELETE FROM topic_interactions WHERE topic_id = $1 AND user_id = $2 AND interaction_type = 'bookmark'`, [topicId, user_id]);
      return res.status(200).json({ success: true, data: { bookmarked: false }, meta: { timestamp: new Date().toISOString() } });
    }
  }

  await query(
    `INSERT INTO topic_interactions (topic_id, user_id, interaction_type, interaction_value)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (topic_id, user_id, interaction_type)
     DO UPDATE SET interaction_value = $4, created_at = CURRENT_TIMESTAMP`,
    [topicId, user_id, type, cleanValue]
  );
  return res.status(200).json({ success: true, data: { [type]: cleanValue, saved: true }, meta: { timestamp: new Date().toISOString() } });
}

// ===== 主入口 =====
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高' } });
    }

    const { id, action } = req.query;
    const topicId = id ? parseInt(id) : null;

    // action 路由
    if (action === 'view' && req.method === 'POST') {
      if (!topicId || isNaN(topicId)) return res.status(400).json({ success: false, error: { code: 'INVALID_TOPIC_ID', message: '無效的話題 ID' } });
      return await handleView(req, res, topicId);
    }

    if (action === 'tag') {
      if (!topicId || isNaN(topicId)) return res.status(400).json({ success: false, error: { code: 'INVALID_TOPIC_ID', message: '無效的話題 ID' } });
      if (!checkRateLimitStrict(String(ip))) return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高' } });
      if (req.method === 'GET') return await handleTagGet(req, res, topicId);
      if (req.method === 'POST') return await handleTagPost(req, res, topicId);
      if (req.method === 'DELETE') return await handleTagDelete(req, res, topicId);
      return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的請求方法' } });
    }

    if (action === 'interact') {
      if (!topicId || isNaN(topicId)) return res.status(400).json({ success: false, error: { code: 'INVALID_TOPIC_ID', message: '無效的話題 ID' } });
      if (!checkRateLimitStrict(String(ip))) return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高' } });
      if (req.method === 'GET') return await handleInteractGet(req, res, topicId);
      if (req.method === 'POST') return await handleInteractPost(req, res, topicId);
      return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的請求方法' } });
    }

    // 默認：GET 列表/詳情
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 GET 請求' } });
    }

    if (id) {
      return await handleDetail(req, res, id);
    } else {
      return await handleList(req, res);
    }
  } catch (error) {
    console.error('Weekly Topics API Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
