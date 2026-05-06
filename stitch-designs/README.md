# 🎨 Stitch Design 導入指南

## 📦 已導入文件

### 1. HTML 設計稿
- **文件**: `stitch-designs/dashboard-export.html`
- **來源**: Stitch Screen ID `a37d0a92813a454e920c1aab1256b711`
- **標題**: "2026 Investment Path Dashboard"
- **尺寸**: 2560 x 2460 (Desktop)

### 2. CSS 設計 Tokens
- **文件**: `stitch-designs/stitch-design-tokens.css`
- **包含**: 完整的 CSS 變數、組件樣式、動畫

---

## 🎨 設計系統規範

### 色彩系統

#### 表面色系 (Surface)
```css
--surface: #080e1a;              /* 主背景 - Deep Space */
--surface-container-low: #0d1320; /* 區域背景 */
--surface-container: #131a28;     /* 卡片背景 */
--surface-container-high: #18202f; /* 互動層 */
--surface-container-highest: #1e2637; /* 最高層 */
```

#### 主色調 (Primary - Indigo)
```css
--primary: #a3a6ff;
--primary-dim: #6063ee;
--primary-container: #9396ff;
```

#### 輔助色 (Secondary - Purple)
```css
--secondary: #c180ff;
--secondary-container: #6f00be;
```

#### 強調色 (Tertiary - Cyan)
```css
--tertiary: #7de9ff;
--tertiary-container: #3adffa;
```

#### 路徑顏色 (Investment Paths)
```css
--path-a: #10b981;    /* Green - Bullish */
--path-b: #f59e0b;    /* Amber - Neutral */
--path-c: #ff6e84;    /* Red - Bearish */
--path-d: #c180ff;    /* Purple - Volatile */
--path-e: #ec4899;    /* Pink - High Risk */
```

### 字體系統

```css
--font-headline: 'Space Grotesk', sans-serif;  /* 標題 */
--font-body: 'Inter', sans-serif;               /* 內文 */
--font-mono: 'JetBrains Mono', monospace;      /* 數據 */
```

### 圓角規範

```css
--radius-sm: 0.25rem;   /* 4px - 小元素 */
--radius-md: 0.5rem;    /* 8px - 按鈕 */
--radius-lg: 0.75rem;   /* 12px - 卡片 */
--radius-xl: 1rem;      /* 16px - 大卡片 */
--radius-full: 9999px;  /* Pill 形狀 */
```

---

## 🔧 使用方式

### 方式 1: 直接在現有項目中使用

#### Step 1: 引入 CSS Tokens
在 `src/index.css` 或全局樣式文件中引入：

```css
@import './stitch-designs/stitch-design-tokens.css';
```

#### Step 2: 更新 Tailwind 配置

在 `tailwind.config.js` 中添加 Stitch 設計 tokens：

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#080e1a',
        'surface-container-low': '#0d1320',
        'surface-container': '#131a28',
        'surface-container-high': '#18202f',
        'surface-container-highest': '#1e2637',
        primary: '#a3a6ff',
        'primary-dim': '#6063ee',
        'primary-container': '#9396ff',
        secondary: '#c180ff',
        tertiary: '#7de9ff',
        error: '#ff6e84',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'stitch': '0.75rem', // 12px
      },
    },
  },
  plugins: [],
}
```

#### Step 3: 添加字體

在 `index.html` 的 `<head>` 中添加：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

#### Step 4: 安裝 Material Symbols

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap">
```

---

### 方式 2: 創建新的 React 組件

#### 創建 Dashboard 組件結構

```tsx
// src/components/stitch/Dashboard.tsx
import React from 'react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  return (
    <div className="stitch-dashboard">
      {/* Header */}
      <header className="top-app-bar">
        <div className="logo">🦍 2026 Investment Path</div>
        <div className="tabs">
          <button className="tab active">Dashboard</button>
          <button className="tab">Timeline</button>
        </div>
      </header>

      {/* Macro Data Bar */}
      <div className="macro-bar">
        <div className="macro-item">
          <span className="label">INFLATION (CPI)</span>
          <span className="value error">+2.4%</span>
          <span className="material-symbols-outlined">trending_up</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Flow Diagram */}
        <section className="flow-section glass-panel">
          <h2>Celestial Flow Map</h2>
          {/* SVG Flow Diagram */}
        </section>

        {/* Switch Table */}
        <section className="switch-section glass-panel">
          <h3>Path Transition Matrix</h3>
          <table>
            {/* Table Content */}
          </table>
        </section>

        {/* News Sidebar */}
        <aside className="news-sidebar">
          <div className="news-card critical">
            <h4>News Title</h4>
            <p>Summary...</p>
          </div>
        </aside>
      </main>
    </div>
  );
};
```

#### 創建 CSS 文件

```css
/* src/components/stitch/Dashboard.css */
@import '../../stitch-designs/stitch-design-tokens.css';

.stitch-dashboard {
  min-height: 100vh;
  background-color: var(--surface);
}

.top-app-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4rem;
  background: rgba(8, 14, 26, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 50;
}

.macro-bar {
  position: fixed;
  top: 4rem;
  left: 0;
  right: 0;
  height: 2.5rem;
  background: var(--surface-container-lowest);
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 0 1.5rem;
  z-index: 40;
  border-bottom: 1px solid rgba(66, 72, 85, 0.15);
}

.dashboard-main {
  display: grid;
  grid-template-columns: 1fr 20rem;
  gap: 1.5rem;
  padding: 12rem 1.5rem 2rem;
  min-height: 100vh;
}

.glass-panel {
  background: rgba(30, 38, 55, 0.4);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: 2rem;
  border: 1px solid rgba(66, 72, 85, 0.1);
}
```

