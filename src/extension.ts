import * as vscode from "vscode";
import { createRecorder } from "./services/recorderFactory";
import { StatusBarManager } from "./ui/statusBar";
import { showMicrophonePermissionGuide } from "./utils/permissionHelper";
import { featureConfig } from "./config/feature.config";

const RECORDING_CONTEXT_KEY = "voicedev.isRecording";
let lastCapturedBuffer: Buffer | undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log("VoiceDev extension is now active!");

	const statusBar = new StatusBarManager();
	context.subscriptions.push(statusBar);

	const recorder = createRecorder();
	context.subscriptions.push(new vscode.Disposable(() => recorder.dispose()));

	const autoStopDisposable = recorder.onAutoStop(() => {
		cleanupRecordingState(statusBar);
		void vscode.window.showInformationMessage(
			`Recording stopped after ${featureConfig.recording.maxDurationSeconds}s maximum duration.`,
		);
	});
	context.subscriptions.push(autoStopDisposable);

	void showMicrophonePermissionGuide(context.globalState);

	const startCommand = vscode.commands.registerCommand("voicedev.startRecording", () => {
		if (recorder.isRecording()) {
			return;
		}

		try {
			recorder.startRecording();
			statusBar.setRecording();
			void vscode.commands.executeCommand("setContext", RECORDING_CONTEXT_KEY, true);
		} catch (error) {
			cleanupRecordingState(statusBar);
			void vscode.window.showErrorMessage("Unable to start recording. Please check your microphone.");
			console.error(error);
		}
	});

	const stopCommand = vscode.commands.registerCommand("voicedev.stopRecording", async () => {
		if (!recorder.isRecording()) {
			return;
		}

		try {
			const buffer = await recorder.stopRecording();
			lastCapturedBuffer = buffer;
			cleanupRecordingState(statusBar);
			void vscode.window.showInformationMessage("Recording captured. Transcription will be available soon.");
		} catch (error) {
			void vscode.window.showErrorMessage("Failed to stop recording.");
			console.error(error);
		}
	});

	context.subscriptions.push(startCommand, stopCommand);
}

function cleanupRecordingState(statusBar: StatusBarManager): void {
	statusBar.setIdle();
	void vscode.commands.executeCommand("setContext", RECORDING_CONTEXT_KEY, false);
}

export function getLastCapturedBuffer(): Buffer | undefined {
	return lastCapturedBuffer;
}

export function deactivate() {
	console.log("VoiceDev extension deactivated");
}
