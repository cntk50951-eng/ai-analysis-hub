import pkg from 'pg';
const { Pool } = pkg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) throw new Error('缺少數據庫連接字符串');
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

const API_KEY = process.env.API_KEY;

function verifyApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  return apiKey === API_KEY;
}

// ==================== TOPICS ====================

// GET — 列表 / 統計 / 單個話題
async function handleTopicGet(req, res) {
  const { id, stats } = req.query;

  if (stats === 'true') {
    const [topicCount, analysisCount, viewCount, tagCount, interactionCount] = await Promise.all([
      query('SELECT COUNT(*) FROM weekly_topics'),
      query('SELECT COUNT(*) FROM ai_analyses'),
      query('SELECT COUNT(*) FROM analysis_views'),
      query('SELECT COUNT(DISTINCT tag) FROM topic_tags'),
      query('SELECT COUNT(*) FROM topic_interactions'),
    ]);

    const topTopics = await query(`
      SELECT wt.id, wt.title, COUNT(av.id) as view_count
      FROM weekly_topics wt
      LEFT JOIN analysis_views av ON wt.id = av.topic_id
      GROUP BY wt.id, wt.title
      ORDER BY view_count DESC
      LIMIT 10
    `);

    const recentViews = await query(`
      SELECT DATE(viewed_at) as date, COUNT(*) as count
      FROM analysis_views
      WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          topics: parseInt(topicCount.rows[0].count),
          analyses: parseInt(analysisCount.rows[0].count),
          views: parseInt(viewCount.rows[0].count),
          tags: parseInt(tagCount.rows[0].count),
          interactions: parseInt(interactionCount.rows[0].count),
        },
        topTopics: topTopics.rows,
        recentViews: recentViews.rows,
      },
    });
  }

  if (id) {
    const topicResult = await query('SELECT * FROM weekly_topics WHERE id = $1', [id]);
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '話題不存在' } });
    }
    return res.status(200).json({ success: true, data: { topic: topicResult.rows[0] } });
  }

  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const listResult = await query(`
    SELECT wt.*,
      COALESCE(aa.analysis_count, 0) as analysis_count,
      COALESCE(vw.view_count, 0) as view_count
    FROM weekly_topics wt
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as analysis_count FROM ai_analyses WHERE topic_id = wt.id
    ) aa ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as view_count FROM analysis_views WHERE topic_id = wt.id
    ) vw ON true
    ORDER BY wt.week_start DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const totalResult = await query('SELECT COUNT(*) FROM weekly_topics');

  return res.status(200).json({
    success: true,
    data: { topics: listResult.rows, total: parseInt(totalResult.rows[0].count) },
  });
}

