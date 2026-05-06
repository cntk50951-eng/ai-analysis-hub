#!/usr/bin/env node
/**
 * Weekly Intelligence Hub — 數據庫遷移腳本
 * 創建 weekly_topics, ai_analyses, topic_tags, analysis_views, topic_interactions 表
 */

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function runMigration() {
  console.log('🚀 開始創建 Weekly Intelligence Hub 數據庫表...\n');

  try {
    // 1. weekly_topics — 每周話題表
    console.log('📊 創建 weekly_topics 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS weekly_topics (
        id SERIAL PRIMARY KEY,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        status VARCHAR(20) DEFAULT 'published',
        market VARCHAR(10) DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ weekly_topics 創建成功');

    // 2. ai_analyses — AI 模型分析表
    console.log('📊 創建 ai_analyses 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES weekly_topics(id) ON DELETE CASCADE,
        model_name VARCHAR(100) NOT NULL,
        model_provider VARCHAR(50),
        model_icon VARCHAR(50),
        analysis_chain JSONB NOT NULL DEFAULT '{}',
        raw_content TEXT,
        confidence_score DECIMAL(3,2),
        status VARCHAR(20) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ ai_analyses 創建成功');

    // 3. topic_tags — 話題標籤表
    console.log('📊 創建 topic_tags 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS topic_tags (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES weekly_topics(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL,
        tag_type VARCHAR(20) DEFAULT 'system',
        user_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ topic_tags 創建成功');

    // 4. analysis_views — 訪問記錄表
    console.log('📊 創建 analysis_views 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS analysis_views (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES weekly_topics(id) ON DELETE CASCADE,
        analysis_id INTEGER REFERENCES ai_analyses(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        user_id VARCHAR(100),
        ip_hash VARCHAR(64),
        user_agent_hash VARCHAR(64),
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_seconds INTEGER,
        referrer VARCHAR(200)
      )
    `);
    console.log('✅ analysis_views 創建成功');

    // 5. topic_interactions — 用戶互動表
    console.log('📊 創建 topic_interactions 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS topic_interactions (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES weekly_topics(id) ON DELETE CASCADE,
        user_id VARCHAR(100) NOT NULL,
        interaction_type VARCHAR(50) NOT NULL,
        interaction_value VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ topic_interactions 創建成功');

    // 6. 索引創建
    console.log('\n📦 創建索引...');

    await query(`CREATE INDEX IF NOT EXISTS idx_weekly_topics_week ON weekly_topics(week_start DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_weekly_topics_status ON weekly_topics(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_weekly_topics_market ON weekly_topics(market)`);

    await query(`CREATE INDEX IF NOT EXISTS idx_ai_analyses_topic ON ai_analyses(topic_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_analyses_model ON ai_analyses(model_name)`);

    await query(`CREATE INDEX IF NOT EXISTS idx_topic_tags_topic ON topic_tags(topic_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_topic_tags_tag ON topic_tags(tag)`);
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_topic_tags_unique 
      ON topic_tags(topic_id, tag, COALESCE(user_id, ''))
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_analysis_views_topic ON analysis_views(topic_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_analysis_views_viewed_at ON analysis_views(viewed_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_analysis_views_session ON analysis_views(session_id)`);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_topic_interactions_unique 
      ON topic_interactions(topic_id, user_id, interaction_type)
    `);

    console.log('✅ 所有索引創建成功');

    // 7. 統計信息更新
    console.log('\n📊 更新表統計信息...');
    await query('ANALYZE weekly_topics');
    await query('ANALYZE ai_analyses');
    await query('ANALYZE topic_tags');
    await query('ANALYZE analysis_views');
    await query('ANALYZE topic_interactions');
    console.log('✅ 統計信息已更新');

    console.log('\n🎉 Weekly Intelligence Hub 數據庫遷移完成！');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
