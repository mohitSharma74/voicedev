# VoiceDev - AI Agent Development Guide

## Project Overview

**VoiceDev** is a VS Code extension for voice-activated development workflows. It enables voice control for commands, git operations, and GitHub Copilot CLI integration.

**Status**: v0.1.0-preview (GitHub Copilot CLI Challenge submission)

**Competition Focus**: Voice-controlled GitHub Copilot CLI commands are the headline feature.

## Current Implementation

### Working Features

- **Voice Recording**: Real-time audio capture via PvRecorder (16kHz mono, 30s auto-stop)
- **Transcription**: Groq Whisper integration (whisper-large-v3-turbo)
- **Command System**: Registry with Fuse.js fuzzy matching
- **Text Insertion**: Smart insertion into active editor or terminal
- **Status Bar UI**: Recording timer, transcribing spinner, idle state
- **Audio Feedback**: Cross-platform start/stop chimes

### Registered Voice Commands

| Command         | Triggers                         | Action                      |
| --------------- | -------------------------------- | --------------------------- |
| save-all        | "save all", "save everything"    | Saves all open files        |
| format-document | "format document", "format file" | Formats current document    |
| new-terminal    | "new terminal", "open terminal"  | Opens integrated terminal   |
| git-status      | "git status", "show git"         | Opens Source Control view   |
| close-editor    | "close editor", "close file"     | Closes active editor        |
| list-commands   | "list commands", "show commands" | Shows voice commands picker |

### In Progress (Phase 2.2+)

- **Copilot CLI Integration**: `ask copilot explain *`, `ask copilot write commit message`
- **Terminal Commands**: `git pull`, `git push`, `git commit message *`
- **Pattern Matching**: Wildcard `*` extraction for command arguments

## Architecture

### Data Flow

```
Voice Input (mic)
  ↓ PvRecorder (16kHz mono)
Audio Buffer (PCM)
  ↓ WavEncoder
WAV File
  ↓ GroqProvider.transcribe()
Transcribed Text
  ↓ CommandParser (Fuse.js fuzzy match)
ParsedResult { type: "command" | "text", command?, confidence }
  ↓ CommandExecutor or TextInsertion
Action Executed
```

### Key Files

| File                                     | Purpose                                |
| ---------------------------------------- | -------------------------------------- |
| `src/extension.ts`                       | Main entry point, command registration |
| `src/commands/registry.ts`               | Singleton command registry             |
| `src/commands/types.ts`                  | VoiceCommand, ParsedResult interfaces  |
| `src/services/recorder.ts`               | PvRecorder audio capture               |
| `src/services/transcriptionService.ts`   | STT provider orchestration             |
| `src/services/providers/groqProvider.ts` | Groq Whisper implementation            |
| `src/services/commandParser.ts`          | Fuse.js fuzzy matching                 |
| `src/services/commandExecutor.ts`        | Command execution with notifications   |
| `src/ui/statusBar.ts`                    | Status bar state management            |
| `src/utils/textInsertion.ts`             | Smart text insertion (editor/terminal) |

### Upcoming Files (Phase 2.2)

| File                               | Purpose                        |
| ---------------------------------- | ------------------------------ |
| `src/services/terminalHelper.ts`   | Terminal command execution     |
| `src/services/copilotDetection.ts` | Copilot CLI availability check |
| `src/commands/copilotCommands.ts`  | Copilot voice commands         |
| `src/commands/shellCommands.ts`    | Git/shell voice commands       |
| `src/commands/patternMatcher.ts`   | Wildcard pattern matching      |

## Configuration (package.json)

```typescript
// User settings:
"voicedev.stt.provider": "groq" | "openai" | "local"
"voicedev.llm.provider": "openrouter" | "groq" | "openai"
"voicedev.llm.model": "anthropic/claude-3-haiku-20240307"
"voicedev.audio.feedbackSounds": true | false
```

## VS Code Commands

| Command                    | Keybinding   | Description             |
| -------------------------- | ------------ | ----------------------- |
| `voicedev.startRecording`  | Ctrl+Shift+V | Start voice recording   |
| `voicedev.stopRecording`   | Ctrl+Shift+V | Stop and transcribe     |
| `voicedev.toggleRecording` | -            | Toggle recording state  |
| `voicedev.saveRecording`   | -            | Save recording as WAV   |
| `voicedev.setApiKey`       | -            | Set Groq API key        |
| `voicedev.clearApiKey`     | -            | Clear API key           |
| `voicedev.listCommands`    | -            | List all voice commands |

## Development Workflow

```bash
npm run watch      # Continuous compilation
npm run compile    # One-time build
npm run lint       # ESLint check
npm run test       # Run tests
F5                 # Launch Extension Development Host
```

## Code Patterns

### Command Registration

Commands use a registry pattern with fuzzy matching:

```typescript
const command: VoiceCommand = {
	id: "save-all",
	triggers: ["save all", "save everything", "save all files"],
	description: "Save all open files",
	execute: async () => vscode.commands.executeCommand("workbench.action.files.saveAll"),
	category: "editor",
};
CommandRegistry.getInstance().register(command);
```

### Provider Pattern

STT uses interface-based providers:

```typescript
interface ITranscriptionProvider {
	transcribe(audioBuffer: Buffer): Promise<string>;
	validateApiKey(): Promise<boolean>;
	getName(): string;
	dispose(): void;
}
```

### Secure Storage

API keys stored via VS Code SecretStorage:

```typescript
const storage = SecretStorageHelper.getInstance(context);
await storage.storeApiKey("groq", apiKey);
const key = await storage.getApiKey("groq");
```

## Competition Context

**GitHub Copilot CLI Challenge**: VoiceDev's headline feature is voice-controlled Copilot CLI commands:

- "Ask copilot explain this error"
- "Ask copilot write commit message"
- "Ask copilot explain file"

**Demo Workflow**:

1. Introduce a bug → 2. "Save all" → 3. "Git status" → 4. "Ask copilot explain this error" → 5. Apply fix → 6. "Ask copilot write commit message" → 7. "Git push"

## Key References

- Entry point: [src/extension.ts](../src/extension.ts)
- Manifest: [package.json](../package.json)
- Roadmap: [project-plan.md](../project-plan.md)
- Submission plan: See `voice_dev_v_1_submission_plan.md`
