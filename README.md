![VoiceDev](https://raw.githubusercontent.com/mohitSharma74/voicedev/main/media/assets/readme-banner.png)

[![Version](https://img.shields.io/visual-studio-marketplace/v/mohitSharma74.voicedev?color=blue&label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=mohitSharma74.voicedev)
[![License: BSD-3](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-blue.svg)](https://code.visualstudio.com/)

# VoiceDev — Voice-Native Development

**Voice-native development for VS Code** — speak to navigate, commit, and control your workflow.

> ⚠️ **v0.1.0-preview** — Early development. Expect rapid improvements.

## Why VoiceDev?

Development is full of small, repetitive actions — saving files, committing code, navigating to a line, running a command. These tiny interruptions pull you out of flow.

VoiceDev makes voice a **first-class way** to drive your development workflows. Not just dictation — real workflows, entirely by voice:

```
🗣️ "git status"  →  "git commit message fixed the auth bug"  →  "git push"
```

A full commit cycle without touching a menu, a palette, or a terminal prompt.

```
🗣️ "open file server.ts"  →  "go to line 42"  →  "format document"  →  "save all"
```

Navigate, edit, and save — all spoken.

```
🗣️ "ask copilot explain this file"  →  "copilot commit"
```

AI-assisted development, triggered by voice.

### Core Beliefs

- **Workflows over keystrokes** — voice shines at chaining intent, not replacing a keyboard
- **Privacy as a feature** — cloud speed or local privacy, always your choice
- **Accessible by nature** — every speakable workflow is one less barrier
- **Progressive disclosure** — simple on day one, powerful by day thirty

> 📖 Read the full philosophy in [VISION.md](VISION.md)

## Features

### 🗣️ 30+ Voice Commands

Speak naturally — VoiceDev understands you even if your wording isn't exact, thanks to fuzzy matching with confidence scoring.

**Editor**

- _"save all"_ · _"format document"_ · _"new terminal"_ · _"close editor"_

**Git — full workflow by voice**

- _"git status"_ · _"git add all"_ · _"git diff"_ · _"git log"_
- _"git commit message fixed the login bug"_ — wildcard captures your message
- _"git pull"_ · _"git push"_ (with confirmation) · force push blocked for safety

**Navigation**

- _"open file server.ts"_ — fuzzy file search
- _"go to line 42"_ · _"go to top"_ · _"go to bottom"_ · _"go to symbol"_

**Copilot CLI**

- _"ask copilot explain this error"_ · _"copilot commit"_ · _"copilot suggest how to list docker containers"_

**Copilot Chat**

- _"copilot chat explain this file"_ · _"ask copilot in chat how to fix this"_ · _"open copilot chat"_

**System**

- _"help"_ · _"open command center"_ · _"show shortcuts"_

### 🎯 Smart Matching

- **Wildcard patterns** — say _"git commit message fixed the auth bug"_ and VoiceDev extracts _"fixed the auth bug"_ as the commit message. 9 commands support dynamic argument capture.
- **Fuzzy matching** — _"format the document"_ still triggers `format-document`. No need to memorize exact phrases.
- **Confidence scoring** — if VoiceDev isn't confident enough in a command match, it falls back to dictation instead of guessing wrong.

### 📝 Voice Dictation

When your speech doesn't match a command, VoiceDev inserts it as text — into the active editor at your cursor, or into the terminal if one is focused.

### 🔒 Privacy-First Provider Choice

Your voice, your rules. Choose between fast cloud transcription or fully offline local mode:

| Provider              | Speed        | Cost         | Privacy          | Setup                   |
| --------------------- | ------------ | ------------ | ---------------- | ----------------------- |
| **Groq** (default)    | ⚡ Very Fast | 🆓 Free tier | ☁️ Cloud         | API key only            |
| **Voxtral (Mistral)** | ⚡ Very Fast | 🆓 Free tier | ☁️ Cloud         | API key only            |
| **Local**             | 🐌 Slower    | 🆓 Zero cost | 🔒 Fully offline | One-time setup (~2 min) |
| **OpenAI**            | 🐢 Medium    | 💰 Paid      | ☁️ Cloud         | API key only            |

Local mode runs via faster-whisper — your voice never leaves your machine. No API keys, no cloud, no limits.

### 🔊 Audio & Visual Feedback

- Start/stop chimes so you know when VoiceDev is listening
- Status bar shows recording timer, transcription spinner, and provider name
- Toast notifications for command execution, errors, and results
- Command Center webview for browsing all available commands

## Roadmap

VoiceDev is in active development. Here's where we are and where we're heading.

### 🟢 Now (v0.1.0-preview)

- ✅ 30+ voice commands — editor, git, navigation, Copilot CLI, and Copilot Chat
- ✅ Multi-provider speech-to-text (Groq, Mistral Voxtral, OpenAI, Local)
- ✅ Privacy-first offline mode via faster-whisper
- ✅ Fuzzy matching and wildcard pattern extraction
- ✅ Audio feedback and status bar integration

### 🔵 Next

- Workflow chaining — compose multi-step voice sequences (diff + stage + commit + push)
- Custom voice commands and reusable snippets
- AI-powered developer workflows (inline completion, coding assists)
- Real-time translation from multiple languages into English
- More VS Code-native actions by voice (search extensions, update settings, open projects)

### 🟣 Exploring

- Voice-based web search with responses inside the IDE
- Multi-IDE expansion (Open VSX, Zed, and beyond)
- Conversational mode — multi-turn voice interactions
- Developer dictionary — learn your codebase vocabulary
- Full cross-platform production release

> 📖 See [VISION.md](VISION.md) for the full philosophy and detailed roadmap

## Requirements

- VS Code 1.85.0 or higher
- Microphone for voice input

### Cloud Providers (Default)

- **Groq API key** (free at [console.groq.com](https://console.groq.com)) - for fast cloud speech-to-text
- **OpenRouter API key** (optional) - for AI-powered commit messages

### Local Provider (Privacy-First Option)

- **Python 3.9-3.12** - must be in PATH
- **ffmpeg** - must be in PATH ([download here](https://ffmpeg.org/download.html))
- **Disk space**: ~150MB for model download (one-time)
- **RAM**: 4GB minimum, 8GB+ recommended

**Why choose local?** Your voice never leaves your machine. Zero API costs, unlimited usage, works offline.

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install the `.vsix` file manually

## Quick Start

### Option A: Groq (Fast & Free - Recommended for Getting Started)

1. Get a free API key from [console.groq.com](https://console.groq.com)
2. Open Command Palette (`Cmd/Ctrl + Shift + P`)
3. Run `VoiceDev: Set API Key`, select "Groq", and paste your key
4. Press `Ctrl+Shift+V` to start recording
5. Speak a command like "save all" or dictate text

### Option B: Mistral (Fast & Free - Voxtral powered)

1. Get a free API key from [console.mistral.ai](https://console.mistral.ai)
2. Open VS Code Settings (`Cmd/Ctrl + ,`)
3. Search for "voicedev.stt.provider" and select "mistral"
4. Open Command Palette and run `VoiceDev: Set API Key`, select "Mistral"
5. Press `Ctrl+Shift+V` to start recording
6. Speak a command or dictate text

### Option C: Local (Private & Offline - Zero Cost)

1. Install Python 3.9-3.12 and ffmpeg (if not already installed)
2. Open VS Code Settings (`Cmd/Ctrl + ,`)
3. Search for "voicedev.stt.provider"
4. Select "local" from the dropdown
5. Press `Ctrl+Shift+V` to start recording (first run will setup environment ~2 min)
6. Your voice stays on your machine - no API keys, no cloud, no limits

## Configuration

Customize VoiceDev through your VS Code settings. Add these configurations to your `settings.json`:

### Basic Configuration

```json
{
	"voicedev.stt.provider": "groq",
	"voicedev.llm.provider": "openrouter",
	"voicedev.llm.model": "anthropic/claude-3-haiku-20240307",
	"voicedev.audio.feedbackSounds": true
}
```

### Configuration Options

| Setting                         | Description                   | Values                                       | Default                               |
| ------------------------------- | ----------------------------- | -------------------------------------------- | ------------------------------------- |
| `voicedev.stt.provider`         | Speech-to-text provider       | `"groq"`, `"mistral"`, `"openai"`, `"local"` | `"groq"`                              |
| `voicedev.llm.provider`         | AI model provider             | `"openrouter"`, `"openai"`                   | `"openrouter"`                        |
| `voicedev.llm.model`            | AI model for commit messages  | Model identifier string                      | `"anthropic/claude-3-haiku-20240307"` |
| `voicedev.audio.feedbackSounds` | Enable/disable audio feedback | `true`, `false`                              | `true`                                |

### How to Apply Configuration

1. Open VS Code Settings:
    - **Windows/Linux**: `Ctrl + ,`
    - **macOS**: `Cmd + ,`

2. Click the "Open Settings (JSON)" icon in the top-right corner

3. Add or modify the VoiceDev configuration section

4. Save the file - changes take effect immediately

### Provider-Specific Settings

#### Groq Provider

```json
{
	"voicedev.stt.provider": "groq"
}
```

**Note**: Use `VoiceDev: Set API Key` command to securely store your Groq API key.

#### Mistral Provider

```json
{
	"voicedev.stt.provider": "mistral"
}
```

**Note**: Use `VoiceDev: Set API Key` command to securely store your Mistral API key. Powered by Mistral's Voxtral-mini model for fast, accurate transcription.

#### Local Provider

```json
{
	"voicedev.stt.provider": "local",
	"voicedev.stt.local.pythonPath": "path-to-python-executable"
}
```

#### OpenAI Provider

```json
{
	"voicedev.stt.provider": "openai"
}
```

**Note**: Use `VoiceDev: Set API Key` command to securely store your OpenAI API key. The OpenAI provider integration is planned for a future release.

## For Developers

Interested in contributing to VoiceDev? Check out our [QUICKSTART.md](QUICKSTART.md) guide for detailed setup instructions, development workflow, and information about working with the local/offline speech-to-text provider.

**Quick links:**

- 📖 [Contribution Guidelines](CONTRIBUTING.md)
- 🐞 [Report Issues](https://github.com/mohitSharma74/voicedev/issues)
- 💬 [Discussions](https://github.com/mohitSharma74/voicedev/discussions)

### Reporting Issues

We welcome bug reports and feature requests from both technical contributors and non-technical users! When creating a new issue, you'll be guided through our structured templates:

- **🐛 Bug Report**: For reporting bugs and unexpected behavior
- **🚀 Feature Request**: For suggesting new features and improvements
- **💬 General Issue**: For questions, discussions, or other topics

**Tips for effective issue reporting:**

- Search existing issues before creating a new one
- Provide clear, step-by-step reproduction instructions for bugs
- Include version information (VoiceDev, VS Code, OS)
- Add screenshots or recordings when helpful
- Be specific about expected vs actual behavior

Our templates include sections for both non-technical users (basic information) and technical contributors (detailed logs, technical insights).

## Troubleshooting

### Local Provider Issues

**"Python 3.9+ is required to use Local STT"**

- Ensure Python 3.9-3.12 is installed and in your system PATH
- Run `python --version` in terminal to verify

**"ffmpeg not found in PATH"**

- Install ffmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
- On Windows: `choco install ffmpeg` (with Chocolatey)
- On macOS: `brew install ffmpeg`
- Verify with `ffmpeg -version`

**"Setup failed" or timeout during first run**

- Check your internet connection (downloads ~150MB model)
- Run `VoiceDev: Clear API Key` and try again
- Ensure enough disk space (~200MB total)

### Cloud Provider Issues

**"Invalid API key" or transcription fails**

- Verify your API key at [console.groq.com](https://console.groq.com)
- Run `VoiceDev: Set API Key` to update
- Check your internet connection

## Known Limitations

### Local Provider

- **Performance**: ~3-5x slower than cloud providers (runs on CPU)
- **First run**: One-time setup takes ~2 minutes + ~150MB download
- **Best for**: Short commands and dictation (under 30 seconds)
- **Accuracy**: Slightly lower with CPU int8 quantization vs full GPU models
- **Platform**: Windows fully supported; macOS/Linux support in progress

### All Providers

- Maximum recording length: 30 seconds (auto-stop)
- Requires clear audio input for best accuracy
- Background noise may affect transcription quality

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

BSD 3-Clause License - See [LICENSE](LICENSE) file for details.

---

**Voice-native development** — read the [vision](VISION.md) 🎙️
