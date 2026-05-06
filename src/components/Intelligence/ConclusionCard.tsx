import React from 'react';
import { motion } from 'framer-motion';
import type { Conclusion } from '../../types/intelligence';

interface ConclusionCardProps {
  conclusion: Conclusion;
  disclaimer: string;
}

export const ConclusionCard: React.FC<ConclusionCardProps> = ({ conclusion, disclaimer }) => {
  return (
    <motion.div
      className="conclusion-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="conclusion-glow-border" />
      <div className="conclusion-content">
        <div className="conclusion-header">
          <span className="material-symbols-outlined">lightbulb</span>
          <h3>綜合結論</h3>
        </div>

        <p className="conclusion-summary">{conclusion.summary}</p>

        {conclusion.key_tags && conclusion.key_tags.length > 0 && (
          <div className="conclusion-tags">
            {conclusion.key_tags.map((tag, i) => (
              <motion.span
                key={tag}
                className="conclusion-tag"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}

        {conclusion.risk_factors && conclusion.risk_factors.length > 0 && (
          <div className="conclusion-risks">
            <div className="conclusion-risks-title">
              <span className="material-symbols-outlined">warning</span>
              風險因素
            </div>
            <ul>
              {conclusion.risk_factors.map((risk, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  {risk}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        <div className="conclusion-disclaimer">
          <span className="material-symbols-outlined">info</span>
          {disclaimer}
        </div>
      </div>
    </motion.div>
  );
};
