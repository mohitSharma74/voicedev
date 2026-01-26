import * as vscode from "vscode";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { featureConfig } from "@config/feature.config";
import { IVoiceRecorder } from "@services/IVoiceRecorder";

export class VoiceRecorder implements IVoiceRecorder {
	private buffers: Buffer[] = [];
	private recorder: PvRecorder | null = null;
	private isActive = false;
	private autoStopEmitter = new vscode.EventEmitter<void>();
	private timeout: NodeJS.Timeout | undefined;
	private maxDurationMs = featureConfig.recording.maxDurationSeconds * 1000;
	private readonly frameLength = 512;
	private capturePromise: Promise<void> | null = null;

	get onAutoStop(): vscode.Event<void> {
		return this.autoStopEmitter.event;
	}

	startRecording(): void {
		if (this.recorder || this.isActive) {
			return;
		}

		try {
			this.buffers = [];
			// Use default system device by omitting deviceIndex parameter
			this.recorder = new PvRecorder(this.frameLength);
			this.recorder.start();
			this.isActive = true;
			this.capturePromise = this.captureFrames();

			this.timeout = setTimeout(() => {
				this.autoStopEmitter.fire();
				void this.stopRecording();
			}, this.maxDurationMs);
		} catch (error) {
			// Clean up if initialization fails
			if (this.recorder) {
				try {
					this.recorder.release();
				} catch {
					// Ignore release errors
				}
				this.recorder = null;
			}
			this.isActive = false;
			throw error;
		}
	}

	async stopRecording(): Promise<Buffer> {
		this.clearTimeout();

		if (!this.recorder) {
			return Buffer.alloc(0);
		}

		// Signal shutdown
		this.isActive = false;

		// Stop the hardware (signals to stop, but doesn't release yet)
		try {
			this.recorder.stop();
		} catch (error) {
			console.error("Error stopping recorder:", error);
		}

		// Wait for captureFrames loop to complete safely
		if (this.capturePromise) {
			await this.capturePromise;
			this.capturePromise = null;
		}

		// Now safe to release resources
		try {
			this.recorder.release();
		} catch (error) {
			console.error("Error releasing recorder:", error);
		}
		this.recorder = null;

		const buffer = Buffer.concat(this.buffers);
		this.buffers = [];
		return buffer;
	}

	isRecording(): boolean {
		return this.recorder !== null && this.isActive;
	}

	dispose(): void {
		void this.stopRecording();
		this.autoStopEmitter.dispose();
	}

	private clearTimeout(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
	}

	private async captureFrames(): Promise<void> {
		while (this.recorder && this.isActive) {
			try {
				const frame = await this.recorder.read();
				this.buffers.push(this.frameToBuffer(frame));
				console.log("Captured frame ~", this.buffers.length);
			} catch (error) {
				// Determine if this is a shutdown-related error vs a real error
				const errorMessage = error instanceof Error ? error.message : String(error);
				const isShutdownError =
					!this.isActive ||
					errorMessage.includes("InvalidStateError") ||
					errorMessage.includes("failed to read");

				if (isShutdownError) {
					// This is expected during shutdown - exit silently
					break;
				}

				// Only log/handle REAL errors (not shutdown errors)
				console.error("VoiceRecorder frame capture error", error);

				// Only clean up for REAL errors (not shutdown errors)
				this.isActive = false;
				if (this.recorder) {
					try {
						this.recorder.stop();
						this.recorder.release();
					} catch {
						// Ignore cleanup errors
					}
					this.recorder = null;
				}

				// Show user-facing error for real microphone issues
				void vscode.window.showErrorMessage(
					"Microphone error during recording. Please check:\n" +
						"1. Microphone permissions are granted for VS Code\n" +
						"2. No other app is using the microphone\n" +
						"3. Your microphone is connected and working",
				);

				break; // Exit loop
			}
		}
	}

	private frameToBuffer(frame: Int16Array): Buffer {
		const buffer = Buffer.alloc(frame.length * 2);
		for (let index = 0; index < frame.length; index += 1) {
			buffer.writeInt16LE(frame[index], index * 2);
		}
		return buffer;
	}
}
