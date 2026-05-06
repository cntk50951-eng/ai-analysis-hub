import React from 'react';
import { motion } from 'framer-motion';

interface Model {
  id: number;
  model_name: string;
  model_provider: string;
  model_icon: string;
  confidence_score: number;
}

interface ModelSelectorProps {
  models: Model[];
  selectedId: number;
  onSelect: (id: number) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10a37f',
  anthropic: '#d4a574',
  minimax: '#6366f1',
  google: '#4285f4',
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedId, onSelect }) => {
  return (
    <div className="model-selector">
      {models.map((model) => {
        const isActive = model.id === selectedId;
        const color = PROVIDER_COLORS[model.model_provider] || '#94a3b8';
        return (
          <motion.button
            key={model.id}
            className={`model-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(model.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={isActive ? { borderColor: color, boxShadow: `0 0 12px ${color}40` } : {}}
          >
            <span className="model-icon">{model.model_icon}</span>
            <span className="model-name">{model.model_name}</span>
            <span
              className="model-confidence"
              style={{ background: color + '20', color }}
            >
              {(model.confidence_score * 100).toFixed(0)}%
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
