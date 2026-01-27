# VoiceDev - VS Code Extension Project Plan

**Timeline**: 3 weeks (Jan 25 - Feb 15, 2026)  
**Competition**: GitHub Copilot CLI Challenge  
**Target**: Solo developers & productivity enthusiasts  
**Version**: v0.1.0-preview (Public Preview)  
**Status**: Planning Phase  
**Dev Machines**: Windows (primary) + macOS (secondary)

---

## 🎯 Project Overview

### What is VoiceDev?

VoiceDev is a VS Code extension that brings voice control to your development workflow. Instead of typing repetitive commands, git commits, or common code patterns, developers can simply speak them. Built with accessibility, productivity, and developer experience in mind.

### Why VoiceDev?

**Problem**: Developers spend significant time on repetitive tasks:

- Writing git commit messages
- Adding console.log statements for debugging
- Formatting documents
- Inserting common code patterns
- Context switching between keyboard and mouse

**Solution**: Voice-activated commands that execute instantly in VS Code, reducing cognitive load and physical strain.

### Target Users

1. **Solo Developers** - Working on personal/side projects who want to speed up repetitive tasks
2. **Productivity Enthusiasts** - Developers optimizing their workflow and exploring new tools
3. **Future**: Developers with RSI, accessibility needs, or those who prefer voice input

### Multi-Provider Architecture (v0.1.0-preview Feature)

VoiceDev supports multiple AI providers to give users flexibility in cost, speed, and privacy:

#### Speech-to-Text Providers

| Provider           | Speed        | Cost          | Offline | Privacy    | Default   |
| ------------------ | ------------ | ------------- | ------- | ---------- | --------- |
| **Groq Whisper**   | ⚡ Very Fast | 🆓 Free       | ❌      | ☁️ Cloud   | ✅ YES    |
| **OpenAI Whisper** | 🐢 Medium    | 💰 $0.006/min | ❌      | ☁️ Cloud   | ❌        |
| **Local Whisper**  | 🐌 Slower    | 🆓 Free       | ✅ Yes  | 🔒 Private | ✅ v0.1.0 |

**Why Groq as Default?**

- FREE tier with generous limits
- 10x faster than OpenAI
- Same Whisper model quality
- Fastest onboarding (API key only)
- Perfect for quick testing and getting started

**Local Provider (Privacy-First):**

- ✅ Available in v0.1.0 (fully implemented)
- 🔒 Your voice never leaves your machine
- 🆓 Zero API costs, unlimited usage
- ✅ Works completely offline
- One-time setup (~2 min) required

#### LLM Providers (Commit Messages)

| Provider       | Models Available | Cost            | Default |
| -------------- | ---------------- | --------------- | ------- |
| **OpenRouter** | 100+ models      | Varies          | ✅ YES  |
| **Groq**       | Llama 3, Mixtral | 🆓 Free         | ❌      |
| **OpenAI**     | GPT-4o-mini      | $0.15/1M tokens | ❌      |

**Why OpenRouter as Default?**

- Access to Claude, GPT, Llama, etc.
- Single API key for all models
- Cost-effective model selection
- User can switch models easily

#### Configuration Example

```typescript
// User settings.json
{
  "voicedev.stt.provider": "groq",           // groq | openai | local
  "voicedev.stt.apiKey": "gsk_...",          // Groq API key
  "voicedev.llm.provider": "openrouter",     // openrouter | groq | openai
  "voicedev.llm.apiKey": "sk-or-...",        // OpenRouter API key
  "voicedev.llm.model": "anthropic/claude-3-haiku-20240307"
}
```

---

## ✨ Features - v0.1.0 (Competition Release)

### Core Features (Must-Have)

#### 1. Voice-Activated Commands (Priority 1)

Execute common VS Code actions via voice:

```
"console log" → Inserts console.log() at cursor
"save all" → Saves all open files
"format document" → Runs VS Code formatter
"add comment" → Adds language-appropriate comment
"new terminal" → Opens new integrated terminal
"run task" → Shows task picker
"git status" → Shows git status in terminal
```

