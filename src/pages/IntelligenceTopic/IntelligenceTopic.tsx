import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntelligenceStore } from '../../store/useIntelligenceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ComplianceBanner } from '../../components/Intelligence/ComplianceBanner';
import { ModelSelector } from '../../components/Intelligence/ModelSelector';
import { LogicChain } from '../../components/Intelligence/LogicChain';
import { ConclusionCard } from '../../components/Intelligence/ConclusionCard';
import { ConfidenceRing } from '../../components/Intelligence/ConfidenceRing';
import { TopicTags } from '../../components/Intelligence/TopicTags';
import type { AIAnalysis } from '../../types/intelligence';
import './IntelligenceTopic.css';

function generateSessionId() {
  return 'sess-' + Math.random().toString(36).substring(2, 15);
}

const IntelligenceTopic: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentTopic,
    userInteractions,
    loading,
    fetchTopicDetail,
    recordView,
    addTag,
    toggleBookmark,
    fetchInteractions,
  } = useIntelligenceStore();

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const viewRecorded = useRef(false);

  const id = parseInt(topicId || '0');

  useEffect(() => {
    if (id) {
      fetchTopicDetail(id);
    }
  }, [id, fetchTopicDetail]);

  useEffect(() => {
    if (currentTopic && !viewRecorded.current) {
      viewRecorded.current = true;
      recordView(id, {
        session_id: sessionId,
        user_id: user?.uid || null,
        referrer: document.referrer || 'direct',
      });
    }
  }, [currentTopic, id, recordView, sessionId, user]);

  useEffect(() => {
    if (user?.uid && id) {
      fetchInteractions(id, user.uid);
    }
  }, [user, id, fetchInteractions]);

  useEffect(() => {
    if (currentTopic?.analyses?.length && !selectedAnalysisId) {
      setSelectedAnalysisId(currentTopic.analyses[0].id);
    }
  }, [currentTopic, selectedAnalysisId]);

  const selectedAnalysis: AIAnalysis | undefined = useMemo(() => {
    return currentTopic?.analyses?.find((a) => a.id === selectedAnalysisId);
  }, [currentTopic, selectedAnalysisId]);

  const handleTagAdd = async (tag: string) => {
    if (user?.uid && id) {
      await addTag(id, tag, user.uid);
      fetchTopicDetail(id);
    }
  };

  const handleBookmark = async () => {
    if (user?.uid && id) {
      await toggleBookmark(id, user.uid);
    }
  };

  if (loading && !currentTopic) {
    return (
      <div className="intelligence-topic">
        <div className="it-loading">
          <div className="it-loading-spinner" />
          <span>加載分析中...</span>
        </div>
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="intelligence-topic">
        <div className="it-empty">
          <span className="material-symbols-outlined">error</span>
          <p>話題不存在或已被移除</p>
          <button className="it-back-btn" onClick={() => navigate('/intelligence')}>
            返回智析中心
          </button>
        </div>
      </div>
    );
  }

  const { topic, analyses, tags } = currentTopic;
  const isBookmarked = userInteractions[id]?.bookmarked || false;

  return (
    <div className="intelligence-topic">
      <ComplianceBanner />

      {/* Header */}
      <motion.header
        className="it-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="it-breadcrumb">
          <button onClick={() => navigate('/intelligence')}>
            <span className="material-symbols-outlined">arrow_back</span>
            智析中心
          </button>
          <span>/</span>
          <span className="it-breadcrumb-current">{topic.title}</span>
        </div>

        <div className="it-header-main">
          <div className="it-header-info">
            <div className="it-header-week">
              <span className="it-header-week-label">
                {topic.week_start} ~ {topic.week_end}
              </span>
              <span className={`it-header-market it-header-market--${topic.market.toLowerCase()}`}>
                {topic.market}
              </span>
            </div>
            <h1 className="it-header-title">{topic.title}</h1>
            <p className="it-header-desc">{topic.description}</p>
            <TopicTags
              tags={tags || []}
              topicId={id}
              userId={user?.uid}
              onTagAdd={handleTagAdd}
            />
          </div>

          <div className="it-header-actions">
            <motion.button
              className={`it-bookmark-btn ${isBookmarked ? 'active' : ''}`}
              onClick={handleBookmark}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              title={isBookmarked ? '取消收藏' : '收藏'}
            >
              <span className="material-symbols-outlined">
                {isBookmarked ? 'bookmark' : 'bookmark_border'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Model Selector */}
      {analyses.length > 0 && (
        <motion.section
          className="it-model-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <ModelSelector
            models={analyses}
            selectedId={selectedAnalysisId || analyses[0]?.id}
            onSelect={setSelectedAnalysisId}
          />
        </motion.section>
      )}

      {/* Analysis Content */}
      <AnimatePresence mode="wait">
        {selectedAnalysis && (
          <motion.div
            key={selectedAnalysis.id}
            className="it-analysis"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Analysis Meta */}
            <div className="it-analysis-meta">
              <div className="it-analysis-model">
                <span className="it-analysis-icon">{selectedAnalysis.model_icon}</span>
                <div>
                  <div className="it-analysis-name">{selectedAnalysis.model_name}</div>
                  <div className="it-analysis-provider">{selectedAnalysis.model_provider}</div>
                </div>
              </div>
              <ConfidenceRing score={selectedAnalysis.confidence_score} size={60} />
            </div>

            {/* Logic Chain */}
            <section className="it-section">
              <div className="it-section-header">
                <span className="material-symbols-outlined">account_tree</span>
                <h2>分析邏輯鏈</h2>
              </div>
              <LogicChain
                steps={selectedAnalysis.analysis_chain.logic_chain}
                evidenceList={selectedAnalysis.analysis_chain.evidence_list}
              />
            </section>

            {/* Conclusion */}
            <section className="it-section">
              <ConclusionCard
                conclusion={selectedAnalysis.analysis_chain.conclusion}
                disclaimer={selectedAnalysis.analysis_chain.disclaimer}
              />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Disclaimer */}
      <div className="it-bottom-disclaimer">
        <span className="material-symbols-outlined">verified</span>
        <span>
          以上內容由 {selectedAnalysis?.model_name || 'AI'} 基於公開資料生成，僅供參考，不構成任何投資建議。
        </span>
      </div>
    </div>
  );
};

export default IntelligenceTopic;
