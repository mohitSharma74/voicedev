import * as vscode from "vscode";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { featureConfig } from "../config/feature.config";
import { IVoiceRecorder } from "./IVoiceRecorder";

function loadSampleBuffer(context: vscode.ExtensionContext): Buffer {
	try {
		return readFileSync(join(__dirname, "../test/fixtures/sample.pcm"));
	} catch (error) {
		const fixtureUri = vscode.Uri.joinPath(context.extensionUri, "src", "test", "fixtures", "sample.pcm");
		return readFileSync(fixtureUri.fsPath);
	}
}

export class MockVoiceRecorder implements IVoiceRecorder {
	private recording = false;
	private autoStopEmitter = new vscode.EventEmitter<void>();
	private maxDurationMs = featureConfig.recording.maxDurationSeconds * 1000;
	private timeout: NodeJS.Timeout | undefined;
	private sampleBuffer: Buffer;

	constructor(context: vscode.ExtensionContext) {
		this.sampleBuffer = loadSampleBuffer(context);
	}

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
		return Promise.resolve(this.sampleBuffer);
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
