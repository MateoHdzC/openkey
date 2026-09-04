export function getWebHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenKey — Enterprise AI Platform</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23090B0F' stroke='%231B222C' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='16' r='4.5' fill='none' stroke='%232F7CFF' stroke-width='2'/%3E%3Cpath d='M16.5 16H23M20 16V19M23 16V18.5' stroke='%23F5F7FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* ==========================================================================
       OpenKey V2 Enterprise Design System Tokens
       ========================================================================== */
    :root {
      --bg-base: #050608;
      --bg-surface-primary: #090B0F;
      --bg-surface-secondary: #0D1015;
      --bg-surface-elevated: #11151B;
      --bg-hover: #161B22;
      --bg-active: #1C222B;

      --border-subtle: #1B222C;
      --border-strong: #252F3D;
      --border-focus: #2F7CFF;

      --text-primary: #F5F7FA;
      --text-secondary: #8B95A3;
      --text-muted: #5F6875;

      --blue-primary: #2F7CFF;
      --blue-hover: #428BFF;
      --blue-active: #1F6BE8;
      --blue-subtle-bg: rgba(47, 124, 255, 0.10);
      --blue-subtle-border: rgba(47, 124, 255, 0.25);

      --success-text: #10B981;
      --success-bg: rgba(16, 185, 129, 0.10);
      --warning-text: #F59E0B;
      --warning-bg: rgba(245, 158, 11, 0.10);
      --danger-text: #EF4444;
      --danger-bg: rgba(239, 68, 68, 0.10);

      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 8px;
      --radius-xl: 12px;

      --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
      --duration-fast: 140ms;
      --duration-normal: 200ms;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-base);
      color: var(--text-primary);
      font-family: var(--font-sans);
      height: 100vh;
      display: flex;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: var(--radius-sm); }
    ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

    /* Universal Form Elements */
    input, select, textarea, button {
      font-family: inherit;
      color: inherit;
    }

    select, option, optgroup {
      background-color: var(--bg-surface-elevated) !important;
      color: var(--text-primary) !important;
    }

    /* ==========================================================================
       Sidebar Component
       ========================================================================== */
    .app-sidebar {
      width: 240px;
      background-color: var(--bg-surface-primary);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      user-select: none;
      z-index: 20;
    }

    .sidebar-header {
      padding: 1.25rem 1rem 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-primary);
    }

    .brand-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .workspace-picker-btn {
      margin: 0.5rem 0.85rem 1rem 0.85rem;
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-size: 0.82rem;
      color: var(--text-secondary);
      transition: all var(--duration-fast) var(--ease-standard);
    }
    .workspace-picker-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-strong);
      color: var(--text-primary);
    }
    .workspace-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0 0.65rem 1rem 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .nav-group-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      text-transform: uppercase;
      padding: 0 0.6rem;
      margin-bottom: 0.35rem;
    }

    .nav-items-list {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .nav-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.84rem;
      font-weight: 500;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
      transition: all var(--duration-fast) var(--ease-standard);
    }
    .nav-btn:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }
    .nav-btn.active {
      color: var(--text-primary);
      background: var(--blue-subtle-bg);
      border: 1px solid var(--blue-subtle-border);
      font-weight: 600;
    }
    .nav-btn.active svg {
      color: var(--blue-primary);
    }

    .sidebar-footer {
      padding: 0.85rem 1rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    /* ==========================================================================
       Main Workspace & Topbar Component
       ========================================================================== */
    .app-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background-color: var(--bg-base);
    }

    .top-bar {
      height: 48px;
      background: var(--bg-surface-primary);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      z-index: 10;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.82rem;
    }

    .breadcrumb-root {
      color: var(--text-muted);
    }
    .breadcrumb-sep {
      color: var(--border-strong);
    }
    .breadcrumb-current {
      font-weight: 600;
      color: var(--text-primary);
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cmd-k-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.5rem;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-standard);
    }
    .cmd-k-badge:hover {
      border-color: var(--border-strong);
      color: var(--text-secondary);
    }

    .btn-secondary {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 0.8rem;
      font-weight: 500;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--duration-fast) var(--ease-standard);
    }
    .btn-secondary:hover {
      background: var(--bg-hover);
      border-color: var(--border-strong);
    }

    .btn-primary {
      background: var(--blue-primary);
      border: 1px solid var(--blue-hover);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--duration-fast) var(--ease-standard);
    }
    .btn-primary:hover {
      background: var(--blue-hover);
    }

    /* ==========================================================================
       Views & Panels Layout
       ========================================================================== */
    .view-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 2rem 2.5rem;
      max-width: 980px;
      width: 100%;
      margin: 0 auto;
    }

    .view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .view-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .view-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .view-subtitle {
      font-size: 0.84rem;
      color: var(--text-secondary);
    }

    /* ==========================================================================
       Chat Component (Spacious & Clean Enterprise Conversation)
       ========================================================================== */
    .chat-view-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 48px);
      max-width: 840px;
      width: 100%;
      margin: 0 auto;
      padding: 0 1.5rem 1.25rem 1.5rem;
    }

    .chat-history {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.75rem 0;
    }

    .chat-message-item {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      line-height: 1.65;
      font-size: 0.92rem;
      border-radius: var(--radius-lg);
      padding: 1.1rem 1.25rem;
      transition: all var(--duration-fast) var(--ease-standard);
    }
    .chat-message-item.user {
      background-color: var(--bg-surface-primary);
      border: 1px solid var(--border-subtle);
    }
    .chat-message-item.assistant {
      background-color: var(--bg-surface-secondary);
      border: 1px solid var(--border-strong);
    }

    .msg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .msg-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .msg-badge-user {
      background: var(--blue-subtle-bg);
      color: var(--blue-primary);
      border: 1px solid var(--blue-subtle-border);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    .msg-badge-ai {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-primary);
      border: 1px solid var(--border-strong);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    .msg-time {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .msg-content {
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .msg-reasoning-box {
      margin-top: 0.25rem;
      padding: 0.55rem 0.75rem;
      background: var(--bg-surface-elevated);
      border-left: 2px solid var(--blue-primary);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    .msg-tool-pill {
      margin-top: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--text-secondary);
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.6rem;
      width: fit-content;
    }
    .msg-tool-pill span {
      color: var(--blue-primary);
      font-weight: 600;
    }

    /* Composer */
    .chat-composer-box {
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-primary);
      border-radius: var(--radius-lg);
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      transition: border-color var(--duration-fast) var(--ease-standard);
    }
    .chat-composer-box:focus-within {
      border-color: var(--blue-primary);
    }

    .composer-input-area {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 0.92rem;
      line-height: 1.5;
      resize: none;
      height: 26px;
      max-height: 180px;
    }

    .composer-bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.4rem;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .composer-model-selector {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }
    .composer-model-selector select {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.55rem;
      font-size: 0.78rem;
      color: var(--text-primary);
      cursor: pointer;
      outline: none;
    }
    .composer-model-selector select:focus {
      border-color: var(--blue-primary);
    }

    /* ==========================================================================
       Table Component (Clean Enterprise Tabular)
       ========================================================================== */
    .enterprise-table-container {
      background: var(--bg-surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .enterprise-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    .enterprise-table th {
      background: var(--bg-surface-secondary);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .enterprise-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }
    .enterprise-table tr:last-child td {
      border-bottom: none;
    }
    .enterprise-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .status-badge.active {
      background: var(--success-bg);
      color: var(--success-text);
    }
    .status-badge.connected {
      background: var(--blue-subtle-bg);
      color: var(--blue-primary);
    }
    .status-badge.ready {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
    }

    /* ==========================================================================
       Metrics & Cards Component (Usage Analytics)
       ========================================================================== */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--bg-surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .metric-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .metric-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-mono);
      letter-spacing: -0.02em;
    }
    .metric-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* ==========================================================================
       Modal & Command Palette
       ========================================================================== */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 6, 8, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--duration-fast) var(--ease-standard);
    }
    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-container {
      background: var(--bg-surface-primary);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-xl);
      max-width: 860px;
      width: 90%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      transform: scale(0.98);
      transition: transform var(--duration-normal) var(--ease-standard);
    }
    .modal-overlay.open .modal-container {
      transform: scale(1);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.25rem;
    }
    .modal-close-btn:hover {
      color: var(--text-primary);
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    /* Comparison Grid */
    .compare-models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .compare-col {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .compare-model-header {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--blue-primary);
      font-family: var(--font-mono);
      display: flex;
      justify-content: space-between;
    }
    .compare-stats {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-secondary);
      display: flex;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.5rem;
    }
    .compare-text {
      font-size: 0.85rem;
      line-height: 1.6;
      color: var(--text-primary);
      white-space: pre-wrap;
      max-height: 300px;
      overflow-y: auto;
    }

    /* Command Palette */
    .cmd-palette-input {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--border-subtle);
      padding: 1.25rem 1.5rem;
      font-size: 1.05rem;
      color: var(--text-primary);
      outline: none;
    }
    .cmd-list {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-height: 380px;
      overflow-y: auto;
    }
    .cmd-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .cmd-item:hover, .cmd-item.selected {
      background: var(--blue-subtle-bg);
      color: var(--text-primary);
    }
    .cmd-item-key {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    /* Forms */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.25rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .form-input {
      background: var(--bg-surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.6rem 0.85rem;
      font-size: 0.85rem;
      color: var(--text-primary);
      outline: none;
      transition: border-color var(--duration-fast) var(--ease-standard);
    }
    .form-input:focus {
      border-color: var(--blue-primary);
    }
  </style>
</head>
<body>

  <!-- ========================================================================
       APPLICATION SIDEBAR
       ======================================================================== -->
  <aside class="app-sidebar">
    <div class="sidebar-header">
      <div class="brand-logo">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#090B0F" stroke="#1B222C" stroke-width="1.5"/>
            <circle cx="12" cy="16" r="4.5" fill="none" stroke="#2F7CFF" stroke-width="2"/>
            <path d="M16.5 16H23M20 16V19M23 16V18.5" stroke="#F5F7FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>OPENKEY</span>
      </div>
    </div>

    <!-- Workspace Switcher Button -->
    <button class="workspace-picker-btn" onclick="openWorkspaceModal()" title="Switch workspace">
      <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        <span class="workspace-name" id="sidebarWorkspaceLabel">Default Workspace</span>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </button>

    <!-- Sidebar Navigation Groups -->
    <nav class="sidebar-nav">
      <div>
        <div class="nav-group-title">Chat</div>
        <div class="nav-items-list">
          <button class="nav-btn active" onclick="switchTab('chat')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>Conversations</span>
          </button>
        </div>
      </div>

      <div>
        <div class="nav-group-title">Manage</div>
        <div class="nav-items-list">
          <button class="nav-btn" onclick="switchTab('providers')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            <span>Providers & Models</span>
          </button>
          <button class="nav-btn" onclick="switchTab('keys')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-3 3 1.5 1.5-4 4A2 2 0 006 19l4-4 1.5 1.5 3-3-1-1 1.5-1.5L18 8.5l1.5-1.5 2-2z"/></svg>
            <span>API Keys</span>
          </button>
        </div>
      </div>

      <div>
        <div class="nav-group-title">Analytics</div>
        <div class="nav-items-list">
          <button class="nav-btn" onclick="switchTab('usage')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Usage & Costs</span>
          </button>
        </div>
      </div>

      <div>
        <div class="nav-group-title">System</div>
        <div class="nav-items-list">
          <button class="nav-btn" onclick="switchTab('sessions')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Sessions History</span>
          </button>
          <button class="nav-btn" onclick="switchTab('doctor')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>System Doctor</span>
          </button>
          <button class="nav-btn" onclick="switchTab('settings')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>Settings</span>
          </button>
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <span>127.0.0.1</span>
      <span style="color:var(--success-text);">v2.0.0</span>
    </div>
  </aside>

  <!-- ========================================================================
       MAIN APP CONTAINER
       ======================================================================== -->
  <main class="app-main">
    <!-- Topbar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <span class="breadcrumb-root" id="topbarWorkspaceLabel">Workspace</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current" id="topbarSessionTitle">New Conversation</span>
      </div>
      <div class="top-bar-right">
        <div class="cmd-k-badge" onclick="openCommandPalette()">
          <span>⌘K</span>
          <span style="color:var(--text-secondary);">Palette</span>
        </div>
        <button class="btn-secondary" onclick="openCompareModal()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Compare</span>
        </button>
        <button class="btn-primary" onclick="startNewChat()">+ New Chat</button>
      </div>
    </header>

    <!-- ====================================================================
         VIEW: CHAT (Spacious & Clean)
         ==================================================================== -->
    <section id="tab-chat" class="chat-view-container">
      <div class="chat-history" id="chatHistory"></div>

      <div class="chat-composer-box">
        <textarea
          id="promptInput"
          class="composer-input-area"
          placeholder="Ask OpenKey anything or instruct tools..."
          onkeydown="handleInput(event)"
        ></textarea>
        <div class="composer-footer">
          <div class="composer-model-selector">
            <span>Model:</span>
            <select id="chatModelSelector" onchange="handleInChatModelChange()"></select>
          </div>
          <button class="btn-primary" onclick="sendMessage()">
            <span>Send</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ====================================================================
         VIEW: PROVIDERS & MODELS
         ==================================================================== -->
    <section id="tab-providers" class="view-container" style="display:none;">
      <div class="view-header">
        <div class="view-title-group">
          <h1 class="view-title">Providers & Models</h1>
          <p class="view-subtitle">Manage connected model endpoints and active credentials.</p>
        </div>
        <button class="btn-secondary" onclick="loadProviders()">Refresh Catalog</button>
      </div>
      <div class="enterprise-table-container">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Models Available</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="providersTable"></tbody>
        </table>
      </div>
    </section>

    <!-- ====================================================================
         VIEW: API KEYS VAULT
         ==================================================================== -->
    <section id="tab-keys" class="view-container" style="display:none;">
      <div class="view-header">
        <div class="view-title-group">
          <h1 class="view-title">API Keys Vault</h1>
          <p class="view-subtitle">Encrypted locally with AES-256-GCM. Never transmitted in plaintext.</p>
        </div>
      </div>

      <div style="background:var(--bg-surface-primary); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.5rem; margin-bottom:2rem;">
        <h2 style="font-size:0.95rem; font-weight:600; margin-bottom:1rem;">Add Encrypted Key</h2>
        <div style="display:grid; grid-template-columns: 1fr 2fr auto; gap:1rem; align-items:flex-end;">
          <div class="form-group" style="margin-bottom:0;">
            <label>Provider</label>
            <select class="form-input" id="keyProviderSelect">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="xai">xAI (Grok)</option>
              <option value="mistral">Mistral AI</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
              <option value="together">Together AI</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>Secret API Key</label>
            <input type="password" class="form-input" id="keySecretInput" placeholder="sk-... / AIzaSy...">
          </div>
          <button class="btn-primary" onclick="saveKey()" style="height:38px;">Save to Vault</button>
        </div>
      </div>

      <div class="enterprise-table-container">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Key Identifier</th>
              <th>Masked Secret</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="keysTable"></tbody>
        </table>
      </div>
    </section>

    <!-- ====================================================================
         VIEW: SESSIONS HISTORY
         ==================================================================== -->
    <section id="tab-sessions" class="view-container" style="display:none;">
      <div class="view-header">
        <div class="view-title-group">
          <h1 class="view-title">Sessions History</h1>
          <p class="view-subtitle">Resume, manage, and rename past conversations.</p>
        </div>
        <button class="btn-primary" onclick="startNewChat()">+ New Chat</button>
      </div>
      <div class="enterprise-table-container">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Conversation Title</th>
              <th>Active Model</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sessionsTable"></tbody>
        </table>
      </div>
    </section>

    <!-- ====================================================================
         VIEW: USAGE ANALYTICS
         ==================================================================== -->
    <section id="tab-usage" class="view-container" style="display:none;">
      <div class="view-header">
        <div class="view-title-group">
          <h1 class="view-title">Usage & Analytics</h1>
          <p class="view-subtitle">Aggregated local token metrics, latency, and cost estimates.</p>
        </div>
      </div>

      <div class="metrics-grid" id="usageMetricsGrid">
        <div class="metric-card">
          <div class="metric-title">Total Cost (Est.)</div>
          <div class="metric-value" id="metricCost">$0.00</div>
          <div class="metric-desc">Calculated at standard pricing</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Total Tokens</div>
          <div class="metric-value" id="metricTokens">0</div>
          <div class="metric-desc" id="metricTokensBreakdown">0 in · 0 out</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Total Requests</div>
          <div class="metric-value" id="metricRequests">0</div>
          <div class="metric-desc">Logged in local SQLite</div>
        </div>
      </div>

      <h2 style="font-size:0.95rem; font-weight:600; margin: 1.5rem 0 0.75rem 0;">Usage by Provider</h2>
      <div class="enterprise-table-container">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Requests</th>
              <th>Tokens</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody id="usageTable"></tbody>
        </table>
      </div>
    </section>

    <!-- ====================================================================
         VIEW: SYSTEM DOCTOR
         ==================================================================== -->
    <section id="tab-doctor" class="view-container" style="display:none;">
      <div class="view-header">
        <div class="view-title-group">
          <h1 class="view-title">System Doctor</h1>
          <p class="view-subtitle">Environment, vault crypto, and provider connectivity diagnostics.</p>
        </div>
        <button class="btn-secondary" onclick="loadDoctor()">Re-run Checks</button>
      </div>
      <div class="enterprise-table-container">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th>Diagnostic Check</th>
              <th>Category</th>
              <th>Status</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody id="doctorTable"></tbody>
        </table>
      </div>
    </section>

    <!-- ====================================================================
         VIEW: SETTINGS & BACKUPS
         ==================================================================== -->
    <section id="tab-settings" class="view-container" style="display:none;">
      <div class="view-header">
        <div class="view-title-group">
          <h1 class="view-title">Settings</h1>
          <p class="view-subtitle">Runtime preferences, security options, and data backup.</p>
        </div>
      </div>

      <div style="background:var(--bg-surface-primary); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.5rem; margin-bottom:1.5rem;">
        <h2 style="font-size:0.95rem; font-weight:600; margin-bottom:0.4rem;">Data Backup & Export</h2>
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:1rem;">
          Export your workspaces, conversations, analytics, and provider metadata into an encrypted local snapshot.
        </p>
        <button class="btn-secondary" onclick="exportDataSnapshot()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download Encrypted Snapshot</span>
        </button>
      </div>
    </section>
  </main>

  <!-- ========================================================================
       MODAL: MODEL COMPARISON (/compare)
       ======================================================================== -->
  <div id="compareModal" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">Model Comparison Suite</div>
        <button class="modal-close-btn" onclick="closeCompareModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Test Prompt</label>
          <textarea id="comparePromptInput" class="form-input" style="height:70px; resize:none;" placeholder="Enter a prompt to evaluate across models..."></textarea>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.8rem; color:var(--text-secondary);">Select 2 or 3 models to benchmark simultaneously.</div>
          <button class="btn-primary" onclick="runModelComparison()">Run Benchmark</button>
        </div>
        <div class="compare-models-grid" id="compareResultsGrid"></div>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       MODAL: WORKSPACE SWITCHER
       ======================================================================== -->
  <div id="workspaceModal" class="modal-overlay">
    <div class="modal-container" style="max-width:520px;">
      <div class="modal-header">
        <div class="modal-title">Select Workspace</div>
        <button class="modal-close-btn" onclick="closeWorkspaceModal()">✕</button>
      </div>
      <div class="modal-body" id="workspaceListBody"></div>
    </div>
  </div>

  <!-- ========================================================================
       MODAL: COMMAND PALETTE (Ctrl+K)
       ======================================================================== -->
  <div id="commandPaletteModal" class="modal-overlay">
    <div class="modal-container" style="max-width:560px;">
      <input
        type="text"
        id="cmdSearchInput"
        class="cmd-palette-input"
        placeholder="Type a command or jump to feature..."
        oninput="filterCommands(this.value)"
        onkeydown="handleCmdKey(event)"
      />
      <div class="cmd-list" id="cmdListItems"></div>
    </div>
  </div>

  <!-- ========================================================================
       APPLICATION LOGIC & CLIENT SCRIPT
       ======================================================================== -->
  <script>
    let activeProvider = 'deepseek';
    let activeModel = 'deepseek-chat';
    let currentSessionId = null;
    let cachedProviders = [];

    // Global Key Listener for Command Palette
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    function switchTab(tabId) {
      document.querySelectorAll('.chat-view-container, .view-container').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const target = document.getElementById('tab-' + tabId);
      if (target) target.style.display = 'flex';

      const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
      if (btn) btn.classList.add('active');

      if (tabId === 'providers') loadProviders();
      if (tabId === 'keys') loadKeys();
      if (tabId === 'sessions') loadSessions();
      if (tabId === 'usage') loadUsage();
      if (tabId === 'doctor') loadDoctor();
    }

    async function loadCatalog() {
      const res = await fetch('/api/providers');
      const data = await res.json();
      cachedProviders = data.providers || [];
      activeProvider = data.activeProviderId || 'deepseek';
      activeModel = data.activeModelId || 'deepseek-chat';

      const chatSelect = document.getElementById('chatModelSelector');
      chatSelect.innerHTML = '';

      cachedProviders.forEach(p => {
        const group = document.createElement('optgroup');
        group.label = p.name;
        (p.models || []).forEach(m => {
          const opt = document.createElement('option');
          opt.value = p.id + '::' + m.id;
          opt.textContent = m.id;
          if (p.id === activeProvider && m.id === activeModel) {
            opt.selected = true;
          }
          group.appendChild(opt);
        });
        chatSelect.appendChild(group);
      });
    }

    async function handleInChatModelChange() {
      const val = document.getElementById('chatModelSelector').value;
      const [providerId, modelId] = val.split('::');
      activeProvider = providerId;
      activeModel = modelId;

      await fetch('/api/config/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, modelId })
      });

      if (currentSessionId) {
        await fetch('/api/sessions/' + currentSessionId + '/model', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId, modelId })
        });
      }
    }

    async function startNewChat() {
      currentSessionId = null;
      document.getElementById('chatHistory').innerHTML = '';
      document.getElementById('topbarSessionTitle').textContent = 'New Conversation';
      switchTab('chat');
    }

    async function loadSessions() {
      const res = await fetch('/api/sessions');
      const sessions = await res.json();
      const tbody = document.getElementById('sessionsTable');
      if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-muted); text-align:center; padding:2rem;">No saved sessions yet. Start typing in Chat to create one.</td></tr>';
        return;
      }
      tbody.innerHTML = sessions.map(s => {
        const dateStr = new Date(s.updatedAt).toLocaleDateString() + ' ' + new Date(s.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        return \`
          <tr>
            <td><strong>\${s.title}</strong></td>
            <td><span class="status-badge connected" style="font-family:var(--font-mono);">\${s.modelId}</span></td>
            <td style="color:var(--text-secondary); font-family:var(--font-mono);">\${dateStr}</td>
            <td style="display:flex; gap:0.5rem;">
              <button class="btn-secondary" onclick="openSession('\${s.id}')">Open</button>
              <button class="btn-secondary" onclick="renameSession('\${s.id}', '\${s.title.replace(/'/g, "\\\\'")}')">Rename</button>
              <button class="btn-secondary" style="color:var(--danger-text);" onclick="deleteSession('\${s.id}')">Delete</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function openSession(id) {
      const res = await fetch('/api/sessions/' + id);
      const session = await res.json();
      currentSessionId = session.id;
      document.getElementById('topbarSessionTitle').textContent = session.title;

      const container = document.getElementById('chatHistory');
      container.innerHTML = '';

      (session.messages || []).forEach(m => {
        const isUser = m.role === 'user';
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message-item ' + (isUser ? 'user' : 'assistant');
        msgDiv.innerHTML = \`
          <div class="msg-header">
            <div class="msg-author">
              <span class="\${isUser ? 'msg-badge-user' : 'msg-badge-ai'}">\${isUser ? 'YOU' : 'AI'}</span>
            </div>
            <div class="msg-time">\${new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
          </div>
          <div class="msg-content">\${m.content}</div>
        \`;
        container.appendChild(msgDiv);
      });

      switchTab('chat');
      container.scrollTop = container.scrollHeight;
    }

    async function renameSession(id, oldTitle) {
      const newTitle = prompt('Enter new session title:', oldTitle);
      if (!newTitle || newTitle.trim() === '') return;

      await fetch('/api/sessions/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (currentSessionId === id) {
        document.getElementById('topbarSessionTitle').textContent = newTitle.trim();
      }
      loadSessions();
    }

    async function deleteSession(id) {
      if (!confirm('Are you sure you want to delete this session?')) return;
      await fetch('/api/sessions/' + id, { method: 'DELETE' });
      if (currentSessionId === id) {
        startNewChat();
      } else {
        loadSessions();
      }
    }

    async function loadProviders() {
      const res = await fetch('/api/providers');
      const data = await res.json();
      const tbody = document.getElementById('providersTable');
      tbody.innerHTML = data.providers.map(p => \`
        <tr>
          <td><strong>\${p.name}</strong></td>
          <td style="font-family:var(--font-mono); color:var(--text-secondary);">\${p.models?.length || 0} models</td>
          <td>\${p.id === activeProvider ? '<span class="status-badge active">Active Default</span>' : '<span class="status-badge ready">Configured</span>'}</td>
          <td>
            <button class="btn-secondary" onclick="showProviderDetails('\${p.id}')">Inspect</button>
          </td>
        </tr>
      \`).join('');
    }

    function showProviderDetails(providerId) {
      const provider = cachedProviders.find(p => p.id === providerId);
      if (!provider) return;
      alert(\`Provider: \${provider.name}\\nModels: \${(provider.models || []).map(m => m.id).join(', ')}\`);
    }

    async function loadKeys() {
      const res = await fetch('/api/keys');
      const keys = await res.json();
      const tbody = document.getElementById('keysTable');
      if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted); text-align:center; padding:2rem;">No keys in vault. Add a secret key above.</td></tr>';
        return;
      }
      tbody.innerHTML = keys.map(k => \`
        <tr>
          <td><strong>\${k.providerId.toUpperCase()}</strong></td>
          <td style="font-family:var(--font-mono); color:var(--text-secondary);">\${k.name}</td>
          <td style="font-family:var(--font-mono);">\${k.maskedKey}</td>
          <td><span class="status-badge connected">Encrypted</span></td>
          <td><button class="btn-secondary" style="color:var(--danger-text);" onclick="deleteKey('\${k.id}')">Delete</button></td>
        </tr>
      \`).join('');
    }

    async function saveKey() {
      const providerId = document.getElementById('keyProviderSelect').value;
      const apiKey = document.getElementById('keySecretInput').value.trim();
      if (!apiKey) return;

      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, name: providerId + '-key', apiKey })
      });
      document.getElementById('keySecretInput').value = '';
      loadKeys();
      loadCatalog();
    }

    async function deleteKey(id) {
      await fetch('/api/keys/' + id, { method: 'DELETE' });
      loadKeys();
    }

    async function loadUsage() {
      const res = await fetch('/api/usage');
      const d = await res.json();
      const estCost = (d.totalTokens * 0.000004).toFixed(3);

      document.getElementById('metricCost').textContent = '$' + estCost;
      document.getElementById('metricTokens').textContent = d.totalTokens.toLocaleString();
      document.getElementById('metricTokensBreakdown').textContent = \`\${d.totalInputTokens.toLocaleString()} in · \${d.totalOutputTokens.toLocaleString()} out\`;
      document.getElementById('metricRequests').textContent = d.totalRequests.toLocaleString();

      const tbody = document.getElementById('usageTable');
      tbody.innerHTML = (d.byProvider || []).map(p => {
        const share = d.totalTokens > 0 ? ((p.totalTokens / d.totalTokens) * 100).toFixed(1) + '%' : '0%';
        return \`
          <tr>
            <td><strong>\${p.providerId.toUpperCase()}</strong></td>
            <td style="font-family:var(--font-mono);">\${p.requests}</td>
            <td style="font-family:var(--font-mono);">\${p.totalTokens.toLocaleString()}</td>
            <td style="font-family:var(--font-mono); color:var(--text-secondary);">\${share}</td>
          </tr>
        \`;
      }).join('');
    }

    async function loadDoctor() {
      const res = await fetch('/api/doctor');
      const checks = await res.json();
      const tbody = document.getElementById('doctorTable');
      tbody.innerHTML = checks.map(c => \`
        <tr>
          <td><strong>\${c.name}</strong></td>
          <td style="color:var(--text-secondary);">\${c.category}</td>
          <td>\${c.status === 'ok' ? '<span class="status-badge active">OK</span>' : c.status === 'warn' ? '<span class="status-badge" style="background:var(--warning-bg); color:var(--warning-text);">WARN</span>' : '<span class="status-badge" style="background:var(--danger-bg); color:var(--danger-text);">ERROR</span>'}</td>
          <td style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-secondary);">\${c.message}</td>
        </tr>
      \`).join('');
    }

    function handleInput(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }

    async function sendMessage() {
      const input = document.getElementById('promptInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      const container = document.getElementById('chatHistory');
      const nowStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

      const userMsg = document.createElement('div');
      userMsg.className = 'chat-message-item user';
      userMsg.innerHTML = \`
        <div class="msg-header">
          <div class="msg-author">
            <span class="msg-badge-user">YOU</span>
          </div>
          <div class="msg-time">\${nowStr}</div>
        </div>
        <div class="msg-content">\${text}</div>
      \`;
      container.appendChild(userMsg);

      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'chat-message-item assistant';
      assistantMsg.innerHTML = \`
        <div class="msg-header">
          <div class="msg-author">
            <span class="msg-badge-ai">AI</span>
          </div>
          <div class="msg-time">\${nowStr}</div>
        </div>
        <div class="msg-content">...</div>
      \`;
      container.appendChild(assistantMsg);
      container.scrollTop = container.scrollHeight;

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, sessionId: currentSessionId, providerId: activeProvider, modelId: activeModel })
      });

      const bodyDiv = assistantMsg.querySelector('.msg-content');
      bodyDiv.textContent = '';
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reasoningDiv = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const event = JSON.parse(line.slice(5).trim());
              if (event.type === 'session' && event.sessionId) {
                currentSessionId = event.sessionId;
              } else if (event.type === 'reasoning') {
                if (!reasoningDiv) {
                  reasoningDiv = document.createElement('div');
                  reasoningDiv.className = 'msg-reasoning-box';
                  reasoningDiv.textContent = 'Thinking › ';
                  assistantMsg.insertBefore(reasoningDiv, bodyDiv);
                }
                reasoningDiv.textContent += event.content;
              } else if (event.type === 'token') {
                bodyDiv.textContent += event.content;
              } else if (event.type === 'tool_start') {
                const toolDiv = document.createElement('div');
                toolDiv.className = 'msg-tool-pill';
                toolDiv.innerHTML = 'Running <span>' + event.toolName + '</span>...';
                assistantMsg.insertBefore(toolDiv, bodyDiv);
              } else if (event.type === 'error') {
                bodyDiv.textContent = 'Error: ' + event.error;
              }
              container.scrollTop = container.scrollHeight;
            } catch {}
          }
        }
      }
    }

    // Modal & Dialog Management
    function openCompareModal() {
      document.getElementById('compareModal').classList.add('open');
    }
    function closeCompareModal() {
      document.getElementById('compareModal').classList.remove('open');
    }

    async function runModelComparison() {
      const prompt = document.getElementById('comparePromptInput').value.trim();
      if (!prompt) return;

      const grid = document.getElementById('compareResultsGrid');
      grid.innerHTML = '<div style="color:var(--text-secondary); padding:1rem;">Benchmarking models in parallel...</div>';

      const defaultBench = [
        { providerId: 'deepseek', modelId: 'deepseek-chat' },
        { providerId: 'openai', modelId: 'gpt-4o' },
        { providerId: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' }
      ];

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: defaultBench })
      });
      const data = await res.json();

      grid.innerHTML = (data.results || []).map(r => \`
        <div class="compare-col">
          <div class="compare-model-header">
            <span>\${r.modelId}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">\${r.providerId.toUpperCase()}</span>
          </div>
          <div class="compare-stats">
            <span>⚡ \${r.durationSec}s</span>
            <span>📊 \${r.tokens} tok</span>
            <span>💰 $\${r.costUSD}</span>
          </div>
          <div class="compare-text">\${r.status === 'success' ? r.content : '<span style="color:var(--danger-text);">' + r.error + '</span>'}</div>
        </div>
      \`).join('');
    }

    async function openWorkspaceModal() {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      const body = document.getElementById('workspaceListBody');
      body.innerHTML = (data.workspaces || []).map(ws => \`
        <div style="padding:0.75rem; border:1px solid var(--border-subtle); border-radius:var(--radius-md); margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600; font-size:0.9rem;">\${ws.name}</div>
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">\${ws.path}</div>
          </div>
          <button class="btn-secondary" onclick="selectWorkspace('\${ws.name}')">Select</button>
        </div>
      \`).join('');
      document.getElementById('workspaceModal').classList.add('open');
    }

    function selectWorkspace(name) {
      document.getElementById('sidebarWorkspaceLabel').textContent = name;
      document.getElementById('topbarWorkspaceLabel').textContent = name;
      closeWorkspaceModal();
    }

    function closeWorkspaceModal() {
      document.getElementById('workspaceModal').classList.remove('open');
    }

    // Command Palette
    const commandRegistry = [
      { title: 'New Conversation', action: () => startNewChat(), key: 'N' },
      { title: 'Compare Models', action: () => openCompareModal(), key: 'C' },
      { title: 'View Providers & Models', action: () => switchTab('providers'), key: 'P' },
      { title: 'Manage API Keys Vault', action: () => switchTab('keys'), key: 'K' },
      { title: 'Usage & Cost Analytics', action: () => switchTab('usage'), key: 'U' },
      { title: 'System Diagnostics Doctor', action: () => switchTab('doctor'), key: 'D' },
      { title: 'Settings & Data Export', action: () => switchTab('settings'), key: 'S' },
      { title: 'Switch Workspace', action: () => openWorkspaceModal(), key: 'W' },
    ];

    function openCommandPalette() {
      document.getElementById('commandPaletteModal').classList.add('open');
      document.getElementById('cmdSearchInput').value = '';
      filterCommands('');
      setTimeout(() => document.getElementById('cmdSearchInput').focus(), 50);
    }

    function filterCommands(query) {
      const q = query.toLowerCase();
      const list = document.getElementById('cmdListItems');
      const filtered = commandRegistry.filter(c => c.title.toLowerCase().includes(q));
      list.innerHTML = filtered.map((c, idx) => \`
        <div class="cmd-item \${idx === 0 ? 'selected' : ''}" onclick="executeCmd(\${commandRegistry.indexOf(c)})">
          <span>\${c.title}</span>
          <span class="cmd-item-key">\${c.key}</span>
        </div>
      \`).join('');
    }

    function executeCmd(idx) {
      closeAllModals();
      commandRegistry[idx].action();
    }

    function closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('open'));
    }

    async function exportDataSnapshot() {
      const res = await fetch('/api/data/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openkey-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    }

    loadCatalog();
  </script>
</body>
</html>`;
}
