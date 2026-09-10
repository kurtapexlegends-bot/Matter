# ⚛️ Matter

> **Production-Grade Desktop AI Agent Terminal Platform & Multi-Agent Swarm Environment**  
> Inspired by the cutting-edge ergonomics of **Bridgemind** and **T3 Code**, with Matter's bespoke ultra-minimalist dark aesthetic. Run multiple CLI agents (Gemini CLI, Antigravity, Claude Code, ChatGPT, custom scripts) in a unified, distraction-free native desktop canvas with zero file contention, automated permission auto-approval, interactive swarm group chat, and real-time cross-agent coordination.

---

## ✨ Highlights

- **🖥️ Native Frameless Desktop Canvas (Bridgemind × T3 Code Ergonomics)**:
  - **38px Native Window Header**: Draggable app region (`-webkit-app-region: drag`), frameless window controls (`—`, `□`, `✕`), Matter branding, live agent health indicator (`● 3 Online`), sound FX toggle, and command search (`⌘K`).
  - **Seamless Native Tabs**: Drag-and-drop tab pills with agent color dots, branch tags, and active glowing underline.
  - **Edge-to-Edge Hairline Split Viewport**: Hairline 1px dividers between split terminals (`1x Focus`, `2x Split`, `Adaptive Grid`), zero wasted padding, and floating hover micro-toolbars (`[ 📋 Copy | 🗑️ Clear | ↗ Maximize | ✕ Kill ]`).

- **💬 Interactive Swarm Group Chat Room**:
  - Live communication canvas where **You (Supervisor)** and all running CLI agents collaborate in real time.
  - **Bidirectional Terminal Synchronization**: Every message you send is automatically typed into the target agent's terminal stdin (`\r`).
  - **Automated Live Response Streaming**: As CLI agents generate answers, Matter cleans out ANSI escape codes, ASCII art logos, and prompt footers (`Accept-edits mode`), rendering the response as a live speech bubble in the chat!
  - **Code Block Syntax Cards**: Markdown code blocks rendered in dark cards with syntax styling, language pills, and 1-click `Copy Code` buttons.
  - **Autonomous Cross-Agent Relaying**: If an agent mentions `@AgentName`, Matter relays the message directly to that agent's terminal so agents talk to each other autonomously!

- **⚡ Autonomous Auto-Approval Engine**:
  - Automatically answers Antigravity / Gemini CLI interactive arrow menus (`Allow access to this file?`, `Allow execution of command?`) with `Option 1` in <150ms.
  - Automatically answers `(y/n)` and `[y/N]` confirmation prompts.
  - Global toggle button in header: `⚡ Auto-Allow`.

- **🎯 Floating Command HUD (Warp / Raycast Inspired)**:
  - Floating translucent glass prompt bar at bottom-center (`Ctrl+J` / `Cmd+J`).
  - Command history navigation (`↑`/`↓`).
  - 1-Click Action Chips: `[⚡ Allow (1)]`, `[⚡ Always Allow (2)]`, `[↵ Enter]`, `[⎋ Stop]`, `[Send]`.

- **🛡️ Workspace & Branch Isolation (Git Worktrees)**:
  - Spawns agents on isolated Git worktrees/branches so multiple agents can modify the same repository concurrently with zero lock contention.

- **📦 Standalone Desktop App & Cross-Platform Packaging**:
  - Native Electron desktop shell with system tray, hardware acceleration, and frameless window.
  - Standalone installers for Windows (`.exe` NSIS / portable), macOS (`.dmg`), and Linux (`.AppImage` / `.deb`).
  - Automated CI/CD GitHub Actions workflow (`.github/workflows/release.yml`) for instant GitHub Releases on version tags.

---

## 🚀 Getting Started

### 1. Run in Development (Web + Desktop)
```bash
# Clone and navigate
cd "Agent Harness"

# Start web client and backend:
npm run dev

# Or start the Native Desktop App directly:
npm run desktop:dev
```
Open in browser at `http://localhost:5173` or interact with the native desktop window.

---

## 📦 Desktop Packaging & Distribution

```bash
# Package unpacked desktop executable (builds to release/win-unpacked/Matter.exe):
npm run build:desktop

# Build Windows NSIS Installer & Portable .exe:
npm run package:win

# Build macOS DMG (on macOS):
npm run package:mac

# Build Linux AppImage & DEB (on Linux):
npm run package:linux

# Package all platforms:
npm run package:all
```

Packaged installers and binaries are generated in the `release/` directory.

---

## 🌐 Automated GitHub Releases

This repository includes `.github/workflows/release.yml`. When you push a git tag (e.g. `v1.1.0`), GitHub Actions will automatically:
1. Build and test backend and client bundles on Windows, macOS, and Linux runners.
2. Package native installer binaries (`Matter-Setup-1.1.0-x64.exe`, `Matter-1.1.0-x64.dmg`, `Matter-1.1.0-x64.AppImage`).
3. Publish a new GitHub Release with changelog and release assets attached.

To publish a release:
```bash
git tag v1.1.0
git push origin v1.1.0
```

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + 1` ... `Ctrl + 9`** | Instant Tab Switching |
| **`Ctrl + Shift + Y`** | Global Auto-Approve (Option 1 / Yes) across all terminals |
| **`Ctrl + K` / `Cmd + K`** | Open Global Command Palette |
| **`Ctrl + N` / `Cmd + N`** | Spawn New Agent Terminal Modal |
| **`Ctrl + P` / `Cmd + P`** | Open Preset Swarms Modal |
| **`Ctrl + B` / `Cmd + B`** | Toggle Activity Drawer |
| **`Ctrl + J` / `Cmd + J`** | Focus Floating Command HUD |
| **`Arrow Up / Down`** (in HUD) | Cycle Command History |
| **`Enter`** (in Chat) | Send prompt and pipe to terminal stdin |
| **`Shift + Enter`** (in Chat) | Multiline newline |

---

## 🛠️ `agent-bridge` CLI Companion Reference

Agents running inside terminal sessions can execute `agent-bridge` commands directly:

| Command | Description |
| :--- | :--- |
| `agent-bridge prompt --to <agentId> "<prompt>"` | Type directly into peer agent's terminal stdin & log to bus |
| `agent-bridge send --to <agentId> "<msg>"` | Send message to specific agent |
| `agent-bridge broadcast "<msg>"` | Broadcast message to all active agents |
| `agent-bridge lock <resourcePath>` | Acquire exclusive file lock to avoid conflicts |
| `agent-bridge unlock <resourcePath>` | Release file lock |
| `agent-bridge locks` | List all active file locks across agents |
| `agent-bridge task claim <taskId>` | Claim a task from the shared task board |
| `agent-bridge task complete <taskId>` | Mark task completed |
| `agent-bridge blackboard set <key> <val>` | Store shared data/contracts on the blackboard |
| `agent-bridge blackboard get <key>` | Read shared variable |

---

## 🧪 Testing & Verification
```bash
# Run server test suite:
npm --prefix server test

# Run client type check and production bundle:
npm --prefix client run build
```

---

## 📄 License
MIT © 2026 Matter Contributors
