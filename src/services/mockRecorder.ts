import * as vscode from "vscode";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { featureConfig } from "../config/feature.config";
import { IVoiceRecorder } from "./IVoiceRecorder";

const FIXTURE_PATH = join(__dirname, "../test/fixtures/sample.pcm");
const SAMPLE_BUFFER = readFileSync(FIXTURE_PATH);

export class MockVoiceRecorder implements IVoiceRecorder {
	private recording = false;
	private autoStopEmitter = new vscode.EventEmitter<void>();
	private maxDurationMs = featureConfig.recording.maxDurationSeconds * 1000;
	private timeout: NodeJS.Timeout | undefined;

	get onAutoStop(): vscode.Event<void> {
		return this.autoStopEmitter.event;
	}

	startRecording(): void {
		if (this.recording) {
			return;
		}

		this.recording = true;
		this.timeout = setTimeout(() => {
			this.autoStopEmitter.fire();
			this.recording = false;
		}, this.maxDurationMs);
	}

	stopRecording(): Promise<Buffer> {
		this.clearTimeout();
		this.recording = false;
		return Promise.resolve(SAMPLE_BUFFER);
	}

	isRecording(): boolean {
		return this.recording;
	}

	dispose(): void {
		this.clearTimeout();
		this.autoStopEmitter.dispose();
	}

	private clearTimeout(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
	}
}
