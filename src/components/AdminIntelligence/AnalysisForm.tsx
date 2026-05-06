import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnalysisFormData {
  id?: number;
  topic_id: number;
  model_name: string;
  model_provider: string;
  model_icon: string;
  analysis_chain: string;
  confidence_score: number;
  status: string;
}

interface AnalysisFormProps {
  topicId: number;
  initial?: Partial<AnalysisFormData>;
  onSubmit: (data: AnalysisFormData) => void;
  onCancel: () => void;
}

const defaultChain = JSON.stringify({
  version: '1.0',
  logic_chain: [
    { step: 1, title: '步驟標題', summary: '一句話摘要', detail: '詳細分析內容...', evidence_ids: [], icon: 'globe' }
  ],
  conclusion: { summary: '綜合結論...', key_tags: [], risk_factors: [] },
  evidence_list: [],
  disclaimer: '本分析僅基於公開新聞與數據進行客觀整理，不構成任何投資建議。',
}, null, 2);

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ topicId, initial, onSubmit, onCancel }) => {
  const buildForm = (init?: Partial<AnalysisFormData>): AnalysisFormData => {
    const base: AnalysisFormData = {
      topic_id: topicId,
      model_name: '',
      model_provider: '',
      model_icon: '🧠',
      analysis_chain: defaultChain,
      confidence_score: 0.8,
      status: 'draft',
    };
    if (!init) return base;
    const chain = init.analysis_chain
      ? (typeof init.analysis_chain === 'string' ? init.analysis_chain : JSON.stringify(init.analysis_chain, null, 2))
      : defaultChain;
    return { ...base, ...init, analysis_chain: chain };
  };

  const [form, setForm] = useState<AnalysisFormData>(() => buildForm(initial));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm(buildForm(initial));
  }, [initial, topicId]);

  const handleChange = (field: keyof AnalysisFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.model_name) return;

    try {
      JSON.parse(form.analysis_chain);
      setJsonError(null);
      onSubmit(form);
    } catch (err: any) {
      setJsonError('JSON 格式錯誤: ' + err.message);
    }
  };

  return (
    <motion.div
      className="admin-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="admin-modal admin-modal--large"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3>{initial?.id ? '編輯 AI 分析' : '新建 AI 分析'}</h3>
          <button className="admin-modal-close" onClick={onCancel}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>模型名稱</label>
              <input
                type="text"
                value={form.model_name}
                onChange={(e) => handleChange('model_name', e.target.value)}
                placeholder="如 GPT-4o"
                required
              />
            </div>
            <div className="admin-form-field">
              <label>提供商</label>
              <select value={form.model_provider} onChange={(e) => handleChange('model_provider', e.target.value)}>
                <option value="">選擇...</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="minimax">MiniMax</option>
                <option value="google">Google</option>
              </select>
            </div>
            <div className="admin-form-field" style={{ maxWidth: 80 }}>
              <label>圖標</label>
              <input
                type="text"
                value={form.model_icon}
                onChange={(e) => handleChange('model_icon', e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>置信度 (0-1)</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.confidence_score}
                onChange={(e) => handleChange('confidence_score', parseFloat(e.target.value))}
              />
            </div>
            <div className="admin-form-field">
              <label>狀態</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
              </select>
            </div>
          </div>

          <div className="admin-form-field">
            <label>分析鏈 JSON</label>
            <textarea
              className={`admin-json-editor ${jsonError ? 'error' : ''}`}
              value={form.analysis_chain}
              onChange={(e) => handleChange('analysis_chain', e.target.value)}
              rows={16}
              spellCheck={false}
            />
            {jsonError && <div className="admin-form-error">{jsonError}</div>}
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="admin-btn admin-btn--primary">
              {initial?.id ? '保存修改' : '創建分析'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
