# Changelog

All notable changes to the VoiceDev extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- No notable changes yet.

## [0.1.0-preview] - 2026-02-08

### Added

- Initial VoiceDev extension scaffold with startup activation and core command wiring
- Voice recording with WAV export support, status bar control, and start/stop feedback sounds
- STT provider support for Groq, OpenAI, Mistral Voxtral, and local faster-whisper
- Command system with fuzzy matching and a searchable Command Center
- Voice-assisted Git and Copilot command integrations
- Transcript insertion into editors and terminals
- Provider status indicators and configurable command disabling
- VSIX packaging and install scripts for preview builds
- Contributor-facing docs and templates, including contribution guide and issue templates

### Changed

- Recording UX and status bar behavior were refined for clearer state transitions
- Build pipeline migrated from TypeScript compile flow to esbuild bundling
- Preview mode visual feedback was improved

### Fixed

- Race condition between audio frame capture and stop-recording flow
- Build and lint issues in the esbuild and Mistral provider paths
- Documentation asset paths for VSIX packaging compatibility
