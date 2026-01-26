import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { createRecorder } from "./services/recorderFactory";
import { StatusBarManager } from "./ui/statusBar";
import { showMicrophonePermissionGuide } from "./utils/permissionHelper";
import { featureConfig } from "./config/feature.config";
import { encodeWav, calculateDuration } from "./utils/wavEncoder";

const RECORDING_CONTEXT_KEY = "voicedev.isRecording";
let lastCapturedBuffer: Buffer | undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log("VoiceDev extension is now active!");

	const statusBar = new StatusBarManager();
	context.subscriptions.push(statusBar);

	const recorder = createRecorder(context);
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

			const duration = calculateDuration(
				buffer,
				featureConfig.recording.sampleRate,
				featureConfig.recording.channels,
			);
			void vscode.window.showInformationMessage(
				`Recording captured (${duration.toFixed(1)}s). Use "VoiceDev: Save Recording" to save as WAV file.`,
			);
		} catch (error) {
			void vscode.window.showErrorMessage("Failed to stop recording.");
			console.error(error);
		}
	});

	const saveCommand = vscode.commands.registerCommand("voicedev.saveRecording", async () => {
		if (!lastCapturedBuffer || lastCapturedBuffer.length === 0) {
			void vscode.window.showWarningMessage("No recording to save. Record audio first.");
			return;
		}

		try {
			// Generate default filename with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
			const defaultFilename = `voicedev-recording-${timestamp}.wav`;

			// Prompt user for save location
			const uri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(
					path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "", defaultFilename),
				),
				filters: {
					"WAV Audio": ["wav"],
					"All Files": ["*"],
				},
			});

			if (!uri) {
				return; // User cancelled
			}

			// Convert PCM buffer to WAV format
			const wavBuffer = encodeWav(lastCapturedBuffer, {
				sampleRate: featureConfig.recording.sampleRate,
				channels: featureConfig.recording.channels,
				bitDepth: 16,
			});

			// Save to file
			await fs.writeFile(uri.fsPath, wavBuffer);

			const duration = calculateDuration(
				lastCapturedBuffer,
				featureConfig.recording.sampleRate,
				featureConfig.recording.channels,
			);
			const sizeKB = (wavBuffer.length / 1024).toFixed(1);

			void vscode.window.showInformationMessage(
				`Recording saved: ${path.basename(uri.fsPath)} (${duration.toFixed(1)}s, ${sizeKB} KB)`,
			);
		} catch (error) {
			void vscode.window.showErrorMessage(
				`Failed to save recording: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			console.error(error);
		}
	});

	const toggleCommand = vscode.commands.registerCommand("voicedev.toggleRecording", async () => {
		if (recorder.isRecording()) {
			await vscode.commands.executeCommand("voicedev.stopRecording");
		} else {
			await vscode.commands.executeCommand("voicedev.startRecording");
		}
	});

	context.subscriptions.push(startCommand, stopCommand, toggleCommand, saveCommand);
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
