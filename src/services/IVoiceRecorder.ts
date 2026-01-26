import * as vscode from "vscode";

export interface IVoiceRecorder {
	startRecording(): void;
	stopRecording(): Promise<Buffer>;
	isRecording(): boolean;
	readonly onAutoStop: vscode.Event<void>;
	dispose(): void;
}
