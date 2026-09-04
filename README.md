# OpenKey ⚡

> **Universal AI API Key Manager & Terminal Agent for Developers**

OpenKey is an open-source, local-first CLI/TUI and Web studio that combines a **zero-leakage universal AI API key vault** with an **autonomous terminal agent**. Connect multiple AI providers (OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, OpenRouter, Ollama, and any custom OpenAI-compatible endpoint) with zero vendor lock-in and **strictly manual model selection**.

---

## 🌟 Key Features

- **🔐 Zero-Leakage AES-256-GCM Vault**: API keys are encrypted at rest with unique salts, IVs, and authentication tags. Keys are never printed in logs, error traces, or network headers.
- **🧠 100% Explicit Model Selection**: No silent fallbacks or unexpected model switches. You are always in control of which model runs your prompt.
- **⚡ Native Multi-Provider Support**:
  - OpenAI (`gpt-4o`, `o1`, `o3-mini`)
  - Anthropic (`claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku`)
  - Google Gemini (`gemini-2.0-flash`, `gemini-1.5-pro`)
  - DeepSeek (`deepseek-chat`, `deepseek-reasoner` with reasoning stream)
  - Groq (`llama-3.3-70b`, `llama-3.1-8b`)
  - OpenRouter (hundreds of models)
  - Ollama (local offline models)
  - **"Another"**: Any custom OpenAI-compatible API or proxy endpoint.
- **🛠️ Sandboxed Agent Tool Runtime**: The AI agent can read, write, and edit files, search codebases, and run terminal commands with an interactive security permission firewall.
- **📊 Token & Cost Usage Tracking**: Local SQLite analytics capturing request volume, latency, input/output tokens, and metrics.
- **🖥️ Dual Interface**: Modern React-Ink Terminal UI (TUI) + Localhost Web Studio (`127.0.0.1:3000`).

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/openkey/openkey.git
cd openkey
npm install
```

### 2. Launch Terminal TUI

```bash
npm run dev
# or global: openkey
```

### 3. Connect a Provider

Inside the TUI, type:
```text
/connect
```
Select your provider (e.g. `OpenAI`), enter your API Key (it will be encrypted immediately), and choose your model.

### 4. Chat and Agent Execution

```text
You: Inspect this codebase and find why tests are failing.
AI: ⚙ [Tool: list_directory] running...
AI: ⚙ [Tool: read_file] package.json...
AI: Found the issue in src/index.ts:14. Would you like me to fix it?
```

---

## ⌨️ TUI Commands

| Command | Action |
|---|---|
| `/connect` | Open provider manager and add/update encrypted API keys |
| `/model` | Fast model switcher for active provider |
| `/usage` | Display token usage and analytics dashboard |
| `/doctor` | Run comprehensive system and security diagnostics |
| `/clear` | Clear screen buffer |
| `/exit` | Exit OpenKey |

---

## 💻 CLI Commands

```bash
# Launch interactive TUI
openkey

# Open provider setup
openkey connect

# List available models
openkey models

# Display usage statistics
openkey usage

# Run system doctor checks
openkey doctor

# Launch local Web Studio
openkey web --port 3000
```

---

## 🌐 Local Web Studio

Run `openkey web` and open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser for a local-first web interface with real-time SSE streaming, API key management, and usage analytics.

---

## 🔒 Security Architecture

OpenKey is designed from the ground up for strict confidentiality:
1. **Authenticated Encryption**: Keys are encrypted using AES-256-GCM with 100,000 iterations of PBKDF2.
2. **Log Redaction Engine**: A centralized regex sanitizer intercepts all log lines, exceptions, and terminal outputs to scrub credentials.
3. **Workspace Boundaries**: Built-in path traversal safeguards block file system access outside the project root without confirmation.
4. **Dangerous Command Firewall**: Destructive shell operations (`rm -rf`, disk wipes, fork bombs, remote pipe executions) require explicit confirmation.

---

## 📜 License

MIT License © 2026 OpenKey Contributors.
