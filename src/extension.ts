import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { createRecorder } from "@services/recorderFactory";
import { StatusBarManager } from "@ui/statusBar";
import { showMicrophonePermissionGuide } from "@utils/permissionHelper";
import { featureConfig } from "@config/feature.config";
import { encodeWav, calculateDuration } from "@utils/wavEncoder";
import { audioPlayer } from "@utils/audioPlayer";
import { TranscriptionService } from "@services/transcriptionService";
import { SecretStorageHelper } from "@utils/secretStorage";
import { insertOrSendText } from "@utils/textInsertion";
import { registerAllCommands, getCommandRegistry } from "@commands/index";
import { initCommandParser } from "@services/commandParser";
import { getCommandExecutor } from "@services/commandExecutor";

const RECORDING_CONTEXT_KEY = "voicedev.isRecording";
let lastCapturedBuffer: Buffer | undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log("VoiceDev extension is now active!");

	// Initialize SecretStorage
	SecretStorageHelper.init(context);

	const statusBar = new StatusBarManager();
	context.subscriptions.push(statusBar);

	const recorder = createRecorder(context);
	context.subscriptions.push(new vscode.Disposable(() => recorder.dispose()));

	const transcriptionService = new TranscriptionService(context);
	context.subscriptions.push(new vscode.Disposable(() => transcriptionService.dispose()));

	// Defer API key validation to avoid secrets race condition
	setTimeout(() => {
		console.log("VoiceDev: Checking API key configuration...");
		// Validation happens lazily when first needed
	}, 100);

	// Initialize voice command system
	registerAllCommands();
	const commandExecutor = getCommandExecutor();

	// Initialize command parser asynchronously (loads fuse.js ESM module)
	let commandParser: Awaited<ReturnType<typeof initCommandParser>> | null = null;
	initCommandParser()
		.then((parser) => {
			commandParser = parser;
			commandParser.refresh(); // Initialize fuse.js with registered commands
			console.log("VoiceDev command parser initialized with", parser.isReady() ? "success" : "failure");
		})
		.catch((error) => {
			console.error("Failed to initialize command parser:", error);
		});

	const autoStopDisposable = recorder.onAutoStop(() => {
		// Auto-stop triggers the stop command logic flow indirectly
		// But since recorder stops itself, we just need to handle the UI and processing
		// We'll call stopRecording command to ensure consistent flow,
		// but since it checks isRecording(), we might need to handle the buffer directly here
		// if the recorder is already stopped.
		// However, the recorder implementation emits onAutoStop AFTER stopping.
		// Let's reuse the stop logic by calling the command if we can, or just cleaning up.

		// For simplicity in Phase 1.2/1.3, we'll just show the message.
		// In a real flow, we'd want to capture that buffer.
		// Since recorder.stopRecording() returns the buffer, and onAutoStop is an event,
		// we might miss the buffer if we don't change the recorder interface.
		// For now, consistent with Phase 1.2:
		cleanupRecordingState(statusBar);
		void audioPlayer.play(context, "stop");
		void vscode.window.showInformationMessage(
			`Recording stopped after ${featureConfig.recording.maxDurationSeconds}s maximum duration.`,
		);
	});
	context.subscriptions.push(autoStopDisposable);

	void showMicrophonePermissionGuide(context.globalState);

	const startCommand = vscode.commands.registerCommand("voicedev.startRecording", async () => {
		if (recorder.isRecording()) {
			return;
		}

		try {
			recorder.startRecording();
			void audioPlayer.play(context, "start");
			statusBar.setRecording();
			void vscode.commands.executeCommand("setContext", RECORDING_CONTEXT_KEY, true);
		} catch (error) {
			cleanupRecordingState(statusBar);
			console.error("Failed to start recording:", error);

			const errorMessage = error instanceof Error ? error.message : String(error);

			if (errorMessage.toLowerCase().includes("permission") || errorMessage.toLowerCase().includes("access")) {
				const choice = await vscode.window.showErrorMessage(
					"Microphone permission denied. Please grant VS Code access to your microphone.",
					"Open System Preferences",
				);
				if (choice === "Open System Preferences") {
					void vscode.env.openExternal(
						vscode.Uri.parse("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"),
					);
				}
			} else {
				void vscode.window.showErrorMessage(
					`Unable to start recording: ${errorMessage}\n\nPlease check:\n` +
						"• Microphone is connected\n" +
						"• VS Code has microphone permissions\n" +
						"• No other app is using the microphone",
				);
			}
		}
	});

	const stopCommand = vscode.commands.registerCommand("voicedev.stopRecording", async () => {
		if (!recorder.isRecording()) {
			return;
		}

		try {
			const buffer = await recorder.stopRecording();
			void audioPlayer.play(context, "stop");
			lastCapturedBuffer = buffer;
			cleanupRecordingState(statusBar); // Set to idle first

			// Start transcription flow
			if (buffer.length > 0) {
				statusBar.setTranscribing();
				try {
					// Encode to WAV for the API
					const wavBuffer = encodeWav(buffer, {
						sampleRate: featureConfig.recording.sampleRate,
						channels: featureConfig.recording.channels,
						bitDepth: 16,
					});

					const text = await transcriptionService.transcribe(wavBuffer);
					console.log("Transcription:", text);

					// Phase 2.1: Check for voice commands first (if parser is ready)
					const parsedResult = commandParser?.isReady() ? commandParser.parse(text) : null;
					if (parsedResult) {
						console.log("Command parse result:", {
							type: parsedResult.type,
							confidence: parsedResult.confidence.toFixed(2),
							matchedTrigger: parsedResult.matchedTrigger,
						});
					}

					if (parsedResult?.type === "command" && parsedResult.command) {
						// Execute the voice command
						try {
							const execResult = await commandExecutor.execute(parsedResult);
							if (execResult && !execResult.success) {
								console.error("Command execution failed:", execResult.error);
							}
						} catch (error: unknown) {
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							void vscode.window.showErrorMessage(`Command execution failed: ${errorMessage}`);
						}
					} else {
						// Fallback to dictation: Insert text into editor or send to terminal
						// (also used if command parser is not ready yet)
						try {
							await insertOrSendText(text);

							// Determine context for notification message
							const insertContext = vscode.window.activeTextEditor
								? "editor"
								: vscode.window.activeTerminal
									? "terminal"
									: "unknown";

							const preview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
							void vscode.window.showInformationMessage(`Inserted to ${insertContext}: "${preview}"`);
						} catch (error: unknown) {
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							void vscode.window.showErrorMessage(`Failed to insert text: ${errorMessage}`);
						}
					}
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					void vscode.window.showErrorMessage(`Transcription failed: ${errorMessage}`);
				} finally {
					statusBar.setIdle();
				}
			}
		} catch (error) {
			void vscode.window.showErrorMessage("Failed to stop recording.");
			console.error(error);
			cleanupRecordingState(statusBar);
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

	// API Key Commands
	const setApiKeyCommand = vscode.commands.registerCommand("voicedev.setApiKey", async () => {
		const provider = "groq"; // Hardcoded for Phase 1.3
		const key = await vscode.window.showInputBox({
			prompt: `Enter your ${provider.toUpperCase()} API Key`,
			password: true,
			placeHolder: "gsk_...",
			ignoreFocusOut: true,
		});

		if (key) {
			await SecretStorageHelper.getInstance().setApiKey(provider, key);
			void vscode.window.showInformationMessage(`${provider.toUpperCase()} API key saved securely.`);
		}
	});

	const clearApiKeyCommand = vscode.commands.registerCommand("voicedev.clearApiKey", async () => {
		const provider = "groq"; // Hardcoded for Phase 1.3
		await SecretStorageHelper.getInstance().deleteApiKey(provider);
		void vscode.window.showInformationMessage(`${provider.toUpperCase()} API key removed.`);
	});

	// List Voice Commands - opens quick pick with all available commands
	const listCommandsCmd = vscode.commands.registerCommand("voicedev.listCommands", async () => {
		const registry = getCommandRegistry();
		const listCommand = registry.findById("list-commands");
		if (listCommand) {
			await listCommand.execute();
		} else {
			void vscode.window.showWarningMessage("Voice commands not loaded yet. Please try again.");
		}
	});

	context.subscriptions.push(
		startCommand,
		stopCommand,
		toggleCommand,
		saveCommand,
		setApiKeyCommand,
		clearApiKeyCommand,
		listCommandsCmd,
	);
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