**Total Commands**: 10-15 carefully chosen, high-frequency actions

#### 2. Voice-to-Git Commits (Priority 1)

Generate professional git commit messages via voice:

```
User speaks: "fixed the bug in the authentication service"
VoiceDev suggests: "fix: resolve authentication service bug"

User speaks: "added user profile page with settings"
VoiceDev suggests: "feat: add user profile page with settings"
```

**Features**:

- Follows Conventional Commits format
- Analyzes current git diff for context
- Shows preview before committing
- Supports multi-line commit messages

#### 3. Quick Voice Dictation (Priority 2)

Insert text at cursor position:

- Hotkey activation (Ctrl/Cmd + Shift + V)
- Record → Transcribe → Insert
- Works in any file type
- Visual feedback during recording

#### 4. Status Bar Integration (Priority 2)

- Shows recording state (🎤 Recording... / ⏸️ Ready)
- Quick access to start/stop recording
- Click to open command palette
- Visual feedback for errors

#### 5. Settings & Configuration (Priority 3)

- OpenAI API key configuration
- Custom keyboard shortcuts
- Enable/disable specific commands
- Choose commit message style (conventional/simple)
- Whisper model selection (whisper-1)

### Nice-to-Have (If Time Permits)

- **Command history** - Recent voice commands list
- **Custom commands** - User-defined voice → action mappings
- **Multi-language support** - Dictation in languages other than English
- **Voice feedback** - Audio confirmation of actions

### Explicitly NOT in v0.1.0

- Code generation from voice
- Context-aware code completion
- Learning from codebase (developer dictionary)
- Offline Whisper support
- Multi-file operations
- Complex refactoring commands

---

## 📅 3-Week Development Plan

### Week 1: Foundation & Core Infrastructure (Jan 25 - Jan 31)

**Goal**: Working voice input → command execution pipeline

#### Phase 1.1: Extension Setup (Days 1-2)

- [x] Initialize VS Code extension project
- [x] Set up TypeScript configuration
- [x] Create basic extension structure
- [x] Implement activation events
- [x] Set up development environment
- [x] Configure debugging

**Deliverables**:

- Extension scaffold with "Hello World" command
- Development environment ready
- Git repository initialized

#### Phase 1.2: Audio Recording (Days 3-4)

- [ ] Implement microphone access
- [ ] Record audio to buffer
- [ ] Handle recording start/stop
- [ ] Add recording status indicators
- [ ] Handle errors (no mic, permissions)

**Deliverables**:

- Can record audio via keyboard shortcut
- Visual feedback during recording
- Error handling for edge cases

#### Phase 1.3: Whisper Integration (Days 5-6)

- [ ] OpenAI API client setup
- [ ] Audio → Whisper API transcription
- [ ] Handle API responses
- [ ] Error handling (rate limits, network)
- [ ] Add loading indicators

**Deliverables**:

- Voice → text transcription working
- API key configuration in settings
- Robust error handling

#### Phase 1.4: Text Insertion (Day 7)

- [ ] Insert transcribed text at cursor
- [ ] Handle multi-line text
- [ ] Preserve cursor position
- [ ] Test across file types

**Deliverables**:

- Basic voice dictation working end-to-end
- Week 1 milestone: "Can dictate text into editor"

---

### Week 2: Copilot CLI & Git Integration (Feb 1 - Feb 7)

**Goal**: Copilot CLI voice commands + git workflow via voice

#### Phase 2.1: Command System (Days 8-9) ✅ COMPLETED

- [x] Design command registry architecture
- [x] Implement command parser (voice → intent)
- [x] Create command executor
- [x] Add fuzzy matching for commands
- [x] Test command recognition accuracy

**Deliverables**:

- Voice → command mapping system ✅
- 5 basic commands implemented:
    - "save all" ✅
    - "format document" ✅
    - "new terminal" ✅
    - "git status" ✅
    - "close editor" ✅

