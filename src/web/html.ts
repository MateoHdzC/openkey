export function getWebHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenKey — Your Keys. More Possibilities.</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='14' r='8' fill='none' stroke='%232F7CFF' stroke-width='2.8'/%3E%3Cpath d='M16 22V28M16 25H20M16 28H20' stroke='%232F7CFF' stroke-width='2.8' stroke-linecap='round'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #05070A;
      --bg-sidebar: #080A0D;
      --bg-surface: #0B0F14;
      --bg-elevated: #10151C;
      --bg-hover: #141B24;
      --bg-active: #19222E;

      --border-subtle: #1A2533;
      --border-strong: #243245;
      --border-blue: rgba(47, 124, 255, 0.35);
      --border-blue-glow: rgba(47, 124, 255, 0.6);

      --blue-primary: #2F7CFF;
      --blue-bright: #428BFF;
      --blue-active: #1F6BE8;
      --blue-soft: rgba(47, 124, 255, 0.10);
      --blue-glow: rgba(47, 124, 255, 0.25);

      --text-primary: #F5F7FA;
      --text-secondary: #9AA6B5;
      --text-muted: #667180;

      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;

      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 10px;
      --radius-xl: 14px;
      --radius-full: 9999px;

      --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
      --transition-fast: 140ms var(--ease);
      --transition-normal: 220ms var(--ease);
    }


    body {
      background-color: var(--bg-main);
      color: var(--text-primary);
      font-family: var(--font-sans);
      height: 100vh;
      display: flex;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    @media (prefers-reduced-motion: reduce) {
    }

    
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #16202C; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--blue-primary); }

    button, input, textarea, select {
      font-family: inherit;
      color: inherit;
      border: none;
      outline: none;
      background: transparent;
    }

    
    .sidebar {
      width: 250px;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      user-select: none;
      flex-shrink: 0;
      z-index: 30;
    }

    .sidebar-brand-box {
      padding: 1.5rem 1.25rem 1.25rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .brand-key-icon {
      width: 34px;
      height: 34px;
      filter: drop-shadow(0 0 8px rgba(47, 124, 255, 0.5));
    }

    .brand-text-block {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: -0.01em;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .nav-section-title {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      text-transform: uppercase;
      padding: 0 0.5rem;
      margin-bottom: 0.35rem;
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.65rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      transition: all var(--transition-fast);
      text-decoration: none;
    }
    .nav-item:hover {
      color: var(--text-primary);
      background-color: var(--bg-hover);
    }
    .nav-item.active {
      color: #FFFFFF;
      background: var(--blue-soft);
      border: 1px solid var(--border-blue);
      font-weight: 600;
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 3px;
      background: var(--blue-primary);
      border-radius: 0 2px 2px 0;
      box-shadow: 0 0 8px var(--blue-primary);
    }
    .nav-item.active svg {
      color: var(--blue-bright);
    }

    .nav-item-subtext {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .nav-item-subtext span:last-child {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-weight: 400;
    }

    .sidebar-footer {
      padding: 0.85rem;
      border-top: 1px solid var(--border-subtle);
    }

    .workspace-bottom-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.55rem 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .workspace-bottom-card:hover {
      background: var(--bg-hover);
      border-color: var(--border-blue);
    }
    .ws-bottom-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .ws-bottom-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .ws-bottom-label {
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .ws-bottom-val {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    
    .main-workspace {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background-color: var(--bg-main);
      position: relative;
    }

    .top-nav-bar {
      height: 52px;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(5, 7, 10, 0.8);
      backdrop-filter: blur(8px);
      z-index: 20;
    }

    .top-ws-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .top-ws-pill:hover {
      border-color: var(--border-blue);
    }

    .search-cmd-box {
      width: 320px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0.35rem 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }
    .search-cmd-box:hover {
      border-color: var(--border-blue);
      color: var(--text-primary);
    }
    .cmd-badge {
      margin-left: auto;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.15rem 0.4rem;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .sub-header-bar {
      padding: 0.75rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(26, 37, 51, 0.5);
    }

    .model-selector-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 0.45rem 0.85rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .model-selector-btn:hover {
      border-color: var(--border-blue);
      box-shadow: 0 0 12px var(--blue-soft);
    }
    .model-icon-img {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .model-text-wrap {
      display: flex;
      flex-direction: column;
      text-align: left;
      line-height: 1.2;
    }
    .model-provider-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .model-id-label {
      font-size: 0.72rem;
      font-family: var(--font-mono);
      color: var(--text-secondary);
    }

    .btn-icon-square {
      width: 34px;
      height: 34px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }
    .btn-icon-square:hover {
      color: #FFFFFF;
      border-color: var(--border-blue);
    }

    .btn-new-chat {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-blue);
      border-radius: var(--radius-md);
      padding: 0.45rem 0.85rem;
      color: #FFFFFF;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-new-chat:hover {
      background: var(--blue-soft);
      border-color: var(--blue-bright);
      box-shadow: 0 0 12px var(--blue-soft);
    }

    .ws-context-badge {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0.35rem 0.75rem;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }
    .ws-context-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 6px var(--success);
    }

    
    .center-scroll-view {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .welcome-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem 1rem 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .welcome-hero-logo {
      width: 76px;
      height: 76px;
      margin-bottom: 1.25rem;
      filter: drop-shadow(0 0 24px rgba(47, 124, 255, 0.65));
      animation: subtlePulse 4s ease-in-out infinite alternate;
    }

    @keyframes subtlePulse {
      0% { transform: scale(0.98); filter: drop-shadow(0 0 16px rgba(47, 124, 255, 0.4)); }
      100% { transform: scale(1.02); filter: drop-shadow(0 0 28px rgba(47, 124, 255, 0.75)); }
    }

    .welcome-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #FFFFFF;
      margin-bottom: 0.35rem;
    }
    .welcome-title span {
      color: var(--blue-primary);
      text-shadow: 0 0 20px rgba(47, 124, 255, 0.4);
    }

    .welcome-subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin-bottom: 2.25rem;
    }

    
    .feature-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.85rem;
      width: 100%;
      margin-bottom: 2.5rem;
    }

    .feature-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      transition: all var(--transition-fast);
      cursor: default;
    }
    .feature-card:hover {
      border-color: var(--border-blue);
      background: var(--bg-hover);
      transform: translateY(-2px);
    }
    .feature-card-icon {
      width: 32px;
      height: 32px;
      background: var(--blue-soft);
      border: 1px solid var(--border-blue);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--blue-bright);
    }
    .feature-card-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .feature-card-desc {
      font-size: 0.76rem;
      color: var(--text-muted);
      line-height: 1.35;
    }

    .center-quote-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1.5rem;
    }
    .center-quote-text {
      font-size: 0.86rem;
      font-style: italic;
      color: var(--text-muted);
    }
    .center-quote-line {
      width: 70px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--blue-primary), transparent);
      box-shadow: 0 0 8px var(--blue-primary);
    }

    
    .quick-actions-row {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .quick-action-pill {
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0.4rem 0.85rem;
      font-size: 0.78rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .quick-action-pill:hover {
      background: var(--blue-soft);
      border-color: var(--border-blue);
      color: #FFFFFF;
    }

    
    .composer-wrapper {
      padding: 0 1.5rem 1.5rem 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .composer-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: 0.85rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      transition: border-color var(--transition-fast);
    }
    .composer-container:focus-within {
      border-color: var(--border-blue-glow);
    }

    .composer-textarea {
      width: 100%;
      background: transparent;
      border: none;
      resize: none;
      font-size: 0.92rem;
      color: var(--text-primary);
      height: 28px;
      max-height: 180px;
      line-height: 1.5;
    }
    .composer-textarea::placeholder {
      color: #4A5666;
    }

    .composer-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .composer-tools-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-muted);
    }
    .tool-icon-btn {
      cursor: pointer;
      transition: color var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tool-icon-btn:hover {
      color: var(--blue-bright);
    }

    .composer-tools-right {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .composer-model-pill {
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0.3rem 0.65rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .composer-model-pill:hover {
      border-color: var(--border-blue);
      color: var(--text-primary);
    }

    .btn-send-message {
      width: 32px;
      height: 32px;
      background: var(--blue-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: 0 0 10px rgba(47, 124, 255, 0.4);
    }
    .btn-send-message:hover {
      background: var(--blue-bright);
      transform: scale(1.04);
    }
    .btn-send-message:active {
      transform: scale(0.96);
    }

    
    .chat-messages-feed {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      max-width: 860px;
      margin: 0 auto;
      width: 100%;
    }

    .chat-msg-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      font-size: 0.92rem;
      line-height: 1.6;
    }
    .chat-msg-card.user {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }
    .chat-msg-card.assistant {
      background: var(--bg-elevated);
      border: 1px solid var(--border-strong);
    }

    .msg-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
    }
    .msg-badge {
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
    }
    .msg-badge.user {
      background: var(--blue-soft);
      color: var(--blue-bright);
      border: 1px solid var(--border-blue);
    }
    .msg-badge.ai {
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      border: 1px solid var(--border-strong);
    }

    
    .right-info-panel {
      width: 300px;
      background-color: var(--bg-sidebar);
      border-left: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      user-select: none;
      flex-shrink: 0;
      z-index: 20;
    }

    .right-panel-tabs {
      height: 48px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      padding: 0 1rem;
      gap: 1rem;
    }

    .right-tab-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.85rem 0.25rem;
      position: relative;
    }
    .right-tab-item.active {
      color: var(--blue-bright);
    }
    .right-tab-item.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--blue-primary);
      box-shadow: 0 0 8px var(--blue-primary);
    }

    .right-panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    
    .openkey-info-hero-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-blue);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 0 20px var(--blue-soft);
    }
    .openkey-hero-img {
      width: 48px;
      height: 48px;
      margin-bottom: 0.65rem;
      filter: drop-shadow(0 0 12px rgba(47, 124, 255, 0.6));
    }
    .openkey-card-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .openkey-card-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    
    .metadata-rows-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .meta-row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
    }
    .meta-row-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
    }
    .meta-row-val {
      font-family: var(--font-mono);
      font-weight: 500;
      color: #FFFFFF;
    }

    
    .recent-sessions-box {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .recent-sessions-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .recent-view-all-link {
      font-size: 0.72rem;
      color: var(--blue-bright);
      cursor: pointer;
    }

    .recent-sessions-items {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .recent-session-entry {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.76rem;
      padding: 0.35rem 0.45rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .recent-session-entry:hover {
      background: var(--bg-hover);
    }
    .recent-session-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }
    .recent-session-time {
      font-size: 0.68rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    
    .tip-box-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      display: flex;
      gap: 0.6rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .tip-box-icon {
      color: var(--blue-bright);
      flex-shrink: 0;
    }

    
    .standard-panel-view {
      display: none;
      flex: 1;
      overflow-y: auto;
      padding: 2rem 2.5rem;
      max-width: 960px;
      margin: 0 auto;
      width: 100%;
    }

    .panel-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .panel-headline {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .panel-tagline {
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .clean-admin-table-wrap {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    .admin-table th {
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: 0.74rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .admin-table td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }
    .admin-table tr:last-child td {
      border-bottom: none;
    }
    .admin-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 7, 10, 0.85);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition-fast);
    }
    .modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-window {
      background: var(--bg-surface);
      border: 1px solid var(--border-blue);
      border-radius: var(--radius-xl);
      width: 90%;
      max-width: 780px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px var(--blue-soft);
      transform: scale(0.98);
      transition: transform var(--transition-normal);
    }
    .modal-backdrop.open .modal-window {
      transform: scale(1);
    }

    .modal-head {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .modal-close {
      cursor: pointer;
      color: var(--text-muted);
      font-size: 1.2rem;
    }
    .modal-close:hover {
      color: #FFFFFF;
    }

    .modal-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
  </style>
</head>
<body>

  
  <aside class="sidebar">
    <div class="sidebar-brand-box">
      
      <svg class="brand-key-icon" viewBox="0 0 36 36" fill="none">
        <circle cx="17" cy="15" r="9.5" stroke="#2F7CFF" stroke-width="3"/>
        <circle cx="17" cy="15" r="5" fill="#0B0F14" stroke="#2F7CFF" stroke-width="2"/>
        <path d="M17 24.5V32M17 28H22M17 32H22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="brand-text-block">
        <span class="brand-title">OpenKey</span>
        <span class="brand-subtitle">Your Keys. More Possibilities.</span>
      </div>
    </div>

    <div class="sidebar-content">
      
      <div class="nav-list">
        <a class="nav-item active" id="nav-chat" onclick="navigateTo('chat')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <div class="nav-item-subtext">
            <span>Chat</span>
            <span>Conversations with AI</span>
          </div>
        </a>
      </div>

      
      <div>
        <div class="nav-section-title">Workspace</div>
        <div class="nav-list">
          <a class="nav-item" id="nav-overview" onclick="navigateTo('overview')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Overview</span>
          </a>
          <a class="nav-item" id="nav-files" onclick="navigateTo('files')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <span>Files</span>
          </a>
          <a class="nav-item" id="nav-sessions" onclick="navigateTo('sessions')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Sessions</span>
          </a>
        </div>
      </div>

      
      <div>
        <div class="nav-section-title">Manage</div>
        <div class="nav-list">
          <a class="nav-item" id="nav-providers" onclick="navigateTo('providers')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>Providers</span>
          </a>
          <a class="nav-item" id="nav-models" onclick="navigateTo('models')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            <span>Models</span>
          </a>
          <a class="nav-item" id="nav-keys" onclick="navigateTo('keys')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-3 3 1.5 1.5-4 4A2 2 0 006 19l4-4 1.5 1.5 3-3-1-1 1.5-1.5L18 8.5l1.5-1.5 2-2z"/></svg>
            <span>API Keys</span>
          </a>
        </div>
      </div>

      
      <div>
        <div class="nav-section-title">Analytics</div>
        <div class="nav-list">
          <a class="nav-item" id="nav-usage" onclick="navigateTo('usage')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Usage</span>
          </a>
        </div>
      </div>

      
      <div>
        <div class="nav-section-title">System</div>
        <div class="nav-list">
          <a class="nav-item" id="nav-settings" onclick="navigateTo('settings')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>Settings</span>
          </a>
        </div>
      </div>
    </div>

    
    <div class="sidebar-footer">
      <div class="workspace-bottom-card" onclick="openWsModal()">
        <div class="ws-bottom-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F7CFF" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <div class="ws-bottom-info">
            <span class="ws-bottom-label">Current Workspace</span>
            <span class="ws-bottom-val" id="sidebarWsName">Personal</span>
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
  </aside>

  
  <main class="main-workspace">
    
    <header class="top-nav-bar">
      <div class="top-ws-pill" onclick="openWsModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2F7CFF" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        <span id="topbarWsName">Personal</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>

      <div class="search-cmd-box" onclick="openCmdPalette()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Search or run a command...</span>
        <span class="cmd-badge">Ctrl K</span>
      </div>
    </header>

    
    <div class="sub-header-bar">
      <div style="display:flex; align-items:center; gap:0.5rem;">
        
        <div class="model-selector-btn" onclick="openModelPickerModal()">
          <div class="model-icon-img" id="subbarModelIcon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#2F7CFF"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 14.93V17a1 1 0 01-2 0v-.07A8 8 0 014.07 9H5a1 1 0 010-2h-.93A8 8 0 0111 4.07V5a1 1 0 012 0v-.93A8 8 0 0119.93 11H19a1 1 0 010 2h.93A8 8 0 0113 16.93z"/></svg>
          </div>
          <div class="model-text-wrap">
            <span class="model-provider-title" id="subbarProviderName">DeepSeek</span>
            <span class="model-id-label" id="subbarModelId">deepseek-chat ▾</span>
          </div>
        </div>

        <button class="btn-icon-square" title="Model parameters" onclick="navigateTo('models')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        </button>
        <button class="btn-icon-square" title="More options" onclick="openCmdPalette()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
        <button class="btn-new-chat" onclick="startNewConversation()">
          <span>+ New Chat</span>
        </button>
      </div>

      <div style="display:flex; align-items:center; gap:0.5rem;">
        <div class="ws-context-badge">
          <span class="ws-context-dot"></span>
          <span>Workspace Context</span>
        </div>
        <button class="btn-icon-square" onclick="openCmdPalette()">•••</button>
      </div>
    </div>

    
    <div class="center-scroll-view" id="mainCenterView">
      
      <div id="view-chat-container" style="display:flex; flex-direction:column; flex:1;">
        
        <div class="welcome-container" id="welcomeScreenHero">
          
          <svg class="welcome-hero-logo" viewBox="0 0 36 36" fill="none">
            <circle cx="17" cy="15" r="9.5" stroke="#2F7CFF" stroke-width="3"/>
            <circle cx="17" cy="15" r="5" fill="#0B0F14" stroke="#2F7CFF" stroke-width="2"/>
            <path d="M17 24.5V32M17 28H22M17 32H22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h1 class="welcome-title">Welcome to <span>OpenKey</span></h1>
          <p class="welcome-subtitle">Manage your AI. Your way.</p>

          
          <div class="feature-cards-grid">
            <div class="feature-card">
              <div class="feature-card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </div>
              <div class="feature-card-title">Multi-Provider</div>
              <div class="feature-card-desc">Use the models you prefer</div>
            </div>
            <div class="feature-card">
              <div class="feature-card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-3 3 1.5 1.5-4 4A2 2 0 006 19l4-4 1.5 1.5 3-3-1-1 1.5-1.5L18 8.5l1.5-1.5 2-2z"/></svg>
              </div>
              <div class="feature-card-title">Your Keys</div>
              <div class="feature-card-desc">Secure and encrypted</div>
            </div>
            <div class="feature-card">
              <div class="feature-card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div class="feature-card-title">Powerful Tools</div>
              <div class="feature-card-desc">Work with real context</div>
            </div>
            <div class="feature-card">
              <div class="feature-card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <div class="feature-card-title">Built for Developers</div>
              <div class="feature-card-desc">Flexible, fast, open</div>
            </div>
          </div>

          
          <div class="center-quote-box">
            <span class="center-quote-text">“Better tools. Greater possibilities.”</span>
            <div class="center-quote-line"></div>
          </div>

          
          <div class="quick-actions-row">
            <button class="quick-action-pill" onclick="sendPromptAction('Explain this project structure and purpose.')">
              <span>⚝</span> Explain this project
            </button>
            <button class="quick-action-pill" onclick="sendPromptAction('Review my code and identify potential improvements.')">
              <span>✎</span> Review my code
            </button>
            <button class="quick-action-pill" onclick="sendPromptAction('Find and fix issues or bugs in this workspace.')">
              <span>⌕</span> Find and fix issues
            </button>
            <button class="quick-action-pill" onclick="openCompareModal()">
              <span>◫</span> Compare models
            </button>
            <button class="quick-action-pill" onclick="sendPromptAction('Help me plan the next development phase.')">
              <span>⏱</span> Help me plan
            </button>
            <button class="quick-action-pill" onclick="refreshCatalogData()" title="Reload catalog">
              <span>↻</span>
            </button>
          </div>
        </div>

        
        <div class="chat-messages-feed" id="chatFeedList"></div>
      </div>

      
      <div id="view-overview" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Workspace Overview</h2>
            <p class="panel-tagline">Active directory status, model telemetry, and environment.</p>
          </div>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <tbody>
              <tr><td><strong>Workspace Directory</strong></td><td class="mono" id="overviewWsPath">—</td></tr>
              <tr><td><strong>Active Model</strong></td><td class="mono" id="overviewActiveModel">—</td></tr>
              <tr><td><strong>Encryption Vault</strong></td><td><span style="color:var(--success);">● Active (AES-256-GCM)</span></td></tr>
              <tr><td><strong>Configured Providers</strong></td><td id="overviewProvidersCount">—</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      
      <div id="view-files" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Workspace Files</h2>
            <p class="panel-tagline">Local files available to the agent for contextual inspection.</p>
          </div>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Path</th><th>Type</th><th>Action</th></tr>
            </thead>
            <tbody id="filesTableBody">
              <tr><td>package.json</td><td>Config</td><td><button class="quick-action-pill" onclick="sendPromptAction('Read package.json')">Inspect</button></td></tr>
              <tr><td>README.md</td><td>Documentation</td><td><button class="quick-action-pill" onclick="sendPromptAction('Read README.md')">Inspect</button></td></tr>
              <tr><td>src/</td><td>Source Directory</td><td><button class="quick-action-pill" onclick="sendPromptAction('List files in src')">List</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      
      <div id="view-sessions" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Sessions History</h2>
            <p class="panel-tagline">Resume, rename, and manage previous local conversations.</p>
          </div>
          <button class="btn-new-chat" onclick="startNewConversation()">+ New Chat</button>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Title</th><th>Model</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody id="sessionsFullTableBody"></tbody>
          </table>
        </div>
      </div>

      
      <div id="view-providers" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Providers Catalog</h2>
            <p class="panel-tagline">Multi-provider connections and discovery endpoints.</p>
          </div>
          <button class="quick-action-pill" onclick="loadProvidersList()">Refresh</button>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Provider</th><th>Models</th><th>Status</th><th>API Key</th></tr>
            </thead>
            <tbody id="providersTableBody"></tbody>
          </table>
        </div>
      </div>

      
      <div id="view-models" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Model Directory</h2>
            <p class="panel-tagline">Filter models and review provider capabilities.</p>
          </div>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Model ID</th><th>Provider</th><th>Capabilities</th><th>Action</th></tr>
            </thead>
            <tbody id="modelsTableBody"></tbody>
          </table>
        </div>
      </div>

      
      <div id="view-keys" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">API Keys Vault</h2>
            <p class="panel-tagline">AES-256-GCM encrypted credentials stored exclusively in local SQLite.</p>
          </div>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.25rem; margin-bottom:1.5rem;">
          <h3 style="font-size:0.9rem; font-weight:700; margin-bottom:0.75rem;">Add New Secret</h3>
          <div style="display:grid; grid-template-columns: 1fr 2fr auto; gap:0.75rem;">
            <select id="addKeyProviderSelect" style="background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.5rem; font-size:0.82rem; color:#fff;">
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="xai">xAI (Grok)</option>
              <option value="mistral">Mistral</option>
              <option value="openrouter">OpenRouter</option>
              <option value="together">Together AI</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
            <input type="password" id="addKeySecretInput" placeholder="sk-..." style="background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.5rem 0.75rem; font-size:0.82rem; color:#fff;">
            <button class="btn-new-chat" onclick="saveNewKey()">Save Secret</button>
          </div>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Provider</th><th>Identifier</th><th>Masked Secret</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody id="keysTableBody"></tbody>
          </table>
        </div>
      </div>

      
      <div id="view-usage" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Usage & Analytics</h2>
            <p class="panel-tagline">Aggregated token consumption, latency, and cost estimates.</p>
          </div>
        </div>
        <div class="clean-admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Provider</th><th>Requests</th><th>Total Tokens</th></tr>
            </thead>
            <tbody id="usageTableBody"></tbody>
          </table>
        </div>
      </div>

      
      <div id="view-settings" class="standard-panel-view">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-headline">Settings</h2>
            <p class="panel-tagline">Local environment options and encrypted backup export.</p>
          </div>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.25rem;">
          <h3 style="font-size:0.9rem; font-weight:700; margin-bottom:0.4rem;">Encrypted Backup Export</h3>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:1rem;">Download an encrypted snapshot of sessions, settings, and provider configurations.</p>
          <button class="btn-new-chat" onclick="exportDataBackup()">Download Backup Snapshot</button>
        </div>
      </div>
    </div>

    
    <div class="composer-wrapper">
      <div class="composer-container">
        <textarea
          id="chatPromptInput"
          class="composer-textarea"
          placeholder="Ask OpenKey anything..."
          onkeydown="handleTextareaKey(event)"
        ></textarea>
        <div class="composer-controls">
          <div class="composer-tools-left">
            <span class="tool-icon-btn" title="Attach file">📎</span>
            <span class="tool-icon-btn" title="Web search">🌐</span>
            <span class="tool-icon-btn" title="Code snippet">&lt;/&gt;</span>
            <span class="tool-icon-btn" title="Files workspace">📁</span>
          </div>
          <div class="composer-tools-right">
            <div class="composer-model-pill" onclick="openModelPickerModal()">
              <span id="composerModelIcon">🤖</span>
              <span id="composerModelTitle">DeepSeek · deepseek-chat</span>
              <span>▾</span>
            </div>
            <button class="btn-send-message" onclick="submitMessage()" title="Send">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  
  <aside class="right-info-panel">
    <div class="right-panel-tabs">
      <div class="right-tab-item active" id="rightTabInfo" onclick="switchRightTab('info')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Info</span>
      </div>
      <div class="right-tab-item" id="rightTabTools" onclick="switchRightTab('tools')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
        <span>Tools</span>
      </div>
    </div>

    <div class="right-panel-body" id="rightInfoContent">
      
      <div class="openkey-info-hero-card">
        <svg class="openkey-hero-img" viewBox="0 0 36 36" fill="none">
          <circle cx="17" cy="15" r="9.5" stroke="#2F7CFF" stroke-width="3"/>
          <circle cx="17" cy="15" r="5" fill="#0B0F14" stroke="#2F7CFF" stroke-width="2"/>
          <path d="M17 24.5V32M17 28H22M17 32H22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="openkey-card-name">OpenKey</span>
        <span class="openkey-card-subtitle">Your AI command center</span>
      </div>

      
      <div class="metadata-rows-list">
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <span>Workspace</span>
          </span>
          <span class="meta-row-val" id="metaWsVal">Personal</span>
        </div>
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            <span>Active Model</span>
          </span>
          <span class="meta-row-val" id="metaModelVal">deepseek-chat</span>
        </div>
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
            <span>Provider</span>
          </span>
          <span class="meta-row-val" id="metaProviderVal">DeepSeek</span>
        </div>
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1-1-3 3 1.5 1.5-4 4A2 2 0 006 19l4-4 1.5 1.5 3-3-1-1 1.5-1.5L18 8.5l1.5-1.5 2-2z"/></svg>
            <span>API Keys</span>
          </span>
          <span class="meta-row-val" id="metaKeysVal">1 connected</span>
        </div>
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Total Tokens</span>
          </span>
          <span class="meta-row-val" id="metaTokensVal">0</span>
        </div>
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Total Requests</span>
          </span>
          <span class="meta-row-val" id="metaRequestsVal">0</span>
        </div>
        <div class="meta-row-item">
          <span class="meta-row-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            <span>Estimated Cost</span>
          </span>
          <span class="meta-row-val" id="metaCostVal">$0.00</span>
        </div>
      </div>

      
      <div class="recent-sessions-box">
        <div class="recent-sessions-header">
          <span>Recent Sessions</span>
          <span class="recent-view-all-link" onclick="navigateTo('sessions')">View all</span>
        </div>
        <div class="recent-sessions-items" id="recentSessionsSidebarList"></div>
      </div>

      
      <div class="tip-box-card">
        <span class="tip-box-icon">ⓘ</span>
        <div>
          <strong style="color:#FFFFFF;">Tip:</strong> Use <span style="color:var(--blue-bright); font-family:var(--font-mono);">Ctrl K</span> to open the command palette.
        </div>
      </div>
    </div>
  </aside>

  
  
  <div id="modelPickerModal" class="modal-backdrop">
    <div class="modal-window" style="max-width:540px;">
      <div class="modal-head">
        <span class="modal-title">Select Active Model</span>
        <span class="modal-close" onclick="closeAllModals()">✕</span>
      </div>
      <div class="modal-content">
        <input type="text" id="modelSearchBox" placeholder="Search models (e.g. gpt-4o, claude, deepseek)..." style="width:100%; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.65rem 0.85rem; font-size:0.85rem; color:#fff; margin-bottom:1rem;" oninput="filterModelPicker(this.value)">
        <div id="modelPickerList" style="display:flex; flex-direction:column; gap:0.4rem; max-height:360px; overflow-y:auto;"></div>
      </div>
    </div>
  </div>

  
  <div id="compareModal" class="modal-backdrop">
    <div class="modal-window" style="max-width:860px;">
      <div class="modal-head">
        <span class="modal-title">Model Comparison Suite</span>
        <span class="modal-close" onclick="closeAllModals()">✕</span>
      </div>
      <div class="modal-content">
        <textarea id="comparePromptField" placeholder="Enter evaluation prompt..." style="width:100%; height:70px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.65rem; font-size:0.85rem; color:#fff; margin-bottom:0.75rem; resize:none;"></textarea>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <span style="font-size:0.78rem; color:var(--text-muted);">Evaluates DeepSeek, OpenAI, and Anthropic in parallel.</span>
          <button class="btn-new-chat" onclick="executeCompare()">Run Benchmark</button>
        </div>
        <div id="compareGridResult" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem;"></div>
      </div>
    </div>
  </div>

  
  <div id="wsModal" class="modal-backdrop">
    <div class="modal-window" style="max-width:480px;">
      <div class="modal-head">
        <span class="modal-title">Switch Workspace</span>
        <span class="modal-close" onclick="closeAllModals()">✕</span>
      </div>
      <div class="modal-content" id="wsModalList"></div>
    </div>
  </div>

  
  <div id="cmdPaletteModal" class="modal-backdrop">
    <div class="modal-window" style="max-width:540px;">
      <input type="text" id="cmdInputBox" placeholder="Type a command or jump to section..." style="width:100%; background:transparent; border-bottom:1px solid var(--border-subtle); padding:1rem 1.25rem; font-size:1rem; color:#fff;" oninput="renderCmdList(this.value)">
      <div id="cmdPaletteList" style="padding:0.75rem; display:flex; flex-direction:column; gap:0.25rem; max-height:360px; overflow-y:auto;"></div>
    </div>
  </div>

  
  <script>
    let activeProvider = 'deepseek';
    let activeModel = 'deepseek-chat';
    let currentSessionId = null;
    let catalog = [];
    let cachedSessions = [];

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCmdPalette();
      }
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    function navigateTo(tabId) {
      document.querySelectorAll('.standard-panel-view').forEach(p => p.style.display = 'none');
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

      const activeNav = document.getElementById('nav-' + tabId);
      if (activeNav) activeNav.classList.add('active');

      const chatContainer = document.getElementById('view-chat-container');
      if (tabId === 'chat') {
        chatContainer.style.display = 'flex';
      } else {
        chatContainer.style.display = 'none';
        const panel = document.getElementById('view-' + tabId);
        if (panel) panel.style.display = 'block';
      }

      if (tabId === 'overview') loadOverviewData();
      if (tabId === 'sessions') loadSessionsList();
      if (tabId === 'providers') loadProvidersList();
      if (tabId === 'models') loadModelsList();
      if (tabId === 'keys') loadKeysList();
      if (tabId === 'usage') loadUsageData();
    }

    async function refreshCatalogData() {
      try {
        const res = await fetch('/api/providers');
        const data = await res.json();
        catalog = data.providers || [];
        activeProvider = data.activeProviderId || 'deepseek';
        activeModel = data.activeModelId || 'deepseek-chat';
        updateHeaderAndMetadata();
      } catch {}
    }

    function updateHeaderAndMetadata() {
      document.getElementById('subbarProviderName').textContent = activeProvider.toUpperCase();
      document.getElementById('subbarModelId').textContent = activeModel + ' ▾';
      document.getElementById('composerModelTitle').textContent = activeProvider.toUpperCase() + ' · ' + activeModel;
      document.getElementById('metaProviderVal').textContent = activeProvider.toUpperCase();
      document.getElementById('metaModelVal').textContent = activeModel;
    }

    async function startNewConversation() {
      currentSessionId = null;
      document.getElementById('welcomeScreenHero').style.display = 'flex';
      const feed = document.getElementById('chatFeedList');
      feed.style.display = 'none';
      feed.innerHTML = '';
      navigateTo('chat');
    }

    function sendPromptAction(promptText) {
      document.getElementById('chatPromptInput').value = promptText;
      submitMessage();
    }

    function handleTextareaKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitMessage();
      }
    }

    async function submitMessage() {
      const input = document.getElementById('chatPromptInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      document.getElementById('welcomeScreenHero').style.display = 'none';
      const feed = document.getElementById('chatFeedList');
      feed.style.display = 'flex';

      const userCard = document.createElement('div');
      userCard.className = 'chat-msg-card user';
      userCard.innerHTML = \`
        <div class="msg-header-row">
          <span class="msg-badge user">YOU</span>
          <span style="color:var(--text-muted); font-family:var(--font-mono);">\${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div style="color:#FFFFFF; white-space:pre-wrap;">\${text}</div>
      \`;
      feed.appendChild(userCard);

      const aiCard = document.createElement('div');
      aiCard.className = 'chat-msg-card assistant';
      aiCard.innerHTML = \`
        <div class="msg-header-row">
          <span class="msg-badge ai">AI (\${activeModel})</span>
          <span style="color:var(--text-muted); font-family:var(--font-mono);">\${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="ai-body-content" style="color:#FFFFFF; white-space:pre-wrap;">...</div>
      \`;
      feed.appendChild(aiCard);

      const centerView = document.getElementById('mainCenterView');
      centerView.scrollTop = centerView.scrollHeight;

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, sessionId: currentSessionId, providerId: activeProvider, modelId: activeModel })
      });

      const bodyDiv = aiCard.querySelector('.ai-body-content');
      bodyDiv.textContent = '';
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

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
                loadSidebarRecentSessions();
              } else if (event.type === 'token') {
                bodyDiv.textContent += event.content;
              } else if (event.type === 'tool_start') {
                const t = document.createElement('div');
                t.style.fontSize = '0.76rem';
                t.style.fontFamily = 'var(--font-mono)';
                t.style.color = 'var(--blue-bright)';
                t.textContent = '⚙ Running ' + event.toolName + '...';
                aiCard.insertBefore(t, bodyDiv);
              } else if (event.type === 'error') {
                bodyDiv.textContent = 'Error: ' + event.error;
              }
              centerView.scrollTop = centerView.scrollHeight;
            } catch {}
          }
        }
      }
      loadUsageData();
    }

    async function loadSidebarRecentSessions() {
      try {
        const res = await fetch('/api/sessions');
        cachedSessions = await res.json();
        const list = document.getElementById('recentSessionsSidebarList');
        if (cachedSessions.length === 0) {
          list.innerHTML = '<span style="font-size:0.72rem; color:var(--text-muted);">No recent sessions.</span>';
          return;
        }
        list.innerHTML = cachedSessions.slice(0, 5).map(s => \`
          <div class="recent-session-entry" onclick="resumeSession('\${s.id}')">
            <span class="recent-session-title">○ \${s.title}</span>
            <span class="recent-session-time">\${timeAgo(s.updatedAt)}</span>
          </div>
        \`).join('');
      } catch {}
    }

    function timeAgo(dateStr) {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'ahora';
      if (mins < 60) return 'hace ' + mins + ' min';
      const hours = Math.floor(mins / 60);
      if (hours < 24) return 'hace ' + hours + ' h';
      return 'ayer';
    }

    async function resumeSession(id) {
      const res = await fetch('/api/sessions/' + id);
      const session = await res.json();
      currentSessionId = session.id;
      activeProvider = session.providerId;
      activeModel = session.modelId;
      updateHeaderAndMetadata();

      document.getElementById('welcomeScreenHero').style.display = 'none';
      const feed = document.getElementById('chatFeedList');
      feed.style.display = 'flex';
      feed.innerHTML = '';

      (session.messages || []).forEach(m => {
        const isUser = m.role === 'user';
        const card = document.createElement('div');
        card.className = 'chat-msg-card ' + (isUser ? 'user' : 'assistant');
        card.innerHTML = \`
          <div class="msg-header-row">
            <span class="msg-badge \${isUser ? 'user' : 'ai'}">\${isUser ? 'YOU' : 'AI'}</span>
            <span style="color:var(--text-muted); font-family:var(--font-mono);">\${new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <div style="color:#FFFFFF; white-space:pre-wrap;">\${m.content}</div>
        \`;
        feed.appendChild(card);
      });

      navigateTo('chat');
    }

    async function loadSessionsList() {
      const res = await fetch('/api/sessions');
      const sessions = await res.json();
      const tbody = document.getElementById('sessionsFullTableBody');
      tbody.innerHTML = sessions.map(s => \`
        <tr>
          <td><strong>\${s.title}</strong></td>
          <td class="mono">\${s.modelId}</td>
          <td class="mono" style="color:var(--text-muted);">\${new Date(s.updatedAt).toLocaleString()}</td>
          <td>
            <button class="quick-action-pill" onclick="resumeSession('\${s.id}')">Open</button>
          </td>
        </tr>
      \`).join('');
    }

    async function loadProvidersList() {
      const res = await fetch('/api/providers');
      const data = await res.json();
      const tbody = document.getElementById('providersTableBody');
      tbody.innerHTML = (data.providers || []).map(p => \`
        <tr>
          <td><strong>\${p.name}</strong></td>
          <td class="mono">\${p.models?.length || 0} models</td>
          <td><span style="color:var(--success);">Connected</span></td>
          <td><button class="quick-action-pill" onclick="navigateTo('keys')">Manage Key</button></td>
        </tr>
      \`).join('');
    }

    async function loadModelsList() {
      const tbody = document.getElementById('modelsTableBody');
      let rows = [];
      catalog.forEach(p => {
        (p.models || []).forEach(m => {
          rows.push(\`
            <tr>
              <td class="mono"><strong>\${m.id}</strong></td>
              <td>\${p.name}</td>
              <td style="color:var(--text-muted);">Text · Streaming \${m.capabilities?.tools ? '· Tools' : ''} \${m.capabilities?.reasoning ? '· Reasoning' : ''}</td>
              <td><button class="quick-action-pill" onclick="selectActiveModel('\${p.id}', '\${m.id}')">Select</button></td>
            </tr>
          \`);
        });
      });
      tbody.innerHTML = rows.join('');
    }

    async function selectActiveModel(providerId, modelId) {
      activeProvider = providerId;
      activeModel = modelId;
      await fetch('/api/config/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, modelId })
      });
      updateHeaderAndMetadata();
      closeAllModals();
    }

    async function loadKeysList() {
      const res = await fetch('/api/keys');
      const keys = await res.json();
      const tbody = document.getElementById('keysTableBody');
      document.getElementById('metaKeysVal').textContent = keys.length + ' connected';
      tbody.innerHTML = keys.map(k => \`
        <tr>
          <td><strong>\${k.providerId.toUpperCase()}</strong></td>
          <td class="mono">\${k.name}</td>
          <td class="mono">\${k.maskedKey}</td>
          <td><span style="color:var(--success);">Encrypted</span></td>
          <td><button class="quick-action-pill" style="color:var(--danger);" onclick="deleteKey('\${k.id}')">Delete</button></td>
        </tr>
      \`).join('');
    }

    async function saveNewKey() {
      const providerId = document.getElementById('addKeyProviderSelect').value;
      const apiKey = document.getElementById('addKeySecretInput').value.trim();
      if (!apiKey) return;
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, name: providerId + '-key', apiKey })
      });
      document.getElementById('addKeySecretInput').value = '';
      loadKeysList();
    }

    async function deleteKey(id) {
      await fetch('/api/keys/' + id, { method: 'DELETE' });
      loadKeysList();
    }

    async function loadUsageData() {
      const res = await fetch('/api/usage');
      const d = await res.json();
      document.getElementById('metaTokensVal').textContent = d.totalTokens.toLocaleString();
      document.getElementById('metaRequestsVal').textContent = d.totalRequests.toLocaleString();
      document.getElementById('metaCostVal').textContent = '$' + (d.totalTokens * 0.000004).toFixed(2);

      const tbody = document.getElementById('usageTableBody');
      tbody.innerHTML = (d.byProvider || []).map(p => \`
        <tr>
          <td><strong>\${p.providerId.toUpperCase()}</strong></td>
          <td class="mono">\${p.requests}</td>
          <td class="mono">\${p.totalTokens.toLocaleString()}</td>
        </tr>
      \`).join('');
    }

    async function loadOverviewData() {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      document.getElementById('overviewWsPath').textContent = data.currentWorkspace?.path || 'C:\\\\Workspace';
      document.getElementById('overviewActiveModel').textContent = activeProvider.toUpperCase() + ' / ' + activeModel;
      document.getElementById('overviewProvidersCount').textContent = catalog.length + ' providers ready';
    }

    function openModelPickerModal() {
      renderModelPickerList('');
      document.getElementById('modelPickerModal').classList.add('open');
    }

    function renderModelPickerList(q) {
      const list = document.getElementById('modelPickerList');
      let items = [];
      catalog.forEach(p => {
        (p.models || []).forEach(m => {
          if (!q || m.id.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())) {
            items.push(\`
              <div style="padding:0.6rem 0.85rem; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="selectActiveModel('\${p.id}', '\${m.id}')">
                <div>
                  <div style="font-weight:700; font-size:0.85rem;">\${m.id}</div>
                  <div style="font-size:0.7rem; color:var(--text-muted);">\${p.name}</div>
                </div>
                \${m.id === activeModel ? '<span style="color:var(--blue-bright); font-size:0.75rem;">● Active</span>' : ''}
              </div>
            \`);
          }
        });
      });
      list.innerHTML = items.join('');
    }

    function filterModelPicker(val) {
      renderModelPickerList(val);
    }

    function openCompareModal() {
      document.getElementById('compareModal').classList.add('open');
    }

    async function executeCompare() {
      const prompt = document.getElementById('comparePromptField').value.trim();
      if (!prompt) return;
      const grid = document.getElementById('compareGridResult');
      grid.innerHTML = '<div style="color:var(--text-muted); grid-column:span 3; text-align:center; padding:1.5rem;">Benchmarking models in parallel...</div>';

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          models: [
            { providerId: 'deepseek', modelId: 'deepseek-chat' },
            { providerId: 'openai', modelId: 'gpt-4o' },
            { providerId: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' }
          ]
        })
      });
      const data = await res.json();
      grid.innerHTML = (data.results || []).map(r => \`
        <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem; display:flex; flex-direction:column; gap:0.5rem;">
          <div style="font-weight:700; font-size:0.82rem; color:var(--blue-bright);">\${r.modelId}</div>
          <div style="font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); border-bottom:1px solid var(--border-subtle); padding-bottom:0.35rem;">
            ⏱ \${r.durationSec}s · \${r.tokens} tok
          </div>
          <div style="font-size:0.8rem; line-height:1.5; color:#fff; white-space:pre-wrap; max-height:220px; overflow-y:auto;">\${r.content || r.error}</div>
        </div>
      \`).join('');
    }

    function openWsModal() {
      const list = document.getElementById('wsModalList');
      list.innerHTML = \`
        <div style="padding:0.75rem; background:var(--bg-elevated); border:1px solid var(--border-blue); border-radius:var(--radius-md); margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700;">Personal Workspace</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">Default local directory</div>
          </div>
          <span style="color:var(--success);">● Active</span>
        </div>
      \`;
      document.getElementById('wsModal').classList.add('open');
    }

    const commandRegistry = [
      { label: 'New Chat Conversation', action: () => startNewConversation() },
      { label: 'Compare Models Benchmark', action: () => openCompareModal() },
      { label: 'Manage API Keys Vault', action: () => navigateTo('keys') },
      { label: 'Providers & Endpoints', action: () => navigateTo('providers') },
      { label: 'Model Directory', action: () => navigateTo('models') },
      { label: 'Usage & Cost Analytics', action: () => navigateTo('usage') },
      { label: 'Settings & Backups', action: () => navigateTo('settings') }
    ];

    function openCmdPalette() {
      document.getElementById('cmdPaletteModal').classList.add('open');
      document.getElementById('cmdInputBox').value = '';
      renderCmdList('');
      setTimeout(() => document.getElementById('cmdInputBox').focus(), 50);
    }

    function renderCmdList(q) {
      const list = document.getElementById('cmdPaletteList');
      const filtered = commandRegistry.filter(c => !q || c.label.toLowerCase().includes(q.toLowerCase()));
      list.innerHTML = filtered.map((c, i) => \`
        <div style="padding:0.6rem 0.85rem; border-radius:var(--radius-md); font-size:0.85rem; cursor:pointer; color:var(--text-secondary);" onmouseover="this.style.background='var(--blue-soft)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)';" onclick="commandRegistry[\${commandRegistry.indexOf(c)}].action(); closeAllModals();">
          \${c.label}
        </div>
      \`).join('');
    }

    function closeAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    }

    async function exportDataBackup() {
      const res = await fetch('/api/data/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openkey-backup-' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
    }

    refreshCatalogData();
    loadSidebarRecentSessions();
    loadUsageData();
  </script>
</body>
</html>`;
}
