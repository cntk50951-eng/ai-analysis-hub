import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { StatCard } from '../../components/AdminIntelligence/StatCard';
import { TopicForm } from '../../components/AdminIntelligence/TopicForm';
import { AnalysisForm } from '../../components/AdminIntelligence/AnalysisForm';
import './AdminIntelligence.css';

const ADMIN_EMAIL = 'cntk50951@gmail.com';
const API_BASE = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

type TabId = 'dashboard' | 'topics' | 'analyses' | 'import';

interface Topic {
  id: number;
  week_start: string;
  week_end: string;
  title: string;
  description: string;
  status: string;
  market: string;
  analysis_count: number;
  view_count: number;
}

interface Analysis {
  id: number;
  topic_id: number;
  model_name: string;
  model_provider: string;
  model_icon: string;
  confidence_score: number;
  status: string;
}

interface Stats {
  counts: { topics: number; analyses: number; views: number; tags: number; interactions: number };
  topTopics: { id: number; title: string; view_count: number }[];
  recentViews: { date: string; count: number }[];
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: '數據概覽', icon: 'dashboard' },
  { id: 'topics', label: '話題管理', icon: 'topic' },
  { id: 'analyses', label: 'AI 分析管理', icon: 'psychology' },
  { id: 'import', label: '批量導入', icon: 'upload_file' },
];

