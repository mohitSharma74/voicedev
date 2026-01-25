# VoiceDev 🎤

**Voice-activated commands for VS Code** - speak to code, commit, and control your editor.

> ⚠️ **v0.1.0-preview** - This extension is in early development.

## Features

VoiceDev brings voice control to your development workflow:

- 🗣️ **Voice Commands** - Execute VS Code actions by speaking
- 📝 **Voice Dictation** - Insert text at cursor via voice
- 🔧 **Git Integration** - Generate commit messages from voice descriptions

### Coming in v0.1.0

- Voice-activated commands (save, format, console.log, etc.)
- Voice-to-Git commits with Conventional Commits format
- Quick voice dictation with hotkey activation
- Status bar integration with recording feedback

## Requirements

- VS Code 1.85.0 or higher
- Microphone for voice input
- Groq API key (free at [console.groq.com](https://console.groq.com)) - for speech-to-text
- OpenRouter API key (optional) - for AI-powered commit messages

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install the `.vsix` file manually

## Getting Started

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run `VoiceDev: Hello World` to verify the extension is working

## Configuration

Configure VoiceDev in your VS Code settings:

\`\`\`json
{
"voicedev.stt.provider": "groq",
"voicedev.llm.provider": "openrouter",
"voicedev.llm.model": "anthropic/claude-3-haiku-20240307"
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

## Roadmap

- **v0.1.0-preview**: Core voice commands and git integration
- **v0.2.0**: Local Whisper support (offline mode)
- **v0.3.0**: Code generation from voice
- **v1.0.0**: Production release

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT

---

**Built for the GitHub Copilot CLI Challenge** 🚀
