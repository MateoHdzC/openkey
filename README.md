# OpenKey ⚡
> **Universal AI API Key Vault, Enterprise Web Studio & Terminal Agent**

OpenKey is an open-source, local-first platform that combines an **AES-256-GCM zero-leakage API key vault** with an **autonomous terminal agent** and an **Enterprise Web Studio**. Connect multiple AI providers (OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, OpenRouter, Ollama, xAI, Mistral, Together AI, and custom endpoints) with zero vendor lock-in, strict privacy, and **100% manual model selection**.

---

## 🌟 Key Capabilities

- **🔐 Machine-Scoped AES-256-GCM Vault**: API keys are encrypted at rest with unique salts, IVs, and authentication tags. Encryption keys are derived per user and per machine using PBKDF2 (100,000 iterations HMAC-SHA512). Databases are stored locally in `~/.openkey/openkey.sqlite` and are never committed to git.
- **🧠 100% Explicit Model Control**: No silent fallbacks or unexpected model switches. Choose and switch models on the fly during active conversations without losing context.
- **⚡ Native Multi-Provider Support**:
  - **OpenAI**: `gpt-4o`, `o1`, `o3-mini`
  - **Anthropic**: `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku`
  - **Google Gemini**: `gemini-2.0-flash`, `gemini-1.5-pro`
  - **DeepSeek**: `deepseek-chat`, `deepseek-reasoner` (with real-time reasoning stream)
  - **Groq**: `llama-3.3-70b`, `llama-3.1-8b`
  - **xAI**: `grok-2`, `grok-beta`
  - **Mistral**: `mistral-large-latest`, `codestral-latest`
  - **Together AI**: `meta-llama/Llama-3.3-70B-Instruct-Turbo`
  - **OpenRouter**: Hundreds of community & proprietary models
  - **Ollama**: Local offline models (`llama3`, `mistral`, `deepseek-r1`)
  - **Custom Endpoints**: Any OpenAI-compatible proxy or local server
- **🖥️ Enterprise Web Studio (`127.0.0.1:3000`)**:
  - **Spacious Conversation Workspace**: Clean message blocks with role badges (`YOU` / `AI`), timestamps, and copy actions.
  - **Live In-Chat Model Switcher**: Change from DeepSeek to GPT-4o mid-conversation without resetting context.
  - **Model Comparison Suite (`/compare`)**: Run benchmarks across multiple models simultaneously and compare latency (seconds), token consumption, and estimated cost.
  - **Sessions History**: View, resume, rename, and delete conversation history.
  - **Workspaces**: Seamlessly switch between project folders and workspace contexts.
  - **Command Palette (`Ctrl+K` / `⌘K`)**: Instant keyboard navigation across all views and actions.
  - **Data Backup**: Export and import encrypted configuration and conversation snapshots.
- **🛠️ Sandboxed Agent Tool Runtime**: The terminal agent can read, write, and inspect codebases, run shell commands, and automate tasks with an interactive confirmation firewall for destructive actions.
- **📊 Local Analytics**: Local SQLite token tracking, request metrics, and cost estimates.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20+ or v24+
- **npm** or **pnpm**

### 2. Installation & Global Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/MateoHdzC/openkey.git
cd openkey
npm install
```

Build the project:

```bash
npm run build
```

Link OpenKey globally so you can run the `openkey` command from **any terminal directory**:

```bash
npm link
```

---

## 🎮 How to Use OpenKey

OpenKey provides two simultaneous interaction modes: an interactive **Terminal TUI** and a local **Web Studio**.

---

### Option A: Interactive Terminal TUI

Run `openkey` from any folder in your terminal:

```bash
openkey
```

When started, OpenKey will:
1. Launch the minimal, interactive **Terminal UI (TUI)**.
2. Automatically boot the **Local Web Studio** in the background at `http://127.0.0.1:3000`.

#### Terminal Slash Commands
Inside the chat prompt (`> `), type:

| Command | Description |
|---|---|
| `/connect` | Open the key manager to save an API key for any provider |
| `/sessions` | View saved conversations, resume past chats, rename, or delete sessions |
| `/model` | Switch the active model or enter a custom model ID |
| `/usage` | View token consumption, request counts, and per-provider analytics |
| `/doctor` | Run automated security, database, and connectivity health checks |
| `/clear` | Clear the current conversation messages |
| `/exit` | Gracefully terminate OpenKey |

---

### Option B: Local Web Studio

You can also launch the Web Studio directly on your preferred port:

```bash
openkey web --port 3000
```

Open your browser at:
👉 **[http://127.0.0.1:3000](http://127.0.0.1:3000)**

#### Web Studio Views:
- **Chat**: Focused conversation workspace with distinct message blocks, reasoning stream (`Thinking ›`), and tool execution badges.
- **Sessions**: Resume saved conversations, rename session titles, or delete old chats.
- **Providers & Models**: View all connected endpoints with automatic model discovery.
- **API Keys**: Add, inspect masked keys, or delete credentials from your encrypted vault.
- **Usage**: Real-time aggregated tokens, requests, and breakdown by provider.
- **Compare (`/compare`)**: Side-by-side multi-model benchmarking.
- **System Doctor**: Live diagnostic checks on vault crypto, database health, and network connectivity.
- **Settings**: Dynamic backup export and local preferences.

---

### Option C: Direct CLI Sub-Commands

Run specific actions directly from the command line without entering the full TUI:

```bash
# Manage and store provider API keys
openkey connect

# Manage and resume conversation sessions
openkey sessions

# List available models and check active selection
openkey models

# Display token usage metrics
openkey usage

# Run system integrity and crypto diagnostics
openkey doctor

# Start the Web Studio on a specific port
openkey web --port 8080
```

---

## 🔒 Security & Privacy Architecture

OpenKey is built for confidentiality and zero-leakage:

1. **Local-First Storage**: All data, session histories, and encrypted credentials are kept exclusively in `~/.openkey/openkey.sqlite` on your local machine. Nothing is ever sent to external cloud servers.
2. **Machine-Scoped AES-256-GCM Vault**:
   - Master encryption key derived with **PBKDF2 (100,000 iterations HMAC-SHA512)** from your machine and user environment: `openkey-vault-seed:${username}@${hostname}:${homedir}`.
   - Each key is encrypted with an independent 16-byte salt, 12-byte initialization vector (IV), and 16-byte authentication tag.
   - Even if the SQLite database is copied to another machine, it cannot be decrypted.
3. **Automated Log Redaction**: A centralized sanitizer intercepts all log lines, error traces, and outputs to scrub API keys and sensitive tokens before they are rendered.
4. **Security Firewall**: Destructive shell operations (`rm -rf`, disk wipes, fork bombs, remote pipe executions) require explicit user confirmation (`[Y] Allow / [N] Deny`).

---

## 🧪 Testing

Run the automated test suite with Vitest:

```bash
npm test
```

---

## 📜 License

MIT License © 2026 [MateoHdzC](https://github.com/MateoHdzC/openkey).