#### Phase 2.2: Copilot CLI Integration (Days 10-11) ⭐ COMPETITION CRITICAL

- [ ] Implement terminal helper (`ctx.terminal.run()`)
- [ ] Implement Copilot CLI detection (`copilot --version`)
- [ ] Add Copilot availability guard + error UX with install link
- [ ] Add wildcard pattern matching (`*` extraction for args)
- [ ] Create `CopilotExecutors`:
    - "ask copilot explain \*" → `copilot explain "<text>"`
    - "ask copilot explain file" → `copilot explain "<filepath>"`
    - "ask copilot write commit message" → `copilot commit`

**Deliverables**:

- Copilot CLI commands working via voice
- Pattern matching with wildcard args
- Graceful fallback when Copilot CLI not installed

#### Phase 2.3: Git & Shell Commands (Days 12-13)

- [ ] Create `ShellExecutors` for terminal commands:
    - "git status" → runs `git status` in terminal
    - "git pull" → runs `git pull` in terminal
    - "git push" → runs `git push` in terminal
    - "git commit" → runs `git commit` (opens editor)
    - "git commit message \*" → runs `git commit -m "<message>"`
- [ ] Add editor navigation commands:
    - "open file \*" → opens file by name
    - "go to line \*" → navigates to line number
- [ ] Update existing commands to use new executor signature with `ExecutionContext`

**Deliverables**:

- Full git workflow via voice (status → commit → push)
- Shell commands run directly in integrated terminal
- Pattern-based arg extraction working

#### Phase 2.4: Settings & Polish (Day 14)

- [ ] Copilot CLI detection on extension activation
- [ ] Settings for Copilot CLI path (if non-standard install)
- [ ] API key secure storage (existing - verify working)
- [ ] Command enable/disable toggles
- [ ] Test full demo workflow end-to-end

**Deliverables**:

- Week 2 milestone: "Can execute Copilot CLI commands via voice"
- Demo workflow working: Save → Git status → Copilot explain → Copilot commit → Git push

---

### Week 3: Polish, Testing & Competition Submission (Feb 8 - Feb 15)

**Goal**: Production-ready extension + competition submission

#### Phase 3.1: UI/UX Polish (Days 15-16)

- [ ] Professional status bar icon
- [ ] Toast notifications for actions
- [ ] Loading states and spinners
- [ ] Error messages (user-friendly)
- [ ] Keyboard shortcut hints
- [ ] Welcome/onboarding message

**Deliverables**:

- Professional look and feel
- Consistent visual feedback
- Delightful micro-interactions

#### Phase 3.2: Testing & Bug Fixes (Days 17-18)

- [ ] Unit tests for core functions
- [ ] Integration tests for commands
- [ ] Manual testing across scenarios
- [ ] Fix critical bugs
- [ ] Performance optimization
- [ ] Handle edge cases

**Deliverables**:

- Test coverage >60%
- No critical bugs
- Smooth user experience

#### Phase 3.3: Documentation & Demo (Days 19-20)

- [ ] README with clear installation steps (including Copilot CLI setup)
- [ ] Demo GIFs showing Copilot CLI voice commands
- [ ] 2-minute video walkthrough featuring demo workflow:
    1. Introduce a bug
    2. "Save all"
    3. "Git status"
    4. "Ask copilot explain this error"
    5. "Ask copilot suggest fix"
    6. Apply fix
    7. "Ask copilot write commit message"
    8. "Git push"
- [ ] CHANGELOG.md
- [ ] Prerequisites section: Copilot CLI installation + authentication

**Deliverables**:

- Professional documentation highlighting Copilot CLI integration
- High-quality demo showing full dev loop driven by voice
- Clear value proposition: "Not just dictation—real Copilot CLI workflows"

#### Phase 3.4: Publication & Submission (Day 21 - Feb 15)