---

## 📐 佈局結構

### Desktop (≥1280px)
```
┌──────────────────────────────────────────────────┐
│  Header (4rem / 64px)                           │
├──────────────────────────────────────────────────┤
│  Macro Bar (2.5rem / 40px)                      │
├──────────────────────────┬───────────────────────┤
│                          │                       │
│  Flow Diagram (65%)      │  News Sidebar (35%)  │
│  - SVG Canvas            │  - Sticky scroll      │
│  - 5 Path Nodes          │  - 4-6 news cards    │
│  - Probability Bar       │                       │
├──────────────────────────┤                       │
│                          │                       │
│  Switch Table (65%)      │                       │
│  - Data table            │                       │
│  - Progress bars         │                       │
├──────────────────────────┤                       │
│  Detail Panel (65%)      │                       │
│  - Contextual details    │                       │
└──────────────────────────┴───────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────┐
│  Header             │
├─────────────────────┤
│  Macro Bar (scroll) │
├─────────────────────┤
│  Flow Diagram       │
│  (simplified)       │
├─────────────────────┤
│  News Feed          │
├─────────────────────┤
│  Switch Table       │
│  (horizontal scroll)│
├─────────────────────┤
│  Detail Panel       │
├─────────────────────┤
│  Bottom Nav         │
└─────────────────────┘
```

---

## 🎬 動畫規範

### 過渡時間
```css
--duration-instant: 100ms;   /* Hover states */
--duration-snappy: 200ms;    /* Button clicks */
--duration-smooth: 300ms;    /* Card expansions */
--duration-cinematic: 500ms; /* Page transitions */
```

### 緩動函數
```css
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
--ease-exit: cubic-bezier(0.16, 1, 0.3, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 標誌性動畫

1. **Flow Diagram Load**
```css
@keyframes drawPath {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.flow-path {
  animation: drawPath 1.5s ease-in-out;
}
```

2. **Node Pulse (Current Path)**
```css
@keyframes glowPulse {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.45; }
}

.node-current {
  animation: glowPulse 2s ease-in-out infinite;
}
```

3. **News Feed Stagger**
```css
.news-item {
  animation: slideIn 0.3s ease-out;
  animation-fill-mode: both;
}

.news-item:nth-child(1) { animation-delay: 0ms; }
.news-item:nth-child(2) { animation-delay: 30ms; }
.news-item:nth-child(3) { animation-delay: 60ms; }
/* ... */
```

---

## 🔍 組件對照表

| Stitch 組件 | 當前組件 | 重構優先級 |
|-----------|---------|-----------|
| TopAppBar | Dashboard header | High |
| Macro Data Bar | MacroBar | High |
| Flow Diagram | FlowDiagram | Critical |
| Probability Bar | ProbBar | High |
| Switch Table | SwitchTable | Medium |
| Detail Panel | DetailPanel | Medium |
| News Panel | NewsPanel | High |
| Side Navigation | (新增) | Low |

---

## 📋 重構檢查清單

### Phase 1: 基礎設施 (Week 1)
- [ ] 導入 CSS Tokens 到項目
- [ ] 更新 Tailwind 配置
- [ ] 添加 Google Fonts
- [ ] 創建基礎組件結構
- [ ] 設置顏色變數

### Phase 2: 核心組件 (Week 2)
- [ ] 重構 FlowDiagram 組件
- [ ] 重構 ProbBar 組件
- [ ] 重構 NewsPanel 組件
- [ ] 添加新的動畫系統

### Phase 3: 頁面整合 (Week 3)
- [ ] 重構 Dashboard 頁面
- [ ] 重構 NewsTimeline 頁面
- [ ] 添加側邊導航欄
- [ ] 響應式適配

### Phase 4: 優化測試 (Week 4)
- [ ] 性能優化
- [ ] 跨瀏覽器測試
- [ ] 無障礙測試
- [ ] 用戶測試

---

## 🎯 關鍵設計差異

### 從当前設計 → Stitch 設計

| 設計元素 | 當前 | Stitch | 變更 |
|---------|------|--------|------|
| 背景色 | `#080c18` | `#080e1a` | 微調 |
| 主色 | `#4ade80` (綠) | `#a3a6ff` (紫) | 全面更換 |
| 字體 | 系統字體 | Space Grotesk + Inter | 升級 |
| 卡片邊框 | 1px solid | 無邊框，色調區分 | 設計哲學變更 |
| 陰影 | 傳統陰影 | Ambient Glow | 科技感提升 |
| 圓角 | 8px | 12px | 更現代 |
| 動畫 | 基礎 | Framer Motion | 更流暢 |

---

## 🔗 參考連結

- **Stitch Project**: https://stitch.google.com/projects/17702525323174062460
- **HTML 預覽**: `stitch-designs/dashboard-export.html`
- **設計報告**: `docs/STITCH_DESIGN_REPORT.md`
- **需求文檔**: `docs/STITCH_DESIGN_REQUIREMENTS.md`

---

## 💡 使用技巧

### 1. 快速預覽設計
在瀏覽器中打開 HTML 文件：
```bash
open stitch-designs/dashboard-export.html
```

### 2. 提取特定組件樣式
在 HTML 文件中搜尋組件 class，複製到項目中：
```bash
# 搜尋 news card
grep -A 20 "news-card" stitch-designs/dashboard-export.html
```

### 3. 使用瀏覽器開發者工具
1. 打開 HTML 文件
2. F12 開啟開發者工具
3. 檢查元素查看 computed styles
4. 複製 CSS 變數值

---

**最後更新**: 2026-04-15
**Stitch Screen ID**: `a37d0a92813a454e920c1aab1256b711`
**設計師**: Stitch AI (Gemini 3.1 Pro)
