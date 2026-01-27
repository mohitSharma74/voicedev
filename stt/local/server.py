#!/usr/bin/env python3
"""
VoiceDev Local STT Server using faster-whisper

Communication Protocol:
- Reads JSON from stdin (one object per line)
- Writes JSON to stdout (one object per line)
- Prints "READY" when model is loaded

Request format:
    {"audio": "path/to/file.wav"}

Response format (success):
    {"ok": true, "text": "transcribed text", "language": "en"}

Response format (error):
    {"ok": false, "error": "error message"}
"""

import sys
import os
import json


def main():
    # Get model name from environment variable (default: base)
    model_name = os.environ.get("VOICEDEV_MODEL", "base")

    # Import faster-whisper (deferred to give better error messages)
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        error_response = {
            "ok": False,
            "error": f"Failed to import faster-whisper: {e}. Please run setup again.",
        }
        print(json.dumps(error_response), flush=True)
        sys.exit(1)

    # Load model with CPU-optimized settings
    # - device="cpu": Use CPU (no CUDA)
    # - compute_type="int8": Use int8 quantization for speed
    try:
        model = WhisperModel(
            model_name,
            device="cpu",
            compute_type="int8",
        )
    except Exception as e:
        error_response = {
            "ok": False,
            "error": f"Failed to load model '{model_name}': {e}",
        }
        print(json.dumps(error_response), flush=True)
        sys.exit(1)

    # Signal to parent process that we're ready
    print("READY", flush=True)

    # Main loop: read JSON requests from stdin
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            response = {"ok": False, "error": f"Invalid JSON: {e}"}
            print(json.dumps(response), flush=True)
            continue

        audio_path = request.get("audio")
        if not audio_path:
            response = {"ok": False, "error": "Missing 'audio' field in request"}
            print(json.dumps(response), flush=True)
            continue

        # Check if file exists
        if not os.path.isfile(audio_path):
            response = {"ok": False, "error": f"Audio file not found: {audio_path}"}
            print(json.dumps(response), flush=True)
            continue

        try:
            # Transcribe with performance-optimized settings
            # - beam_size=1: Greedy decoding (faster)
            # - vad_filter=True: Voice activity detection to skip silence
            segments, info = model.transcribe(
                audio_path,
                beam_size=1,
                vad_filter=True,
            )

            # Concatenate all segments into a single text
            text_parts = []
            for segment in segments:
                text_parts.append(segment.text.strip())

            text = " ".join(text_parts)

            # Send success response
            response = {
                "ok": True,
                "text": text,
                "language": info.language,
            }
            print(json.dumps(response), flush=True)

        except Exception as e:
            response = {"ok": False, "error": f"Transcription failed: {e}"}
            print(json.dumps(response), flush=True)


if __name__ == "__main__":
    main()