- [ ] Package extension (.vsix)
- [ ] Publish to VS Code Marketplace
- [ ] Create GitHub release (v0.1.0-preview)
- [ ] Write DEV.to competition article highlighting:
    - Voice-controlled GitHub Copilot CLI (headline feature)
    - Voice-driven Git workflow
    - Real editor control (not just dictation)
    - Multi-provider speech engine
    - Accessibility angle
- [ ] Include competition-specific content:
    - Copilot CLI command examples with screenshots
    - Demo workflow video/GIF
    - Future roadmap (AI intent routing, conversational mode)
- [ ] Submit to GitHub Copilot CLI Challenge

**Deliverables**:

- ✅ Extension live on marketplace
- ✅ Competition submission complete with Copilot CLI focus
- ✅ Blog post published emphasizing "judge bait" features
- Week 3 milestone: "Shipped & submitted!"

---

## 🏗️ Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│           VS Code Extension Host            │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │     VoiceDev Extension              │  │
│  │                                     │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Extension Activation       │  │  │
│  │  │   - Register Commands        │  │  │
│  │  │   - Setup Status Bar         │  │  │
│  │  │   - Load Configuration       │  │  │
│  │  └──────────────────────────────┘  │  │
│  │              │                      │  │
│  │              ▼                      │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Voice Recording Module     │  │  │
│  │  │   - Microphone Access        │  │  │
│  │  │   - Audio Buffer Management  │  │  │
│  │  │   - Recording Controls       │  │  │
│  │  └──────────────────────────────┘  │  │
│  │              │                      │  │
│  │              ▼                      │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Transcription Service      │  │  │
│  │  │   - OpenAI Whisper API       │  │  │
│  │  │   - Audio Format Conversion  │  │  │
│  │  │   - Error Handling           │  │  │
│  │  └──────────────────────────────┘  │  │
│  │              │                      │  │
│  │              ▼                      │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Command Parser             │  │  │
│  │  │   - Intent Recognition       │  │  │
│  │  │   - Fuzzy Matching           │  │  │
│  │  │   - Command Routing          │  │  │
│  │  └──────────────────────────────┘  │  │
│  │         │                │          │  │
│  │         ▼                ▼          │  │
│  │  ┌──────────┐    ┌──────────────┐  │  │
│  │  │Text Mode │    │Command Mode  │  │  │
│  │  │          │    │              │  │  │
│  │  │Insert at │    │Execute       │  │  │
│  │  │cursor    │    │VS Code API   │  │  │
│  │  └──────────┘    └──────────────┘  │  │
│  │                          │          │  │
│  │                          ▼          │  │
│  │              ┌──────────────────┐   │  │
│  │              │ Git Integration  │   │  │
│  │              │ - Diff Analysis  │   │  │
│  │              │ - Commit Gen     │   │  │
│  │              │ - Commit Execute │   │  │
│  │              └──────────────────┘   │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
    ┌──────────────┐    ┌──────────────┐
    │  OpenAI API  │    │  Git CLI     │
    │  (Whisper)   │    │  Commands    │
    └──────────────┘    └──────────────┘
```

### Module Breakdown

#### 1. Extension Core (`src/extension.ts`)

**Responsibilities**:

- Extension lifecycle (activate/deactivate)
- Register all commands
- Initialize services
- Set up status bar
- Handle global state

**Key Functions**:

```typescript
export function activate(context: vscode.ExtensionContext);
export function deactivate();
```

#### 2. Voice Recording Module (`src/services/recorder.ts`)

**Responsibilities**:

- Manage microphone access
- Record audio to buffer
- Start/stop recording controls
- Handle permissions

**Key Classes**:

```typescript
class VoiceRecorder {
	startRecording(): Promise<void>;
	stopRecording(): Promise<Buffer>;
	isRecording(): boolean;
}
```

#### 3. Transcription Service (`src/services/transcription.ts`)

**Responsibilities**:

- Abstract provider selection
- Call appropriate STT API (Groq/OpenAI/Local)
- Convert audio format if needed
- Handle API errors
- Manage rate limiting

**Key Classes**:

```typescript
interface ITranscriptionProvider {
	transcribe(audioBuffer: Buffer): Promise<string>;
	validateApiKey(): boolean;
	getName(): string;
}

