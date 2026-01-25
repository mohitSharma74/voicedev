# VoiceDev - AI Agent Development Guide

## Project Overview

**VoiceDev** is a VS Code extension for voice-activated development workflows. It brings voice control to common tasks (commands, git commits, dictation) via multi-provider AI services (Groq, OpenAI, OpenRouter).

**Status**: v0.1.0-preview (Pre-competition release). Minimal codebase; most features are planned but not yet implemented.

## Architecture & Data Flow

### Multi-Provider Pattern

VoiceDev uses configurable AI providers for two distinct operations:

1. **Speech-to-Text (STT)**: Convert voice audio to text
    - Providers: Groq Whisper (default, free), OpenAI, Local Whisper
    - Provider selected via `voicedev.stt.provider` config

2. **Language Model (LLM)**: Generate commit messages and responses
    - Providers: OpenRouter (default), Groq, OpenAI
    - Model configured via `voicedev.llm.provider` + `voicedev.llm.model`

**Why this design?**

- Users choose best cost/speed tradeoff independently for each service
- Groq (free, fast STT) + OpenRouter (flexible LLM models) = optimal defaults
- Enables future offline Whisper support without architecture changes

### Configuration System

Settings defined in [package.json](package.json#L30-L50) under `contributes.configuration.properties`:

```typescript
// User settings (settings.json):
# VoiceDev - Copilot Instructions

## Project snapshot
- VoiceDev is a VS Code extension; the only runtime code lives in [src/extension.ts](src/extension.ts).
- Activation is lazy (first command execution); [package.json](package.json) has empty `activationEvents`.
- Current command: `voicedev.helloWorld` (registered in `activate()`), and a status bar message is shown on activation.
- Compiled output goes to out/ (referenced by `"main": "./out/extension.js"`).

## Configuration (from package.json)
These settings are defined under `contributes.configuration.properties` in [package.json](package.json):
- `voicedev.stt.provider` (defaults to `groq`)
- `voicedev.stt.apiKey`
- `voicedev.llm.provider` (defaults to `openrouter`)
- `voicedev.llm.apiKey`
- `voicedev.llm.model` (defaults to `anthropic/claude-3-haiku-20240307`)

## Development workflow
- Build/watch: `npm run watch` (default build task)
- Compile once: `npm run compile`
- Lint: `npm run lint`
- Tests: `npm run test` (test harness installed, no tests present yet)
- Debug: press F5 to launch the Extension Development Host.

## Code patterns in use
- Commands are registered via `vscode.commands.registerCommand()` and disposed via `context.subscriptions.push()`.
- Status feedback uses `vscode.window.setStatusBarMessage()` (see activation message in [src/extension.ts](src/extension.ts)).

## Key references
- Entry point: [src/extension.ts](src/extension.ts)
- Extension manifest & settings: [package.json](package.json)
- Build config: [tsconfig.json](tsconfig.json)
- Lint rules: [.eslintrc.json](.eslintrc.json)
- Roadmap/specs (non-code): [project-plan.md](project-plan.md), [project-qa-plan.md](project-qa-plan.md)

```
