import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TopicFormData {
  id?: number;
  week_start: string;
  week_end: string;
  title: string;
  description: string;
  cover_image_url: string;
  status: string;
  market: string;
}

interface TopicFormProps {
  initial?: Partial<TopicFormData>;
  onSubmit: (data: TopicFormData) => void;
  onCancel: () => void;
}

const emptyForm: TopicFormData = {
  week_start: '',
  week_end: '',
  title: '',
  description: '',
  cover_image_url: '',
  status: 'draft',
  market: 'US',
};

export const TopicForm: React.FC<TopicFormProps> = ({ initial, onSubmit, onCancel }) => {
  const [form, setForm] = useState<TopicFormData>({ ...emptyForm, ...initial });

  useEffect(() => {
    if (initial) setForm({ ...emptyForm, ...initial });
  }, [initial]);

  const handleChange = (field: keyof TopicFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.week_start || !form.week_end || !form.title) return;
    onSubmit(form);
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
        className="admin-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3>{initial?.id ? '編輯話題' : '新建話題'}</h3>
          <button className="admin-modal-close" onClick={onCancel}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>開始日期</label>
              <input
                type="date"
                value={form.week_start}
                onChange={(e) => handleChange('week_start', e.target.value)}
                required
              />
            </div>
            <div className="admin-form-field">
              <label>結束日期</label>
              <input
                type="date"
                value={form.week_end}
                onChange={(e) => handleChange('week_end', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-form-field">
            <label>標題</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="輸入話題標題"
              required
              maxLength={500}
            />
          </div>

          <div className="admin-form-field">
            <label>描述</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="輸入話題描述"
              rows={3}
            />
          </div>

          <div className="admin-form-field">
            <label>封面圖 URL</label>
            <input
              type="text"
              value={form.cover_image_url}
              onChange={(e) => handleChange('cover_image_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>狀態</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
                <option value="archived">已歸檔</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label>市場</label>
              <select value={form.market} onChange={(e) => handleChange('market', e.target.value)}>
                <option value="US">US</option>
                <option value="HK">HK</option>
                <option value="GLOBAL">GLOBAL</option>
              </select>
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="admin-btn admin-btn--primary">
              {initial?.id ? '保存修改' : '創建話題'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
