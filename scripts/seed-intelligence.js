#!/usr/bin/env node
/**
 * Weekly Intelligence Hub — 種子數據腳本
 * 插入 2 條示例話題 + 多模型分析，用於開發調試
 */

import pkg from 'pg';
import dotenv from 'dotenv';
import { createHash } from 'crypto';

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

function hash(str) {
  return createHash('sha256').update(str).digest('hex');
}

const sampleTopics = [
  {
    week_start: '2026-04-27',
    week_end: '2026-05-03',
    title: '美聯儲利率決議與全球市場波動',
    description: '本週美聯儲召開 5 月 FOMC 會議，維持基準利率在 4.25%-4.50% 區間不變。會後聲明釋放鴿派信號，市場對 9 月降息預期升溫，全球股債匯市出現顯著波動。',
    status: 'published',
    market: 'US',
  },
  {
    week_start: '2026-04-20',
    week_end: '2026-04-26',
    title: '中國科技巨頭財報季與港股復甦動能',
    description: '阿里巴巴、騰訊、美團等科技巨頭陸續發布 2026 財年一季度業績。AI 資本開支持續加碼，雲業務增速回暖，市場關注港股科技板塊能否延續反彈勢頭。',
    status: 'published',
    market: 'HK',
  },
];

const sampleAnalyses = [
  // Topic 1 — Claude
  {
    topic_index: 0,
    model_name: 'Claude-3.7-Sonnet',
    model_provider: 'anthropic',
    model_icon: '🎯',
    confidence_score: 0.88,
    analysis_chain: {
      version: '1.0',
      logic_chain: [
        {
          step: 1,
          title: '宏觀背景梳理',
          summary: '美聯儲於 5 月 FOMC 會議維持利率不變，鮑威爾記者會語氣偏鴿，強調「關注雙重使命的風險平衡」。',
          detail: '美聯儲連續第三次會議維持聯邦基金利率於 4.25%-4.50% 區間。會後聲明刪除了「通脹仍處高位」的措辭，改為「通脹已從高位回落但仍略高於目標」。鮑威爾在記者會上表示，關稅對通脹的影響可能是「暫時的」，這一表態被市場解讀為保留降息空間。',
          evidence_ids: ['e1', 'e2'],
          icon: 'globe',
        },
        {
          step: 2,
          title: '市場數據反應',
          summary: 'CME 利率期貨顯示 9 月降息概率升至 78%，美元指數跌破 100 關口，創 2024 年以來新低。',
          detail: '根據 CME FedWatch Tool，市場定價 9 月降息 25 個基點的概率從會前的 62% 躍升至 78%。美元指數（DXY）單周下跌 1.8%，跌破 100 整數關口。10 年期美債收益率下行 12 個基點至 4.15%。黃金現貨價格突破 $3,400/盎司，創歷史新高。',
          evidence_ids: ['e3', 'e4', 'e5'],
          icon: 'trending_up',
        },
        {
          step: 3,
          title: '關聯資產影響',
          summary: '科技股短線承壓後反彈，羅素 2000 小盤股表現優於納指；新興市場貨幣普遍走強。',
          detail: '納斯達克 100 指數週二一度下跌 1.5%，但週三反彈收復失地，全周微漲 0.3%。羅素 2000 指數上漲 1.8%，顯示市場對降息預期下的小盤股受益邏輯。MSCI 新興市場指數上漲 2.1%，巴西雷亞爾、南非蘭特對美元升值逾 2%。',
          evidence_ids: ['e6'],
          icon: 'insights',
        },
        {
          step: 4,
          title: '風險因素觀察',
          summary: '需警惕通脹反彈風險及地緣政治不確定性對市場情緒的干擾。',
          detail: '雖然聯儲釋放鴿派信號，但 4 月核心 PCE 仍高於 3%。若後續通脹數據反彈，市場降息預期可能迅速收斂。此外，中東地緣局勢升溫可能推高油價，間接影響通脹預期。',
          evidence_ids: ['e7'],
          icon: 'warning',
        },
      ],
      conclusion: {
        summary: '綜合來看，美聯儲本次會議釋放了清晰的鴿派信號，市場已充分定價 9 月降息預期。短線美元承壓、黃金與新興市場受益的邏輯較為清晰，但需持續跟蹤後續通脹數據與地緣風險。',
        key_tags: ['美聯儲', '降息預期', '美元走弱', '黃金新高'],
        risk_factors: ['核心 PCE 反彈風險', '中東地緣局勢', '關稅政策不確定性'],
      },
      evidence_list: [
        { id: 'e1', type: 'news', source: 'Reuters', title: 'Fed holds rates steady, signals patience on inflation', date: '2026-05-01', url: 'https://reuters.com/fed-rates-0501' },
        { id: 'e2', type: 'news', source: 'Bloomberg', title: "Powell says tariff impact on inflation may be 'transitory'", date: '2026-05-01', url: 'https://bloomberg.com/powell-transitory-0501' },
        { id: 'e3', type: 'data', source: 'CME FedWatch', indicator: 'September Rate Cut Probability', value: '78%', trend: 'up', unit: '%' },
        { id: 'e4', type: 'data', source: 'ICE', indicator: 'US Dollar Index (DXY)', value: '99.45', trend: 'down', unit: '' },
        { id: 'e5', type: 'data', source: 'World Gold Council', indicator: 'Gold Spot Price', value: '$3,425', trend: 'up', unit: 'USD/oz' },
        { id: 'e6', type: 'news', source: 'WSJ', title: 'Small-cap stocks rally on rate-cut bets', date: '2026-04-30', url: 'https://wsj.com/small-cap-rally-0430' },
        { id: 'e7', type: 'data', source: 'BEA', indicator: 'Core PCE YoY', value: '3.1%', trend: 'flat', unit: '%' },
      ],
      disclaimer: '本分析僅基於公開新聞與數據進行客觀整理，不構成任何投資建議。',
    },
  },
  // Topic 1 — GPT-4o
  {
    topic_index: 0,
    model_name: 'GPT-4o',
    model_provider: 'openai',
    model_icon: '🧠',
    confidence_score: 0.82,
    analysis_chain: {
      version: '1.0',
      logic_chain: [
        {
          step: 1,
          title: '政策信號解讀',
          summary: 'FOMC 聲明措辭微調釋放鴿派信號，點陣圖顯示年內可能降息兩次。',
          detail: '本次 FOMC 聲明最顯著的變化是刪除了「通脹仍處高位」的表述，暗示聯儲對通脹回落更有信心。更新的點陣圖顯示，委員會中位數預測 2026 年底聯邦基金利率為 3.9%，意味著年內可能有兩次 25 基點的降息。',
          evidence_ids: ['e1', 'e2'],
          icon: 'policy',
        },
        {
          step: 2,
          title: '資產價格重定價',
          summary: '利率敏感型資產大幅波動：黃金破歷史新高，科技股呈現「先跌後彈」的 V 型走勢。',
          detail: '黃金在避險需求與實際利率下行雙重推動下突破 $3,400。科技股方面，Mag 7 中僅 Tesla 周跌幅超過 3%，其餘個股在週三後均收復失地。加密貨幣市場同步反彈，比特幣重返 $95,000 上方。',
          evidence_ids: ['e3', 'e4', 'e5'],
          icon: 'auto_graph',
        },
        {
          step: 3,
          title: '跨市場傳導',
          summary: '美元走弱帶動亞洲貨幣普遍升值，離岸人民幣一度升破 7.18。',
          detail: '美元指數跌破 100 後，亞洲貨幣集體走強。離岸人民幣（CNH）周升 0.9%，一度觸及 7.1780。日圓受益於利差收窄預期，USD/JPY 從 145 回落至 142 附近。韓元、新台幣周升幅均在 1% 以上。',
          evidence_ids: ['e6'],
          icon: 'sync_alt',
        },
      ],
      conclusion: {
        summary: '聯儲鴿派轉向已成市場共識，資產價格正在經歷一轮以「降息預期」為核心的重定價。短線關注 5 月非農與 CPI 數據是否會動搖這一預期。',
        key_tags: ['FOMC', '降息定價', '黃金', '亞洲貨幣'],
        risk_factors: ['非農數據超預期', 'CPI 反彈', '關稅政策反覆'],
      },
      evidence_list: [
        { id: 'e1', type: 'news', source: 'Reuters', title: 'Fed holds rates steady, signals patience on inflation', date: '2026-05-01', url: 'https://reuters.com/fed-rates-0501' },
        { id: 'e2', type: 'news', source: 'Financial Times', title: 'Fed dot plot hints at two rate cuts this year', date: '2026-05-01', url: 'https://ft.com/dot-plot-0501' },
        { id: 'e3', type: 'data', source: 'CoinMarketCap', indicator: 'Bitcoin Price', value: '$95,400', trend: 'up', unit: 'USD' },
        { id: 'e4', type: 'data', source: 'World Gold Council', indicator: 'Gold Spot Price', value: '$3,425', trend: 'up', unit: 'USD/oz' },
        { id: 'e5', type: 'news', source: 'CNBC', title: 'Mag 7 stocks recover after initial Fed-driven sell-off', date: '2026-04-30', url: 'https://cnbc.com/mag7-recovery-0430' },
        { id: 'e6', type: 'data', source: 'Bloomberg', indicator: 'USD/CNH', value: '7.1780', trend: 'down', unit: '' },
      ],
      disclaimer: '本分析僅基於公開新聞與數據進行客觀整理，不構成任何投資建議。',
    },
  },
  // Topic 1 — MiniMax-M2
  {
    topic_index: 0,
    model_name: 'MiniMax-M2',
    model_provider: 'minimax',
    model_icon: '⚡',
    confidence_score: 0.79,
    analysis_chain: {
      version: '1.0',
      logic_chain: [
        {
          step: 1,
          title: '聲明措辭變化',
          summary: 'FOMC 聲明刪除「通脹仍處高位」措辭，為 2024 年以來首次，信號意義顯著。',
          detail: '對比 3 月會議聲明，本次聲明最關鍵的變化在於刪除了「通脹仍處高位（elevated）」的表述，改為「略高於目標（somewhat above target）」。這一措辭微調在歷史上往往預示著政策轉向的臨近。',
          evidence_ids: ['e1'],
          icon: 'edit_note',
        },
        {
          step: 2,
          title: '市場情緒指標',
          summary: 'VIX 指數周初飆升至 28 後回落至 19，顯示市場對不確定性的消化速度加快。',
          detail: 'VIX 在 FOMC 決議前一度觸及 28，為 2026 年以來高點，但決議後迅速回落至 19 附近。這種「先升後降」的模式表明，市場對聯儲政策的解讀偏向正面，不確定性溢價快速消退。',
          evidence_ids: ['e2', 'e3'],
          icon: 'mood',
        },
        {
          step: 3,
          title: '板塊輪動觀察',
          summary: '資金從防禦性板塊（公用事業、醫療保健）流向週期性板塊（金融、工業）。',
          detail: '標普 500 板塊表現分化明顯：金融板塊（+2.1%）和工業板塊（+1.8%）領漲，受益於降息預期下借貸成本下降的預期。公用事業（-0.5%）和醫療保健（-0.3%）則表現落後，顯示資金從防禦性配置中流出。',
          evidence_ids: ['e4'],
          icon: 'donut_large',
        },
      ],
      conclusion: {
        summary: '本次 FOMC 會議標誌著聯儲正式進入「降息觀察期」。市場情緒迅速修復，資金開始從防禦向週期輪動。後續關注 5 月非農數據與通脹數據是否能支撐當前的樂觀預期。',
        key_tags: ['FOMC', '板塊輪動', 'VIX', '週期股'],
        risk_factors: ['非農超預期', '通脹數據反彈', '關稅不確定性'],
      },
      evidence_list: [
        { id: 'e1', type: 'news', source: 'Reuters', title: 'Fed holds rates steady, signals patience on inflation', date: '2026-05-01', url: 'https://reuters.com/fed-rates-0501' },
        { id: 'e2', type: 'data', source: 'CBOE', indicator: 'VIX Index', value: '19.2', trend: 'down', unit: '' },
        { id: 'e3', type: 'news', source: 'MarketWatch', title: 'VIX spike before Fed meeting quickly reverses', date: '2026-04-30', url: 'https://marketwatch.com/vix-spike-0430' },
        { id: 'e4', type: 'data', source: 'S&P Global', indicator: 'S&P 500 Sector Performance', value: 'Financials +2.1%', trend: 'up', unit: '' },
      ],
      disclaimer: '本分析僅基於公開新聞與數據進行客觀整理，不構成任何投資建議。',
    },
  },
  // Topic 2 — Claude
  {
    topic_index: 1,
    model_name: 'Claude-3.7-Sonnet',
    model_provider: 'anthropic',
    model_icon: '🎯',
    confidence_score: 0.85,
    analysis_chain: {
      version: '1.0',
      logic_chain: [
        {
          step: 1,
          title: '財報核心數據',
          summary: '阿里雲收入同比增長 18%，AI 相關收入連續六季度三位數增長；騰訊廣告收入超預期 8%。',
          detail: '阿里巴巴 FY2026 Q1 財報顯示，阿里雲智能集團收入達到 321 億元人民幣，同比增長 18%，其中 AI 相關產品收入連續第六個季度保持三位數增長。騰訊 Q1 網絡廣告收入 365 億元，同比增長 20%，超出市場預期約 8%。',
          evidence_ids: ['e1', 'e2'],
          icon: 'assessment',
        },
        {
          step: 2,
          title: '資本開支趨勢',
          summary: '三大科技巨頭 Q1 資本開支合計同比增長 45%，AI 基礎設施投資成為最大支出項。',
          detail: '阿里、騰訊、美團 Q1 資本開支合計約 580 億元人民幣，同比增長 45%。其中阿里資本開支 240 億元（主要用於 AI 基礎設施），騰訊 180 億元（服務器與 GPU 採購），美團 160 億元（無人配送與 AI 研發）。',
          evidence_ids: ['e3'],
          icon: 'account_balance',
        },
        {
          step: 3,
          title: '市場反應與估值',
          summary: '港股科技指數單周上漲 4.2%，北水淨流入創 3 個月新高，估值修復邏輯持續。',
          detail: '恒生科技指數單周上漲 4.2%，收復 20,000 點整數關口。港股通南向資金單周淨流入 420 億港元，為 2026 年 2 月以來最高。科技股 forward PE 從 18x 修復至 20x，但仍低於 2021 年均值的 28x。',
          evidence_ids: ['e4', 'e5'],
          icon: 'trending_up',
        },
      ],
      conclusion: {
        summary: '中國科技巨頭財報整體超預期，AI 業務成為增長新引擎。資本開支的持續加碼顯示行業對 AI 變現能力的信心。港股科技板塊估值修復空間仍在，但需關注地緣政策風險對外資流向的影響。',
        key_tags: ['科技財報', '阿里雲', 'AI 變現', '港股通'],
        risk_factors: ['地緣政策不確定性', '外資流向波動', 'AI 投入回報週期'],
      },
      evidence_list: [
        { id: 'e1', type: 'news', source: 'South China Morning Post', title: 'Alibaba cloud revenue jumps 18% on AI demand', date: '2026-04-24', url: 'https://scmp.com/alibaba-cloud-0424' },
        { id: 'e2', type: 'news', source: 'Bloomberg', title: 'Tencent ad revenue beats estimates by 8%', date: '2026-04-23', url: 'https://bloomberg.com/tencent-ad-0423' },
        { id: 'e3', type: 'data', source: 'Company Filings', indicator: 'Big 3 Tech Capex', value: '¥58B', trend: 'up', unit: 'RMB' },
        { id: 'e4', type: 'data', source: 'HKEX', indicator: 'Southbound Net Inflow', value: '¥42B', trend: 'up', unit: 'HKD' },
        { id: 'e5', type: 'data', source: 'Bloomberg', indicator: 'Hang Seng Tech Index', value: '20,150', trend: 'up', unit: '' },
      ],
      disclaimer: '本分析僅基於公開新聞與數據進行客觀整理，不構成任何投資建議。',
    },
  },
];