// POST — 創建話題
async function handleTopicPost(req, res) {
  const { week_start, week_end, title, description, cover_image_url, status, market } = req.body;
  if (!week_start || !week_end || !title) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'week_start, week_end, title 為必填項' } });
  }

  const result = await query(
    `INSERT INTO weekly_topics (week_start, week_end, title, description, cover_image_url, status, market)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [week_start, week_end, title, description || '', cover_image_url || null, status || 'draft', market || 'US']
  );
  return res.status(201).json({ success: true, data: { topic: result.rows[0] } });
}

// PUT — 更新話題
async function handleTopicPut(req, res) {
  const { id } = req.query;
  const topicId = parseInt(id);
  if (!topicId) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: '無效 ID' } });

  const { week_start, week_end, title, description, cover_image_url, status, market } = req.body;
  const result = await query(
    `UPDATE weekly_topics
     SET week_start = COALESCE($1, week_start), week_end = COALESCE($2, week_end),
         title = COALESCE($3, title), description = COALESCE($4, description),
         cover_image_url = COALESCE($5, cover_image_url), status = COALESCE($6, status),
         market = COALESCE($7, market), updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 RETURNING *`,
    [week_start, week_end, title, description, cover_image_url, status, market, topicId]
  );

  if (result.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '話題不存在' } });
  return res.status(200).json({ success: true, data: { topic: result.rows[0] } });
}

// DELETE — 刪除話題
async function handleTopicDelete(req, res) {
  const { id } = req.query;
  const topicId = parseInt(id);
  if (!topicId) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: '無效 ID' } });

  await query('DELETE FROM weekly_topics WHERE id = $1', [topicId]);
  return res.status(200).json({ success: true, data: { deleted: true } });
}

// ==================== ANALYSES ====================

// GET — 查詢某話題的分析
async function handleAnalysisGet(req, res) {
  const { topic_id } = req.query;
  if (!topic_id) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_TOPIC_ID', message: '需要提供 topic_id' } });
  }

  const result = await query(
    `SELECT id, model_name, model_provider, model_icon, analysis_chain,
            confidence_score, status, created_at, updated_at
     FROM ai_analyses WHERE topic_id = $1 ORDER BY id ASC`,
    [topic_id]
  );

  const analyses = result.rows.map(row => ({
    ...row,
    analysis_chain: typeof row.analysis_chain === 'string' ? JSON.parse(row.analysis_chain) : row.analysis_chain,
  }));

  return res.status(200).json({ success: true, data: { analyses } });
}

// POST — 創建分析
async function handleAnalysisPost(req, res) {
  const { topic_id, model_name, model_provider, model_icon, analysis_chain, confidence_score, status } = req.body;
  if (!topic_id || !model_name || !analysis_chain) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'topic_id, model_name, analysis_chain 為必填項' } });
  }

  const result = await query(
    `INSERT INTO ai_analyses (topic_id, model_name, model_provider, model_icon, analysis_chain, confidence_score, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [topic_id, model_name, model_provider || null, model_icon || null, JSON.stringify(analysis_chain), confidence_score || null, status || 'draft']
  );
  return res.status(201).json({ success: true, data: { analysis: result.rows[0] } });
}

// PUT — 更新分析
async function handleAnalysisPut(req, res) {
  const { id } = req.query;
  const analysisId = parseInt(id);
  if (!analysisId) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: '無效 ID' } });

  const { model_name, model_provider, model_icon, analysis_chain, confidence_score, status } = req.body;
  const result = await query(
    `UPDATE ai_analyses
     SET model_name = COALESCE($1, model_name), model_provider = COALESCE($2, model_provider),
         model_icon = COALESCE($3, model_icon), analysis_chain = COALESCE($4, analysis_chain),
         confidence_score = COALESCE($5, confidence_score), status = COALESCE($6, status),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 RETURNING *`,
    [model_name, model_provider, model_icon, analysis_chain ? JSON.stringify(analysis_chain) : null, confidence_score, status, analysisId]
  );

  if (result.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '分析不存在' } });
  return res.status(200).json({ success: true, data: { analysis: result.rows[0] } });
}

// DELETE — 刪除分析
async function handleAnalysisDelete(req, res) {
  const { id } = req.query;
  const analysisId = parseInt(id);
  if (!analysisId) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: '無效 ID' } });

  await query('DELETE FROM ai_analyses WHERE id = $1', [analysisId]);
  return res.status(200).json({ success: true, data: { deleted: true } });
}

// ==================== MAIN ====================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!verifyApiKey(req)) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '未授權訪問' } });
  }

  try {
    const { action } = req.query;

    if (action === 'analyses') {
      switch (req.method) {
        case 'GET': return await handleAnalysisGet(req, res);
        case 'POST': return await handleAnalysisPost(req, res);
        case 'PUT': return await handleAnalysisPut(req, res);
        case 'DELETE': return await handleAnalysisDelete(req, res);
        default: return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的請求方法' } });
      }
    }

    switch (req.method) {
      case 'GET': return await handleTopicGet(req, res);
      case 'POST': return await handleTopicPost(req, res);
      case 'PUT': return await handleTopicPut(req, res);
      case 'DELETE': return await handleTopicDelete(req, res);
      default: return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的請求方法' } });
    }
  } catch (error) {
    console.error('Admin Intelligence Error:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
