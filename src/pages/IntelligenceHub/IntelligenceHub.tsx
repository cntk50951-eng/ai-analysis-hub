import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useIntelligenceStore } from '../../store/useIntelligenceStore';
import { useMarketStore } from '../../store/useMarketStore';
import { ComplianceBanner } from '../../components/Intelligence/ComplianceBanner';
import './IntelligenceHub.css';

const IntelligenceHub: React.FC = () => {
  const navigate = useNavigate();
  const { currentMarket } = useMarketStore();
  const { topics, totalTopics, loading, fetchTopics } = useIntelligenceStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics({ market: currentMarket, limit: 20 });
  }, [currentMarket, fetchTopics]);

  useEffect(() => {
    if (selectedTag) {
      fetchTopics({ market: currentMarket, limit: 20, tag: selectedTag });
    } else {
      fetchTopics({ market: currentMarket, limit: 20 });
    }
  }, [selectedTag, currentMarket, fetchTopics]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    topics.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).slice(0, 20);
  }, [topics]);

  const getWeekLabel = (start: string, _end: string) => {
    const s = new Date(start);
    const weekNum = Math.ceil((s.getTime() - new Date(s.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${s.getFullYear()} W${String(weekNum).padStart(2, '0')}`;
  };

  return (
    <div className="intelligence-hub">
      <ComplianceBanner />

      {/* Hero */}
      <section className="ih-hero">
        <motion.div
          className="ih-hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="ih-hero-title">
            <span className="material-symbols-outlined">psychology</span>
            AI 智析中心
          </h1>
          <p className="ih-hero-subtitle">
            每週精選話題 · 多模型交叉驗證 · 客觀事實整理
          </p>
        </motion.div>
      </section>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <motion.section
          className="ih-tag-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            className={`ih-tag-filter ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`ih-tag-filter ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </motion.section>
      )}

      {/* Topic Grid */}
      <section className="ih-grid">
        {loading && topics.length === 0 && (
          <div className="ih-loading">
            <div className="ih-loading-spinner" />
            <span>加載話題中...</span>
          </div>
        )}

        {topics.map((topic, index) => (
          <motion.article
            key={topic.id}
            className="ih-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
            onClick={() => navigate(`/intelligence/${topic.id}`)}
          >
            <div className="ih-card-week">
              <span className="ih-card-week-label">
                {getWeekLabel(topic.week_start, topic.week_end)}
              </span>
              <span className={`ih-card-market ih-card-market--${topic.market.toLowerCase()}`}>
                {topic.market}
              </span>
            </div>

            <h3 className="ih-card-title">{topic.title}</h3>
            <p className="ih-card-desc">{topic.description}</p>

            <div className="ih-card-tags">
              {topic.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="ih-card-tag">{tag}</span>
              ))}
            </div>

            <div className="ih-card-footer">
              <div className="ih-card-meta">
                <span className="ih-card-meta-item">
                  <span className="material-symbols-outlined">visibility</span>
                  {topic.view_count?.toLocaleString() || 0}
                </span>
                <span className="ih-card-meta-item">
                  <span className="material-symbols-outlined">smart_toy</span>
                  {topic.analysis_count || 0} 模型
                </span>
              </div>
              <span className="ih-card-arrow">
                <span className="material-symbols-outlined">arrow_forward</span>
              </span>
            </div>
          </motion.article>
        ))}
      </section>

      {!loading && topics.length === 0 && (
        <div className="ih-empty">
          <span className="material-symbols-outlined">inbox</span>
          <p>暫無話題數據</p>
        </div>
      )}

      {totalTopics > topics.length && (
        <div className="ih-loadmore">
          <button
            className="ih-loadmore-btn"
            onClick={() => fetchTopics({ market: currentMarket, limit: 20, offset: topics.length })}
            disabled={loading}
          >
            {loading ? '加載中...' : '加載更多'}
          </button>
        </div>
      )}
    </div>
  );
};

export default IntelligenceHub;
