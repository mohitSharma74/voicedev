# Quickstart Guide for Contributors

Welcome to VoiceDev! This guide will help you get started with contributing to the project, including setting up the development environment and working with the offline/local speech-to-text provider.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **VS Code** (1.85.0+)
- **Git**

For **local/offline development**, you'll also need:

- **Python** (3.9-3.12, must be in PATH)
- **ffmpeg** (must be in PATH)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/mohitSharma74/voicedev.git
cd voicedev
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile the Extension

```bash
npm run compile
```

### 4. Launch the Extension Development Host

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. A new VS Code window will open with the extension loaded

## Working with Local/Offline Speech-to-Text

### Setting Up Local Provider

1. **Install Python and ffmpeg** (if not already installed):
    - Python: Download from [python.org](https://www.python.org/downloads/)
    - ffmpeg: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

2. **Verify installations**:

    ```bash
    python --version
    ffmpeg -version
    ```

3. **Configure VoiceDev to use local provider**:
    - Open VS Code Settings (`Cmd/Ctrl + ,`)
    - Search for "voicedev.stt.provider"
    - Select "local" from the dropdown

4. **First run setup**:
    - Press `Ctrl+Shift+V` to start recording
    - The first run will automatically download the required model (~150MB)
    - This is a one-time setup that takes ~2 minutes

### Testing Local Provider

1. **Start recording**: Press `Ctrl+Shift+V` or use the command palette to run "VoiceDev: Start Recording"
2. **Speak commands**: Try basic commands like "save all", "format document", or dictate text
3. **Check transcription**: Verify that your voice input is correctly transcribed and executed

## Development Workflow

### Making Changes

1. **Create a new branch**:

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Make your changes**: Edit the relevant files in the `src/` directory

3. **Compile and test**:
    ```bash
    npm run compile
    ```
    Then press `F5` to test in the Extension Development Host

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run package
```

This will create a `.vsix` file in the project root that can be installed in VS Code.

## Common Tasks

### Adding a New Command

1. Add the command to `src/commands/registry.ts`
2. Implement the command logic in the appropriate command file
3. Add the command to the pattern matcher in `src/services/patternMatcher.ts`

### Working with Providers

- **Cloud providers**: Located in `src/services/providers/`
- **Local provider**: Implementation in `stt/local/server.py`
- **Provider interface**: `src/services/providers/ITranscriptionProvider.ts`

### Debugging

1. Use `console.log()` statements in your code
2. View logs in the Extension Development Host's debug console
3. For local provider issues, check the Python server logs

## Contributing Guidelines

1. **Follow the existing code style**: Use Prettier for formatting
2. **Write tests**: Add tests for new features in the `test/` directory
3. **Document your changes**: Update README.md or add comments as needed
4. **Submit a pull request**: Push your branch and open a PR on GitHub

## Troubleshooting

### Local Provider Issues

- **"Python 3.9+ is required"**: Ensure Python is in your PATH and version is correct
- **"ffmpeg not found"**: Install ffmpeg and add it to your PATH
- **Setup timeout**: Check your internet connection and disk space

### General Issues

- **Extension not loading**: Run `npm run compile` and restart VS Code
- **Commands not working**: Check the debug console for errors
- **Transcription failures**: Verify your API keys or local setup

## Resources

- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [VoiceDev GitHub Issues](https://github.com/mohitSharma74/voicedev/issues)

Happy coding! 🚀
