import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogicStep, Evidence } from '../../types/intelligence';
import { EvidencePanel } from './EvidencePanel';

interface LogicChainProps {
  steps: LogicStep[];
  evidenceList: Evidence[];
}

const STEP_ICONS: Record<string, string> = {
  globe: 'public',
  trending_up: 'trending_up',
  insights: 'insights',
  warning: 'warning',
  policy: 'policy',
  auto_graph: 'auto_graph',
  sync_alt: 'sync_alt',
  edit_note: 'edit_note',
  mood: 'mood',
  donut_large: 'donut_large',
  assessment: 'assessment',
  account_balance: 'account_balance',
};

export const LogicChain: React.FC<LogicChainProps> = ({ steps, evidenceList }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (stepNum: number) => {
    setExpandedStep(expandedStep === stepNum ? null : stepNum);
  };

  return (
    <div className="logic-chain">
      <div className="logic-chain-line" />

      <div className="logic-chain-steps">
        {steps.map((step, index) => {
          const isExpanded = expandedStep === step.step;
          const hasEvidence = step.evidence_ids && step.evidence_ids.length > 0;
          const iconName = STEP_ICONS[step.icon] || 'radio_button_checked';

          return (
            <motion.div
              key={step.step}
              className={`logic-step ${isExpanded ? 'expanded' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
            >
              <div className="logic-step-node" onClick={() => toggleStep(step.step)}>
                <motion.div
                  className="logic-step-circle"
                  whileHover={{ scale: 1.15 }}
                  animate={isExpanded ? { boxShadow: '0 0 20px rgba(96,165,250,0.5)' } : {}}
                >
                  <span className="material-symbols-outlined">{iconName}</span>
                </motion.div>
                <div className="logic-step-number">{String(step.step).padStart(2, '0')}</div>
              </div>

              <div className="logic-step-body" onClick={() => toggleStep(step.step)}>
                <div className="logic-step-header">
                  <h4 className="logic-step-title">{step.title}</h4>
                  {hasEvidence && (
                    <span className="logic-step-evidence-badge">
                      <span className="material-symbols-outlined">fact_check</span>
                      {step.evidence_ids.length} 條證據
                    </span>
                  )}
                </div>
                <p className="logic-step-summary">{step.summary}</p>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="logic-step-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p>{step.detail}</p>
                      {hasEvidence && (
                        <EvidencePanel
                          evidenceList={evidenceList}
                          activeEvidenceIds={step.evidence_ids}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="logic-step-toggle">
                <motion.span
                  className="material-symbols-outlined"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  expand_more
                </motion.span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