class GroqTranscriptionProvider implements ITranscriptionProvider {
	// Fast, free tier, default choice
}

class OpenAITranscriptionProvider implements ITranscriptionProvider {
	// Reliable fallback
}

class TranscriptionService {
	private provider: ITranscriptionProvider;

	constructor(providerType: "groq" | "openai" | "local") {
		this.provider = this.createProvider(providerType);
	}

	transcribe(audioBuffer: Buffer): Promise<string> {
		return this.provider.transcribe(audioBuffer);
	}
}
```

#### 3b. LLM Service (`src/services/llmService.ts`)

**Responsibilities**:

- Abstract LLM provider selection
- Generate commit messages
- Handle different model APIs
- Unified interface for all providers

**Key Classes**:

```typescript
interface ILLMProvider {
	generateCommitMessage(diff: string, userInput: string): Promise<string>;
	validateApiKey(): boolean;
	getName(): string;
}

class OpenRouterProvider implements ILLMProvider {
	// Default: Access to 100+ models
}

class GroqLLMProvider implements ILLMProvider {
	// Free tier Llama/Mixtral
}

class LLMService {
	private provider: ILLMProvider;

	async generateCommitMessage(diff: string, userInput: string): Promise<string> {
		return this.provider.generateCommitMessage(diff, userInput);
	}
}
```

#### 4. Command Parser (`src/services/commandParser.ts`)

**Responsibilities**:

- Determine intent (text vs command)
- Match voice input to commands
- Fuzzy matching for typos
- Extract command parameters

**Key Classes**:

```typescript
class CommandParser {
	parse(text: string): ParsedCommand;
	isCommand(text: string): boolean;
	findBestMatch(text: string): Command | null;
}

interface ParsedCommand {
	type: "text" | "command";
	intent?: string;
	parameters?: any;
	confidence: number;
}
```

#### 5. Command Registry (`src/commands/registry.ts`)

**Responsibilities**:

- Store available commands
- Register command handlers
- Execute commands
- Provide command list

**Key Classes**:

```typescript
class CommandRegistry {
	register(command: VoiceCommand): void;
	execute(intent: string, params?: any): Promise<void>;
	listCommands(): VoiceCommand[];
}

interface VoiceCommand {
	triggers: string[]; // ["console log", "add console"]
	description: string;
	execute: (params?: any) => Promise<void>;
	category: "editor" | "git" | "terminal" | "debug";
}
```

#### 6. Git Integration (`src/services/gitService.ts`)

**Responsibilities**:

- Get current git diff
- Generate commit messages
- Execute git commits
- Validate git state

**Key Classes**:

```typescript
class GitService {
	getDiff(): Promise<string>;
	generateCommitMessage(diff: string, userInput: string): Promise<string>;
	commit(message: string): Promise<void>;
	isGitRepository(): boolean;
}
```

#### 7. UI Components (`src/ui/`)

**Responsibilities**:

- Status bar widget
- Toast notifications
- Input prompts
- Webview for settings

**Key Classes**:

```typescript
class StatusBarManager {
	updateStatus(state: "idle" | "recording" | "processing");
	showError(message: string);
	showSuccess(message: string);
}
```

---

## 🛠️ Tech Stack

### Core Technologies

#### Extension Framework

```json
{
	"name": "voicedev",
	"displayName": "VoiceDev",
	"publisher": "yourusername",
	"version": "0.1.0",
	"engines": {
		"vscode": "^1.85.0"
	}
}
```

**VS Code Extension API**

- Version: Latest stable (1.85+)
- Language: TypeScript 5.3+
- Build: esbuild for fast bundling

#### Language & Runtime

- **TypeScript 5.3+**: Type-safe development
- **Node.js 18+**: Runtime environment
- **npm/pnpm**: Package management

### Key Dependencies

#### Audio Recording

```json
{
	"node-record-lpcm16": "^1.0.1" // Cross-platform audio recording
}
```

**Alternatives if issues arise**:

- `sox-audio` - More reliable but requires system dependency
- `node-microphone` - Lighter weight
- `recorder` - Simpler API

#### OpenAI Integration

```json
{
	"openai": "^4.20.0" // Official OpenAI SDK (optional provider)
}
```

#### Multi-Provider SDKs

```json
{
	"groq-sdk": "^0.3.0", // Groq for fast Whisper + Llama
	"@openrouter/ai": "^1.0.0", // OpenRouter for multi-model access
	"anthropic": "^0.20.0" // Claude SDK (via OpenRouter)
}
```

**What we'll use**:

- **Groq**: `groq.audio.transcriptions.create()` - Fast Whisper (DEFAULT)
- **OpenRouter**: `openrouter.chat.completions.create()` - Commit messages (DEFAULT)
- **OpenAI**: Fallback option for both STT and LLM

#### VS Code APIs

```typescript
// Built-in, no installation needed
import * as vscode from "vscode";

