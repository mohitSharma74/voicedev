import * as vscode from "vscode";
import { record } from "node-record-lpcm16";
import { featureConfig } from "../config/feature.config";
import { IVoiceRecorder } from "./IVoiceRecorder";

export class VoiceRecorder implements IVoiceRecorder {
	private buffers: Buffer[] = [];
	private recordingInstance: ReturnType<typeof record> | null = null;
	private stream: NodeJS.ReadableStream | null = null;
	private autoStopEmitter = new vscode.EventEmitter<void>();
	private timeout: NodeJS.Timeout | undefined;
	private maxDurationMs = featureConfig.recording.maxDurationSeconds * 1000;

	get onAutoStop(): vscode.Event<void> {
		return this.autoStopEmitter.event;
	}

	startRecording(): void {
		if (this.recordingInstance) {
			return;
		}

		this.buffers = [];
		this.recordingInstance = record({
			sampleRate: featureConfig.recording.sampleRate,
			channels: featureConfig.recording.channels,
			verbose: false,
		});

		this.stream = this.recordingInstance.stream();

		this.stream.on("data", (chunk: Buffer) => {
			this.buffers.push(chunk);
		});

		this.stream.on("error", (error: Error) => {
			console.error("VoiceRecorder stream error", error);
		});

		this.timeout = setTimeout(() => {
			this.autoStopEmitter.fire();
			void this.stopRecording();
		}, this.maxDurationMs);
	}

	stopRecording(): Promise<Buffer> {
		this.clearTimeout();

		if (!this.recordingInstance) {
			return Promise.resolve(Buffer.alloc(0));
		}

		this.recordingInstance.stop();
		this.recordingInstance = null;

		if (this.stream) {
			this.stream.removeAllListeners();
			this.stream = null;
		}

		const buffer = Buffer.concat(this.buffers);
		this.buffers = [];
		return Promise.resolve(buffer);
	}

	isRecording(): boolean {
		return this.recordingInstance !== null;
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
}