const sampleTags = [
  { topic_index: 0, tag: '美聯儲', tag_type: 'system' },
  { topic_index: 0, tag: '利率', tag_type: 'system' },
  { topic_index: 0, tag: '黃金', tag_type: 'system' },
  { topic_index: 0, tag: '美元', tag_type: 'system' },
  { topic_index: 0, tag: '波動率', tag_type: 'system' },
  { topic_index: 1, tag: '科技財報', tag_type: 'system' },
  { topic_index: 1, tag: '阿里雲', tag_type: 'system' },
  { topic_index: 1, tag: '港股', tag_type: 'system' },
  { topic_index: 1, tag: 'AI', tag_type: 'system' },
  { topic_index: 1, tag: '南向資金', tag_type: 'system' },
];

async function seed() {
  console.log('🌱 開始插入種子數據...\n');

  try {
    // 清理舊數據（開發環境用）
    console.log('🧹 清理舊數據...');
    await query('DELETE FROM topic_interactions WHERE topic_id IN (SELECT id FROM weekly_topics WHERE title LIKE \'%美聯儲%\' OR title LIKE \'%科技%\')');
    await query('DELETE FROM analysis_views WHERE topic_id IN (SELECT id FROM weekly_topics WHERE title LIKE \'%美聯儲%\' OR title LIKE \'%科技%\')');
    await query('DELETE FROM topic_tags WHERE topic_id IN (SELECT id FROM weekly_topics WHERE title LIKE \'%美聯儲%\' OR title LIKE \'%科技%\')');
    await query('DELETE FROM ai_analyses WHERE topic_id IN (SELECT id FROM weekly_topics WHERE title LIKE \'%美聯儲%\' OR title LIKE \'%科技%\')');
    await query('DELETE FROM weekly_topics WHERE title LIKE \'%美聯儲%\' OR title LIKE \'%科技%\'');
    console.log('✅ 舊數據清理完成');

    // 插入話題
    const topicIds = [];
    for (const topic of sampleTopics) {
      const result = await query(
        `INSERT INTO weekly_topics (week_start, week_end, title, description, status, market)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [topic.week_start, topic.week_end, topic.title, topic.description, topic.status, topic.market]
      );
      topicIds.push(result.rows[0].id);
      console.log(`✅ 插入話題: ${topic.title} (ID: ${result.rows[0].id})`);
    }

    // 插入分析
    for (const analysis of sampleAnalyses) {
      const topicId = topicIds[analysis.topic_index];
      await query(
        `INSERT INTO ai_analyses (topic_id, model_name, model_provider, model_icon, analysis_chain, confidence_score, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [topicId, analysis.model_name, analysis.model_provider, analysis.model_icon,
         JSON.stringify(analysis.analysis_chain), analysis.confidence_score, 'published']
      );
      console.log(`✅ 插入分析: ${analysis.model_name} for topic ${topicId}`);
    }

    // 插入標籤
    for (const tag of sampleTags) {
      const topicId = topicIds[tag.topic_index];
      const existingTag = await query(
        `SELECT id FROM topic_tags WHERE topic_id = $1 AND tag = $2 AND user_id IS NULL`,
        [topicId, tag.tag]
      );
      if (existingTag.rows.length === 0) {
        await query(
          `INSERT INTO topic_tags (topic_id, tag, tag_type) VALUES ($1, $2, $3)`,
          [topicId, tag.tag, tag.tag_type]
        );
      }
    }
    console.log(`✅ 插入 ${sampleTags.length} 個標籤`);

    // 插入示例訪問記錄
    const demoSession = 'demo-session-' + Date.now();
    for (let i = 0; i < 5; i++) {
      await query(
        `INSERT INTO analysis_views (topic_id, session_id, ip_hash, user_agent_hash, referrer)
         VALUES ($1, $2, $3, $4, $5)`,
        [topicIds[0], demoSession + '-' + i, hash('192.168.1.' + i), hash('Mozilla/5.0'), 'direct']
      );
    }
    console.log('✅ 插入 5 條示例訪問記錄');

    // 驗證數據
    console.log('\n📊 數據驗證:');
    const topicCount = await query('SELECT COUNT(*) FROM weekly_topics');
    const analysisCount = await query('SELECT COUNT(*) FROM ai_analyses');
    const tagCount = await query('SELECT COUNT(*) FROM topic_tags');
    const viewCount = await query('SELECT COUNT(*) FROM analysis_views');

    console.log(`  weekly_topics: ${topicCount.rows[0].count}`);
    console.log(`  ai_analyses: ${analysisCount.rows[0].count}`);
    console.log(`  topic_tags: ${tagCount.rows[0].count}`);
    console.log(`  analysis_views: ${viewCount.rows[0].count}`);

    console.log('\n🎉 種子數據插入完成！');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 種子數據插入失敗:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