// Key APIs we'll use:
-vscode.window.createStatusBarItem() -
	vscode.workspace.getConfiguration() -
	vscode.commands.registerCommand() -
	vscode.window.activeTextEditor -
	vscode.workspace.fs;
```

#### Git Integration

```json
{
	"simple-git": "^3.20.0" // Git operations
}
```

**What we'll use**:

- `git.diff()` - Get current changes
- `git.commit()` - Execute commits
- `git.status()` - Check git state

### Development Dependencies

```json
{
	"@types/node": "^20.0.0",
	"@types/vscode": "^1.85.0",
	"@typescript-eslint/eslint-plugin": "^6.0.0",
	"@typescript-eslint/parser": "^6.0.0",
	"esbuild": "^0.19.0",
	"eslint": "^8.0.0",
	"typescript": "^5.3.0",

	// Testing
	"@vscode/test-electron": "^2.3.0",
	"mocha": "^10.0.0",
	"chai": "^4.3.0"
}
```

### Build & Distribution

```json
{
	"@vscode/vsce": "^2.22.0" // Package and publish extensions
}
```

**Commands**:

```bash
# Development
npm run watch          # Continuous compilation
npm run compile        # One-time build

# Testing
npm run test          # Run test suite

# Publishing
vsce package          # Create .vsix file
vsce publish          # Publish to marketplace
```

### External Services

#### OpenAI API

- **Whisper API**: Speech-to-text transcription
    - Model: `whisper-1`
    - Cost: ~$0.006 per minute
    - Format: MP3, WAV, M4A (we'll use WAV)
- **GPT-4o-mini API**: Commit message generation
    - Cost: $0.15 per 1M input tokens
    - Use for: Analyzing diffs + generating messages

**API Key Storage**:

- Stored in VS Code's `SecretStorage`
- Never in plain text
- User configures via settings

#### GitHub (Optional)

- Repository hosting
- Issue tracking
- Release management
- Community engagement

---

## 📁 Project Structure

```
voicedev/
├── .vscode/
│   ├── launch.json          # Debug configuration
│   ├── tasks.json           # Build tasks
│   └── settings.json        # Workspace settings
├── src/
│   ├── extension.ts         # Main entry point
│   ├── commands/
│   │   ├── registry.ts      # Command registry
│   │   ├── editorCommands.ts    # Editor commands
│   │   ├── gitCommands.ts       # Git commands
│   │   └── terminalCommands.ts  # Terminal commands
│   ├── services/
│   │   ├── recorder.ts          # Audio recording
│   │   ├── transcription.ts     # STT orchestrator
│   │   ├── providers/
│   │   │   ├── ITranscriptionProvider.ts  # STT interface
│   │   │   ├── groqProvider.ts            # Groq Whisper (default)
│   │   │   ├── openaiProvider.ts          # OpenAI Whisper
│   │   │   ├── ILLMProvider.ts            # LLM interface
│   │   │   ├── openrouterProvider.ts      # OpenRouter (default)
│   │   │   └── groqLLMProvider.ts         # Groq Llama
│   │   ├── llmService.ts        # Commit message generation
│   │   ├── commandParser.ts     # Intent parsing
│   │   └── gitService.ts        # Git integration
│   ├── ui/
│   │   ├── statusBar.ts         # Status bar widget
│   │   ├── notifications.ts     # Toast messages
│   │   └── webviews/            # Settings UI
│   ├── utils/
│   │   ├── config.ts            # Configuration helper
│   │   ├── logger.ts            # Logging utility
│   │   └── errors.ts            # Error handling
│   └── types/
│       └── index.ts             # TypeScript types
├── test/
│   ├── suite/
│   │   ├── extension.test.ts
│   │   ├── commands.test.ts
│   │   └── services.test.ts
│   └── runTest.ts
├── media/
│   ├── icon.png                 # Extension icon
│   ├── demo.gif                 # Feature demos
│   └── screenshots/             # Documentation images
├── .eslintrc.json
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── package.json                 # Extension manifest
├── README.md
├── tsconfig.json
└── webpack.config.js            # Bundling config
```

---

## 🎯 Success Metrics

### For Competition (Feb 15)

- ✅ Extension published to marketplace
- ✅ 10-15 voice commands working
- ✅ Git commit generation functional
- ✅ Professional demo video (2 min)
- ✅ Clear Copilot CLI usage documented
- ✅ Submission article on DEV.to

### Week 1 Success

- Can record audio and transcribe to text
- Basic dictation works in VS Code

### Week 2 Success

- 10+ voice commands functional
- Git commits via voice working
- Settings configuration complete

### Week 3 Success

- Professional UI/UX
- Zero critical bugs
- Complete documentation
- Published and submitted

### Post-Competition Goals (v0.2.0+)

- 100+ installs in first month
- 4.0+ star rating
- 10+ GitHub stars
- Featured in VS Code newsletter
- 5+ community contributions

---

## 🚀 Getting Started

### Prerequisites

- VS Code 1.85.0 or higher
- Node.js 18 or higher
- Groq API key (free at console.groq.com) ⭐ DEFAULT
- OpenRouter API key (optional, for commit messages)
- GitHub Copilot subscription
- Microphone for testing
- **Windows**: sox installation (choco install sox)

### Development Setup

```bash
# 1. Create extension
npm install -g yo generator-code
yo code

