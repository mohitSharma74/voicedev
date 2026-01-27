# VoiceDev — Local STT (faster-whisper, CPU) Implementation Plan

## 1. Objective

Add an offline, CPU-based speech-to-text engine to VoiceDev using faster-whisper.

Goals:

- Works fully offline
- One-time automatic setup
- No manual Python or pip steps for the user
- Pluggable STT backend architecture (Local / Groq / OpenAI)
- Optimized for:
    - Voice commands
    - Short dictation

## 2. Non-Goals (v1)

- No GPU / CUDA support
- No streaming microphone (file-based first)
- No bundled Python runtime
- No medium / large models
- No persistent background service

## 3. System Requirements

### User Machine

- OS: Windows (v1)
- Python: 3.9 – 3.12 available in PATH
- Disk:
    - ~50MB for venv + deps
    - ~150MB for base model (more if small model used)
- RAM:
    - Minimum: 4GB
    - Recommended: 8GB+

### External Dependency

- ffmpeg must be installed and available in PATH

### Python Dependencies (auto-installed)

- faster-whisper

## 4. Supported Models (CPU)

| Model | Use Case  | Size   | Speed     |
| ----- | --------- | ------ | --------- |
| tiny  | Commands  | ~75MB  | Very fast |
| base  | Default   | ~140MB | Fast      |
| small | Dictation | ~460MB | Slower    |

Default model: base

## 5. High Level Architecture

VoiceDev (VSCode Extension)  
→ spawns  
Local Python STT Server (server.py)  
→ uses  
faster-whisper (CPU, int8)

## 6. Communication Protocol

VoiceDev talks to the Python server using JSON over stdin/stdout.

Request:
{ "audio": "path/to/file.wav" }

Response (success):
{ "ok": true, "text": "...", "language": "en" }

Response (error):
{ "ok": false, "error": "message" }

## 7. Folder Structure

Inside extension repo:

- voicedev/
    - stt/
        - local/
            - server.py
            - requirements.txt

On user machine (runtime):

- <VSCode globalStorage>/voicedev-stt/

Contains:

- Python venv
- Installed packages

## 8. server.py Responsibilities

- Load faster-whisper once on startup
- Use CPU-only settings:
    - device = "cpu"
    - compute_type = "int8"
    - beam_size = 1
    - vad_filter = true
- Read JSON lines from stdin
- Write JSON lines to stdout
- Print READY to stdout when model is fully loaded

## 9. Bootstrapping Strategy (Inside Extension)

When user selects “Local STT” first time:

1. Check if folder exists: <VSCode globalStorage>/voicedev-stt/
2. If not:
    - Create venv: python -m venv voicedev-stt
    - Install deps: voicedev-stt\Scripts\pip install faster-whisper
3. Show progress UI:
    - “Setting up offline speech engine (one-time setup, may take 1–2 minutes)”

## 10. Starting the Server

Spawn process:
voicedev-stt\Scripts\python server.py

Wait until stdout prints:
READY

## 11. TypeScript Integration

Interface:
interface STTEngine {
transcribe(path: string): Promise<string>;
}

Implementations:

- LocalWhisperSTT
- GroqSTT
- OpenAIWhisperSTT

Selection:
VoiceDevConfig.sttEngine = "local" | "groq" | "openai";

## 12. Runtime Usage Flow

1. User presses mic hotkey
2. VoiceDev records audio → temp WAV file
3. VoiceDev calls localSTT.transcribe(wavPath)
4. Python server returns recognized text
5. VoiceDev passes text to command parser or LLM

## 13. Performance Rules (Mandatory for CPU)

- compute_type = "int8"
- beam_size = 1
- vad_filter = true

## 14. Error Handling

- If Python missing: “Python 3.9+ is required to use Local STT.”
- If ffmpeg missing: “ffmpeg not found in PATH. Please install ffmpeg to use Local STT.”
- If install fails: surface error and provide “Retry Setup”

## 15. User Settings

VSCode setting:
VoiceDev: Local STT Model

- tiny
- base (default)
- small

Implementation:

- Pass env var when spawning server: VOICEDEV_MODEL=base

## 16. Disk Locations

- Python environment: <VSCode globalStorage>/voicedev-stt/
- Model cache: ~/.cache/huggingface/hub

## 17. UX Copy

First run:
“Setting up offline speech engine (~1–2 minutes, one time). This will download ~150MB.”

Settings:
“Local STT runs fully offline but is slower than cloud models.”

## 18. Limitations

- Slower than cloud STT
- Not suitable for very long dictation
- Accuracy slightly lower than large models
- First run requires large download

## 19. Future Upgrades

- GPU / CUDA support
- Streaming microphone mode
- Auto-switch model (tiny for commands, base/small for dictation)
- Pre-bundled Python runtime
- Pre-downloaded models
- Background model warmup
- Persistent local STT service

## 20. Success Criteria

1. Fresh Windows machine
2. Install VoiceDev
3. Select “Local STT”
4. Wait for one-time setup
5. Turn off internet
6. Say: “create a new file index.ts”
7. The file is created correctly
8. No cloud API is used

## 21. Why This Matters

- Offline mode is a major differentiator
- Zero API cost
- Zero rate limits
- Works in restricted environments
- Makes VoiceDev feel like a serious engineering-grade tool
