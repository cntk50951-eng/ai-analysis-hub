import React from 'react';

export const ComplianceBanner: React.FC = () => {
  return (
    <div className="intelligence-compliance-banner">
      <span className="material-symbols-outlined">warning</span>
      <span>
        本頁面所有 AI 分析僅基於公開新聞與數據進行客觀事實整理，不構成任何投資建議、要約或推薦。
        過往表現並不代表未來結果，投資涉及風險。
      </span>
    </div>
  );
};
