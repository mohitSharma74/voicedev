# VoiceDev Vision

## Mission

**Voice-native development** — voice is a first-class way to drive your development workflows, not just a dictation accessory.

VoiceDev exists because development is full of repetitive, interruptive actions — saving files, committing code, navigating to a line, running a command. These small tasks pull you out of flow. Voice lets you stay in the zone: say what you mean, and your tools do the rest.

## Core Principles

### 1. Workflows over keystrokes

Voice isn't about replacing your keyboard one character at a time. It shines at expressing _intent_ — chaining actions like _"git status → commit message fixed the auth bug → push"_ in a way that's faster and more natural than hunting through menus or remembering shortcuts. We prioritize multi-step workflows over isolated commands.

### 2. Privacy as a feature

Your voice is personal data. VoiceDev gives you the choice: use fast cloud providers when speed matters, or run fully offline with local transcription when privacy matters. This isn't an afterthought — it's a core architectural decision. We will never make cloud the only option.

### 3. Accessible by nature

Every workflow we make speakable is one less barrier for a developer who needs it. Accessibility isn't a separate feature — it's a natural consequence of voice-native design done right. This is a growing pillar: present in the foundation today, deepening with every release through better feedback, more modalities, and broader device support.

### 4. Progressive disclosure

Say _"save all"_ on day one. Chain _"diff → stage → commit → push"_ by day five. Build custom voice macros by day thirty. VoiceDev meets you where you are and grows with you. Simple things should be simple; powerful things should be possible.

## Anti-Goals

These are things VoiceDev deliberately chooses _not_ to become:

- **Not a code generator.** VoiceDev orchestrates your tools — it doesn't write your code. Code generation belongs to Copilot, Cursor, and similar tools. We're the voice layer that connects you to them.

- **Not a keyboard replacement.** Voice complements typing; it doesn't compete with it. Some things are better typed. Some things are better spoken. We optimize for the latter.

- **Not a closed ecosystem.** Multi-provider transcription, multi-IDE ambitions, user-defined commands. VoiceDev is a bridge, not a walled garden.

## Roadmap: Now / Next / Exploring

This roadmap reflects where VoiceDev is today and where it's heading, organized by the pillars that matter most. Items in _Exploring_ are directions we're excited about — they signal intent, not promises.

### 🟢 Now (v0.1.0-preview)

What's shipped and working today.

**Deeper Workflows**

- 30+ voice commands across editor, git, navigation, Copilot CLI, and Copilot Chat
- Wildcard pattern matching for dynamic arguments (_"git commit message fixed the login bug"_)
- Fuzzy matching with confidence scoring — voice doesn't need to be perfect

**Smarter Voice**

- Multi-provider speech-to-text: Groq (default), Mistral Voxtral, OpenAI, Local (offline)
- Privacy-first local mode via faster-whisper — your voice never leaves your machine
- Audio feedback (start/stop chimes) for clear recording state

**Broader Reach**

- Windows fully supported, macOS/Linux in progress
- Command Center webview for visual command reference
- Secure API key storage via VS Code SecretStorage

### 🔵 Next

What we're building in upcoming releases.

**Deeper Workflows**

- Workflow chaining — compose multi-step sequences (e.g., diff + stage + commit + push as a single voice flow)
- Custom voice commands and reusable snippets — define your own triggers
- More VS Code-native actions by voice (search extensions, update settings, open projects)

**Smarter Voice**

- AI-powered developer workflows (inline completion, coding assists, voice-driven refactoring)
- Real-time translation from multiple languages into English
- Context-aware intent routing — smarter understanding of ambiguous commands

**Broader Reach**

- Full cross-platform support (macOS, Linux parity with Windows)
- Voice-based web search with responses inside the IDE

### 🟣 Exploring

Directions we're excited about. These signal where VoiceDev could go.

**Deeper Workflows**

- Conversational mode — multi-turn voice interactions with your tools
- Team-shared voice command libraries

**Smarter Voice**

- Developer dictionary — learn your codebase's variable names, API endpoints, project-specific vocabulary
- GPU-accelerated local transcription for near-cloud speed offline
- Voice feedback — spoken confirmations and responses, not just text

**Broader Reach**

- Multi-IDE expansion (Open VSX, Zed, and beyond)
- CI/CD voice integration — trigger pipelines, check build status by voice
- Dedicated accessibility testing and features (screen reader integration, haptic feedback, voice-only navigation mode)

## Identity

| Touchpoint           | Canonical Text                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Tagline**          | _Voice-native development_                                                                    |
| **One-liner**        | _Voice-native development for VS Code — speak to navigate, commit, and control your workflow_ |
| **Philosophy**       | Voice is a first-class way to drive your development workflows                                |
| **For contributors** | See the 4 Core Principles above — every PR should align with at least one                     |

---

_This document is the single source of truth for VoiceDev's direction. README, package.json, welcome messages, and contributor docs all derive from it._
