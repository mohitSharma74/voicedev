# VoiceDev 🎤

**Voice-activated commands for VS Code** - speak to code, commit, and control your editor.

> ⚠️ **v0.1.0-preview** - This extension is in early development.

## Features

VoiceDev brings voice control to your development workflow:

- 🗣️ **Voice Commands** - Execute VS Code actions by speaking
- 📝 **Voice Dictation** - Insert text at cursor via voice
- 🔧 **Git Integration** - Generate commit messages from voice descriptions

### ✨ NEW: Privacy-First Offline Mode Available!

Choose your speech-to-text provider:

| Provider           | Speed        | Cost         | Privacy          | Setup                   |
| ------------------ | ------------ | ------------ | ---------------- | ----------------------- |
| **Groq** (default) | ⚡ Very Fast | 🆓 Free tier | ☁️ Cloud         | API key only            |
| **Local**          | 🐌 Slower    | 🆓 Zero cost | 🔒 Fully offline | One-time setup (~2 min) |
| **OpenAI**         | 🐢 Medium    | 💰 Paid      | ☁️ Cloud         | API key only            |

**Privacy-first option**: Local provider keeps your voice on your machine - no data sent to cloud.

### Coming in v0.1.0

- Voice-activated commands (save, format, console.log, etc.)
- Voice-to-Git commits with Conventional Commits format
- Quick voice dictation with hotkey activation
- Status bar integration with recording feedback

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
3. Run `VoiceDev: Set API Key` and paste your Groq key
4. Press `Ctrl+Shift+V` to start recording
5. Speak a command like "save all" or dictate text

### Option B: Local (Private & Offline - Zero Cost)

1. Install Python 3.9-3.12 and ffmpeg (if not already installed)
2. Open VS Code Settings (`Cmd/Ctrl + ,`)
3. Search for "voicedev.stt.provider"
4. Select "local" from the dropdown
5. Press `Ctrl+Shift+V` to start recording (first run will setup environment ~2 min)
6. Your voice stays on your machine - no API keys, no cloud, no limits

## Configuration

Configure VoiceDev in your VS Code settings:

\`\`\`json
{
"voicedev.stt.provider": "groq",
"voicedev.llm.provider": "openrouter",
"voicedev.llm.model": "anthropic/claude-3-haiku-20240307",
"voicedev.audio.feedbackSounds": true
}
\`\`\`

## Development

\`\`\`bash

# Install dependencies

npm install

# Compile

npm run compile

# Watch mode

npm run watch

# Run tests

npm run test

# Lint

npm run lint
\`\`\`

Press `F5` in VS Code to launch the Extension Development Host.

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

## Roadmap

- **v0.1.0-preview** (Current):
    - ✅ Core voice commands and git integration
    - ✅ Multi-provider support (Groq, OpenAI, Local)
    - ✅ Privacy-first offline mode with faster-whisper
- **v0.2.0**: Code generation from voice
- **v0.3.0**: Custom voice commands and snippets
- **v1.0.0**: Production release with full cross-platform support

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT

---

**Built for the GitHub Copilot CLI Challenge** 🚀