# Select:
# - New Extension (TypeScript)
# - Name: voicedev
# - Identifier: voicedev
# - Description: Voice-activated commands for VS Code
# - Git: Yes
# - Package manager: npm

# 2. Install dependencies
cd voicedev
npm install openai node-record-lpcm16 simple-git

# 3. Open in VS Code
code .

# 4. Start development
npm run watch

# 5. Press F5 to debug
# Extension Development Host window will open
```

### First Commands to Implement

1. **"save all"** - Simplest, tests command execution
2. **"format document"** - Tests active editor access
3. **"console log"** - Tests text insertion
4. **Git commit** - Tests complex workflow
5. **Voice dictation** - Tests full pipeline

---

## ⚠️ Risks & Mitigation

### Technical Risks

**Risk 1: Audio recording library issues**

- **Impact**: High - Core feature broken
- **Probability**: Medium
- **Mitigation**: Have 2 backup libraries ready, test on Day 3

**Risk 2: OpenAI API rate limits**

- **Impact**: Medium - User experience degraded
- **Probability**: Low
- **Mitigation**: Implement client-side rate limiting, show clear errors

**Risk 3: Cross-platform compatibility**

- **Impact**: Medium - Limited audience
- **Probability**: Medium
- **Mitigation**: Focus on one platform first, expand later

### Timeline Risks

**Risk 4: Scope creep**

- **Impact**: High - Miss competition deadline
- **Probability**: High
- **Mitigation**: Ruthless prioritization, "nice-to-have" list for v0.2.0

**Risk 5: API key handling complexity**

- **Impact**: Low - Delayed feature
- **Probability**: Low
- **Mitigation**: Use VS Code SecretStorage, well-documented API

### Competition Risks

**Risk 6: Unclear Copilot CLI usage**

- **Impact**: High - Disqualification
- **Probability**: Low
- **Mitigation**: Document EVERY Copilot CLI usage with screenshots

---

## 📝 Notes

### Using GitHub Copilot CLI During Development

Document these interactions for competition submission:

```bash
# Scaffolding
gh copilot suggest "create VS Code extension command to insert text at cursor"

