// ==========================================
// AI Analysis Hub — 獨立應用
// ==========================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntelligenceHub from './pages/IntelligenceHub/IntelligenceHub';
import IntelligenceTopic from './pages/IntelligenceTopic/IntelligenceTopic';
import AdminIntelligence from './pages/AdminIntelligence/AdminIntelligence';
import { useAuthStore } from './store/useAuthStore';
import './styles/global.css';

const App: React.FC = () => {
  const { initAuthListener } = useAuthStore();

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<IntelligenceHub />} />
          <Route path="/intelligence" element={<IntelligenceHub />} />
          <Route path="/intelligence/:topicId" element={<IntelligenceTopic />} />
          <Route path="/admin/intelligence" element={<AdminIntelligence />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
