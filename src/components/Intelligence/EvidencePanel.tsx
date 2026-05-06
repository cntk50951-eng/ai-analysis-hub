import React from 'react';
import { motion } from 'framer-motion';
import type { Evidence } from '../../types/intelligence';

interface EvidencePanelProps {
  evidenceList: Evidence[];
  activeEvidenceIds: string[];
}

const TREND_ICONS: Record<string, string> = {
  up: 'trending_up',
  down: 'trending_down',
  flat: 'trending_flat',
};

const TREND_COLORS: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  flat: '#94a3b8',
};

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidenceList, activeEvidenceIds }) => {
  const activeEvidence = evidenceList.filter((e) => activeEvidenceIds.includes(e.id));

  if (activeEvidence.length === 0) return null;

  return (
    <motion.div
      className="evidence-panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="evidence-panel-header">
        <span className="material-symbols-outlined">fact_check</span>
        <span>相關證據 ({activeEvidence.length})</span>
      </div>
      <div className="evidence-grid">
        {activeEvidence.map((ev, i) => (
          <motion.div
            key={ev.id}
            className={`evidence-card evidence-card--${ev.type}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            <div className="evidence-card-type">
              {ev.type === 'news' ? (
                <span className="material-symbols-outlined">newspaper</span>
              ) : (
                <span className="material-symbols-outlined">database</span>
              )}
              <span className="evidence-source">{ev.source}</span>
            </div>

            {ev.type === 'news' ? (
              <>
                <div className="evidence-title">{ev.title}</div>
                <div className="evidence-meta">
                  {ev.date && <span className="evidence-date">{ev.date}</span>}
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="evidence-link">
                      查看原文 <span className="material-symbols-outlined">open_in_new</span>
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="evidence-indicator">{ev.indicator}</div>
                <div className="evidence-value-row">
                  <span className="evidence-value">{ev.value}</span>
                  {ev.trend && (
                    <span
                      className="evidence-trend"
                      style={{ color: TREND_COLORS[ev.trend] }}
                    >
                      <span className="material-symbols-outlined">{TREND_ICONS[ev.trend]}</span>
                    </span>
                  )}
                  {ev.unit && <span className="evidence-unit">{ev.unit}</span>}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