# Audio recording
gh copilot suggest "how to record audio from microphone in Node.js"

# Whisper integration
gh copilot suggest "call OpenAI Whisper API with audio buffer"

# Git operations
gh copilot suggest "get git diff of current changes in VS Code extension"

# Testing
gh copilot suggest "write unit test for command parser fuzzy matching"
```

**Keep detailed logs** of:

- What you asked Copilot CLI
- What code it generated
- How it helped solve problems
- Time saved vs manual implementation

### API Cost Estimates (v0.1.0 Development)

**Whisper API** (testing):

- ~50 recordings during development @ 30 seconds each
- 25 minutes of audio
- Cost: 25 × $0.006 = **$0.15**

**GPT-4o-mini** (commit messages):

- ~100 test commits
- ~500 tokens per request
- Cost: 100 × 500 / 1M × $0.15 = **$0.0075**

**Total development cost**: ~$0.16 (negligible)

**User cost** (monthly estimate):

- Average user: 20 commits/day, 20 voice commands/day
- 20 days/month
- Whisper: 400 commands × 10 sec = 1.1 hours = **$4**
- GPT-4o-mini: 400 commits × 500 tokens = **$0.03**

**Monthly per user**: ~$4 (reasonable for productivity tool)

### Future Expansion Ideas (Post-v0.1.0-preview)

**Why "Preview"?**

- Sets user expectations (early stage, rapid iteration)
- More forgiving for bugs and missing features
- Allows us to gather feedback before v1.0
- Shows commitment to long-term development

**Roadmap**:

- **v0.1.0-preview** (Current):
    - ✅ Local Whisper support via faster-whisper
    - ✅ Multi-provider architecture (Groq, OpenAI, Local)
    - ✅ Privacy-first offline mode
    - No API costs, full privacy
- **v0.2.0-preview**: Enhanced local features
    - Cross-platform support (macOS, Linux)
    - GPU acceleration for faster local transcription
    - Custom model fine-tuning
- **v0.3.0-preview**: Code generation from voice
    - "create a function that..."
    - "add error handling to this"
    - Context-aware code completion

- **v0.4.0-preview**: Developer dictionary (learn from codebase)
    - Extract variable names, function names
    - API endpoints from your code
    - Project-specific vocabulary

- **v0.5.0**: Custom voice commands (user-defined)
    - Create your own command mappings
    - Snippet library with voice triggers
    - Share commands with team

- **v1.0.0**: Production Release 🚀
    - All core features polished
    - Multi-language support
    - Team collaboration features
    - Extensive documentation
    - Product Hunt launch

**v1.0.0 Success Criteria**:

- 1,000+ active users
- 4.5+ star rating on marketplace
- Zero critical bugs
- 90%+ test coverage
- Featured in VS Code newsletter
- Case studies from power users

---

## 🤝 Contribution & Community

### After Competition Win

1. **Open to contributions**: Create good first issues
2. **Community feedback**: Discord/Discussions
3. **Roadmap transparency**: Public GitHub project board
4. **Blog series**: Weekly updates on Coffee, Code & AI
5. **Product Hunt launch**: v1.0.0 milestone

---

**Last Updated**: January 25, 2026  
**Next Review**: February 1, 2026 (End of Week 1)  
**Competition Deadline**: February 15, 2026, 11:59 PM PST