const AdminIntelligence: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [_isLoading, setIsLoading] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<Analysis | null>(null);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);

  // 管理員權限檢查
  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      // 非管理員重定向（延遲避免閃爍）
      const timer = setTimeout(() => navigate('/intelligence'), 500);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const apiHeaders = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/intelligence?stats=true`, { headers: apiHeaders });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (e) {
      console.error('Fetch stats failed:', e);
    }
  };

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/intelligence?limit=50`, { headers: apiHeaders });
      const json = await res.json();
      if (json.success) setTopics(json.data.topics);
    } catch (e) {
      console.error('Fetch topics failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalyses = async (topicId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/intelligence?action=analyses?topic_id=${topicId}`, { headers: apiHeaders });
      const json = await res.json();
      if (json.success) setAnalyses(json.data.analyses);
    } catch (e) {
      console.error('Fetch analyses failed:', e);
    }
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchStats();
      fetchTopics();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'analyses' && selectedTopicId) {
      fetchAnalyses(selectedTopicId);
    }
  }, [activeTab, selectedTopicId]);

  const handleTopicSubmit = async (data: any) => {
    const url = editingTopic
      ? `${API_BASE}/api/v1/admin/intelligence?id=${editingTopic.id}`
      : `${API_BASE}/api/v1/admin/intelligence`;
    const method = editingTopic ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: apiHeaders, body: JSON.stringify(data) });
      if (res.ok) {
        setShowTopicForm(false);
        setEditingTopic(null);
        fetchTopics();
        fetchStats();
      }
    } catch (e) {
      console.error('Topic submit failed:', e);
    }
  };

  const handleTopicDelete = async (id: number) => {
    if (!confirm('確定刪除此話題？關聯的分析和標籤也會被刪除。')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/intelligence?id=${id}`, {
        method: 'DELETE',
        headers: apiHeaders,
      });
      if (res.ok) {
        fetchTopics();
        fetchStats();
      }
    } catch (e) {
      console.error('Topic delete failed:', e);
    }
  };

  const handleAnalysisSubmit = async (data: any) => {
    const url = editingAnalysis
      ? `${API_BASE}/api/v1/admin/intelligence?action=analyses?id=${editingAnalysis.id}`
      : `${API_BASE}/api/v1/admin/intelligence?action=analyses`;
    const method = editingAnalysis ? 'PUT' : 'POST';

    try {
      const payload = { ...data, analysis_chain: JSON.parse(data.analysis_chain) };
      const res = await fetch(url, { method, headers: apiHeaders, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowAnalysisForm(false);
        setEditingAnalysis(null);
        if (selectedTopicId) fetchAnalyses(selectedTopicId);
        fetchStats();
      }
    } catch (e) {
      console.error('Analysis submit failed:', e);
    }
  };

  const handleAnalysisDelete = async (id: number) => {
    if (!confirm('確定刪除此分析？')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/intelligence?action=analyses?id=${id}`, {
        method: 'DELETE',
        headers: apiHeaders,
      });
      if (res.ok && selectedTopicId) {
        fetchAnalyses(selectedTopicId);
        fetchStats();
      }
    } catch (e) {
      console.error('Analysis delete failed:', e);
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importJson);
      let created = 0;

      for (const item of Array.isArray(data) ? data : [data]) {
        // 創建話題
        const topicRes = await fetch(`${API_BASE}/api/v1/admin/intelligence`, {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({
            week_start: item.week_start,
            week_end: item.week_end,
            title: item.title,
            description: item.description,
            status: item.status || 'published',
            market: item.market || 'US',
          }),
        });
        const topicJson = await topicRes.json();
        if (topicJson.success) {
          created++;
          // 創建分析
          if (item.analyses) {
            for (const a of item.analyses) {
              await fetch(`${API_BASE}/api/v1/admin/intelligence?action=analyses`, {
                method: 'POST',
                headers: apiHeaders,
                body: JSON.stringify({
                  topic_id: topicJson.data.topic.id,
                  model_name: a.model_name,
                  model_provider: a.model_provider,
                  model_icon: a.model_icon,
                  analysis_chain: a.analysis_chain,
                  confidence_score: a.confidence_score,
                  status: a.status || 'published',
                }),
              });
            }
          }
        }
      }

      setImportResult(`成功導入 ${created} 個話題`);
      setImportJson('');
      fetchTopics();
      fetchStats();
    } catch (e: any) {
      setImportResult('導入失敗: ' + e.message);
    }
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-unauthorized">
        <span className="material-symbols-outlined">lock</span>
        <h2>未授權訪問</h2>
        <p>此頁面僅限管理員訪問</p>
        <button onClick={() => navigate('/intelligence')}>返回智析中心</button>
      </div>
    );
  }

  return (
    <div className="admin-intelligence">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="material-symbols-outlined">admin_panel_settings</span>
          <span>管理後台</span>
        </div>
        <nav className="admin-sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin-sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-sidebar-link" onClick={() => navigate('/intelligence')}>
            <span className="material-symbols-outlined">arrow_back</span>
            返回前台
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <AnimatePresence mode="wait">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              className="admin-tab-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <h2 className="admin-page-title">數據概覽</h2>
              <div className="admin-stats-grid">
                <StatCard icon="topic" label="話題總數" value={stats?.counts.topics || 0} color="#60a5fa" />
                <StatCard icon="psychology" label="AI 分析數" value={stats?.counts.analyses || 0} color="#a78bfa" />
                <StatCard icon="visibility" label="總瀏覽量" value={stats?.counts.views || 0} color="#4ade80" />
                <StatCard icon="sell" label="標籤數量" value={stats?.counts.tags || 0} color="#f472b6" />
                <StatCard icon="interests" label="互動次數" value={stats?.counts.interactions || 0} color="#fbbf24" />
              </div>

              <div className="admin-section-row">
                <div className="admin-section">
                  <h3>熱門話題 TOP 10</h3>
                  <div className="admin-rank-list">
                    {(stats?.topTopics || []).map((t, i) => (
                      <div key={t.id} className="admin-rank-item">
                        <span className="admin-rank-num">{i + 1}</span>
                        <span className="admin-rank-title">{t.title}</span>
                        <span className="admin-rank-value">{t.view_count} 瀏覽</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="admin-section">
                  <h3>近 30 日訪問趨勢</h3>
                  <div className="admin-trend-list">
                    {(stats?.recentViews || []).slice(0, 14).map((v) => (
                      <div key={v.date} className="admin-trend-item">
                        <span className="admin-trend-date">{v.date}</span>
                        <div className="admin-trend-bar">
                          <motion.div
                            className="admin-trend-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((parseInt(String(v.count)) / (Math.max(...(stats?.recentViews?.map(r => parseInt(String(r.count))) || [1]))) * 100), 100)}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="admin-trend-value">{v.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Topics */}
          {activeTab === 'topics' && (
            <motion.div
              key="topics"
              className="admin-tab-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="admin-page-header">
                <h2 className="admin-page-title">話題管理</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => { setEditingTopic(null); setShowTopicForm(true); }}>
                  <span className="material-symbols-outlined">add</span>
                  新建話題
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>週次</th>
                      <th>標題</th>
                      <th>市場</th>
                      <th>狀態</th>
                      <th>分析</th>
                      <th>瀏覽</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.week_start}</td>
                        <td className="admin-table-title">{t.title}</td>
                        <td>
                          <span className={`admin-badge admin-badge--${t.market.toLowerCase()}`}>{t.market}</span>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge--${t.status}`}>{t.status}</span>
                        </td>
                        <td>{t.analysis_count}</td>
                        <td>{t.view_count}</td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              className="admin-icon-btn"
                              onClick={() => { setEditingTopic(t); setShowTopicForm(true); }}
                              title="編輯"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className="admin-icon-btn admin-icon-btn--danger"
                              onClick={() => handleTopicDelete(t.id)}
                              title="刪除"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Analyses */}
          {activeTab === 'analyses' && (
            <motion.div
              key="analyses"
              className="admin-tab-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="admin-page-header">
                <h2 className="admin-page-title">AI 分析管理</h2>
                <div className="admin-page-actions">
                  <select
                    className="admin-select"
                    value={selectedTopicId || ''}
                    onChange={(e) => setSelectedTopicId(Number(e.target.value))}
                  >
                    <option value="">選擇話題...</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
                    ))}
                  </select>
                  {selectedTopicId && (
                    <button
                      className="admin-btn admin-btn--primary"
                      onClick={() => { setEditingAnalysis(null); setShowAnalysisForm(true); }}
                    >
                      <span className="material-symbols-outlined">add</span>
                      新建分析
                    </button>
                  )}
                </div>
              </div>

              {selectedTopicId ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>模型</th>
                        <th>提供商</th>
                        <th>置信度</th>
                        <th>狀態</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.map((a) => (
                        <tr key={a.id}>
                          <td>{a.id}</td>
                          <td>
                            <span className="admin-model-cell">
                              <span className="admin-model-icon">{a.model_icon}</span>
                              {a.model_name}
                            </span>
                          </td>
                          <td>{a.model_provider}</td>
                          <td>{(a.confidence_score * 100).toFixed(0)}%</td>
                          <td>
                            <span className={`admin-badge admin-badge--${a.status}`}>{a.status}</span>
                          </td>
                          <td>
                            <div className="admin-table-actions">
                              <button
                                className="admin-icon-btn"
                                onClick={() => { setEditingAnalysis(a); setShowAnalysisForm(true); }}
                                title="編輯"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button
                                className="admin-icon-btn admin-icon-btn--danger"
                                onClick={() => handleAnalysisDelete(a.id)}
                                title="刪除"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analyses.length === 0 && (
                    <div className="admin-empty">暫無分析數據</div>
                  )}
                </div>
              ) : (
                <div className="admin-empty">請先選擇一個話題</div>
              )}
            </motion.div>
          )}

          {/* Import */}
          {activeTab === 'import' && (
            <motion.div
              key="import"
              className="admin-tab-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <h2 className="admin-page-title">批量導入</h2>
              <div className="admin-import-area">
                <p className="admin-import-hint">
                  粘貼 JSON 數組，每個元素為一個話題對象（可包含 analyses 數組）。
                  <br />
                  格式參考 seed-intelligence.js 中的數據結構。
                </p>
                <textarea
                  className="admin-import-editor"
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder={`[\n  {\n    "week_start": "2026-05-04",\n    "week_end": "2026-05-10",\n    "title": "...",\n    "description": "...",\n    "market": "US",\n    "analyses": [...]\n  }\n]`}
                  rows={20}
                  spellCheck={false}
                />
                <div className="admin-import-actions">
                  <button className="admin-btn admin-btn--primary" onClick={handleImport}>
                    <span className="material-symbols-outlined">upload</span>
                    開始導入
                  </button>
                  {importResult && (
                    <span className={`admin-import-result ${importResult.includes('失敗') ? 'error' : 'success'}`}>
                      {importResult}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showTopicForm && (
          <TopicForm
            initial={editingTopic || undefined}
            onSubmit={handleTopicSubmit}
            onCancel={() => { setShowTopicForm(false); setEditingTopic(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnalysisForm && selectedTopicId && (
          <AnalysisForm
            topicId={selectedTopicId}
            initial={editingAnalysis || undefined}
            onSubmit={handleAnalysisSubmit}
            onCancel={() => { setShowAnalysisForm(false); setEditingAnalysis(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminIntelligence;
