import * as vscode from "vscode";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { featureConfig } from "../config/feature.config";
import { IVoiceRecorder } from "./IVoiceRecorder";

export class VoiceRecorder implements IVoiceRecorder {
	private buffers: Buffer[] = [];
	private recorder: PvRecorder | null = null;
	private isActive = false;
	private autoStopEmitter = new vscode.EventEmitter<void>();
	private timeout: NodeJS.Timeout | undefined;
	private maxDurationMs = featureConfig.recording.maxDurationSeconds * 1000;
	private readonly frameLength = 512;

	get onAutoStop(): vscode.Event<void> {
		return this.autoStopEmitter.event;
	}

	startRecording(): void {
		if (this.recorder || this.isActive) {
			return;
		}

		this.buffers = [];
		// Use default system device by omitting deviceIndex parameter
		this.recorder = new PvRecorder(this.frameLength);
		this.recorder.start();
		this.isActive = true;
		void this.captureFrames();

		this.timeout = setTimeout(() => {
			this.autoStopEmitter.fire();
			void this.stopRecording();
		}, this.maxDurationMs);
	}

	stopRecording(): Promise<Buffer> {
		this.clearTimeout();

		if (!this.recorder) {
			return Promise.resolve(Buffer.alloc(0));
		}

		this.isActive = false;
		this.recorder.stop();
		this.recorder.release();
		this.recorder = null;

		const buffer = Buffer.concat(this.buffers);
		this.buffers = [];
		return Promise.resolve(buffer);
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
				console.error("VoiceRecorder frame capture error", error);
				this.isActive = false;
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
