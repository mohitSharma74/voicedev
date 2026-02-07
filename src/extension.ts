import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { createRecorder } from "@services/recorderFactory";
import { StatusBarManager } from "@ui/statusBar";
import { CommandCenterPanel } from "@ui/commandCenter/CommandCenterPanel";
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
import { initCopilotDetection, clearCopilotCache } from "@services/copilotDetection";
import { getTerminalHelper } from "@services/terminalHelper";
import { getFileHelper } from "@services/fileHelper";
import { ExecutionContext } from "@commands/types";
import { showShortcuts } from "@ui/shortcutHints";
import { getNotificationService } from "@ui/notificationService";
import { ErrorFormatter } from "@utils/errorFormatter";
import { LoadingIndicator } from "@ui/loadingIndicator";
import { WelcomeMessageManager } from "@ui/welcomeMessage";

const RECORDING_CONTEXT_KEY = "voicedev.isRecording";
let lastCapturedBuffer: Buffer | undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log("VoiceDev extension is now active!");

	// Initialize SecretStorage
	SecretStorageHelper.init(context);

	const statusBar = new StatusBarManager();
	context.subscriptions.push(statusBar);
	const notifications = getNotificationService();

	const recorder = createRecorder(context);
	context.subscriptions.push(new vscode.Disposable(() => recorder.dispose()));

	const transcriptionService = new TranscriptionService(context);
	context.subscriptions.push(new vscode.Disposable(() => transcriptionService.dispose()));

	// Initialize status bar with current provider
	statusBar.setProvider(transcriptionService.getProviderType());

	// Listen for provider changes and update status bar
	context.subscriptions.push(
		transcriptionService.onProviderChange((provider) => {
			statusBar.setProvider(provider);
			notifications.showProviderSwitched(provider);
		}),
	);

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

	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration("voicedev.commands.disabled")) {
			commandParser?.refresh();
			CommandCenterPanel.refreshIfOpen();
		}
		if (event.affectsConfiguration("voicedev.copilot.cliPath")) {
			clearCopilotCache();
			initCopilotDetection().catch(console.error);
		}
	});
	context.subscriptions.push(configChangeDisposable);

	// Initialize Copilot detection
	initCopilotDetection().catch(console.error);

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
		notifications.showRecordingAutoStopped(featureConfig.recording.maxDurationSeconds);
	});
	context.subscriptions.push(autoStopDisposable);

	void showMicrophonePermissionGuide(context.globalState);
	void WelcomeMessageManager.showIfFirstTime(context);

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

			const formatted = ErrorFormatter.formatRecordingError(
				error instanceof Error ? error : new Error(String(error)),
			);
			if (formatted.message.toLowerCase().includes("permission")) {
				await notifications.showMicrophonePermissionError();
			} else {
				void notifications.showError(formatted.message, formatted.actions);
			}
			statusBar.setError("Recording failed");
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
				let usedTransientState = false;
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
						// Execute the voice command with context
						try {
							const ctx: ExecutionContext = {
								args: parsedResult.extractedArgs
									? {
											wildcards: parsedResult.extractedArgs.wildcards,
											originalText: text,
											matchedPattern: parsedResult.matchedTrigger || "",
										}
									: undefined,
								terminal: getTerminalHelper(),
								files: getFileHelper(),
							};

							const execResult = await commandExecutor.execute(parsedResult, ctx);
							if (execResult && !execResult.success) {
								console.error("Command execution failed:", execResult.error);
								statusBar.setError("Command failed");
								usedTransientState = true;
							} else if (execResult?.success) {
								statusBar.setSuccess("Command executed");
								usedTransientState = true;
							}
						} catch (error: unknown) {
							const execError = error instanceof Error ? error : new Error("Unknown error");
							const formatted = ErrorFormatter.formatCommandExecutionError(
								parsedResult.command.description,
								execError,
							);
							void notifications.showError(formatted.message, formatted.actions);
							statusBar.setError("Command failed");
							usedTransientState = true;
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

							notifications.showTranscriptionResult(text, insertContext);
							statusBar.setSuccess("Inserted");
							usedTransientState = true;
						} catch (error: unknown) {
							const errorMessage = error instanceof Error ? error.message : "Unknown error";
							notifications.showTextInsertionFailed(errorMessage);
							statusBar.setError("Insert failed");
							usedTransientState = true;
						}
					}
				} catch (error: unknown) {
					const transcriptionError = error instanceof Error ? error : new Error("Unknown error");
					const formatted = ErrorFormatter.formatTranscriptionError(transcriptionError);
					void notifications.showError(formatted.message, formatted.actions);
					statusBar.setError("Transcription failed");
					usedTransientState = true;
				} finally {
					if (!usedTransientState) {
						statusBar.setIdle();
					}
				}
			}
		} catch (error) {
			void notifications.showError("Failed to stop recording.");
			console.error(error);
			cleanupRecordingState(statusBar);
			statusBar.setError("Stop failed");
		}
	});

	const saveCommand = vscode.commands.registerCommand("voicedev.saveRecording", async () => {
		if (!lastCapturedBuffer || lastCapturedBuffer.length === 0) {
			notifications.showNoRecordingToSave();
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

			notifications.showRecordingSaved(path.basename(uri.fsPath), `${duration.toFixed(1)}s`, `${sizeKB} KB`);
			statusBar.setSuccess("Saved");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			void notifications.showError(`Failed to save recording: ${errorMessage}`);
			statusBar.setError("Save failed");
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
		// Show provider quick pick (exclude local since it doesn't need an API key)
		const providers = [
			{ label: "Groq", value: "groq" },
			{ label: "Mistral", value: "mistral" },
			{ label: "OpenAI", value: "openai" },
		];

		const selected = await vscode.window.showQuickPick(providers, {
			placeHolder: "Select the provider for which you want to set the API key",
		});

		if (!selected) {
			return;
		}

		const provider = selected.value;
		const key = await vscode.window.showInputBox({
			prompt: `Enter your ${selected.label} API Key`,
			password: true,
			placeHolder: provider === "groq" ? "gsk_..." : "...",
			ignoreFocusOut: true,
		});

		if (key) {
			await LoadingIndicator.withApiKeyValidation(async () => {
				await SecretStorageHelper.getInstance().setApiKey(provider, key);
				// Validate that the key was stored successfully
				const storedKey = await SecretStorageHelper.getInstance().getApiKey(provider);
				if (!storedKey) {
					throw new Error("Failed to store API key");
				}
			});
			notifications.showApiKeySaved(selected.label);
			statusBar.setSuccess("API key saved");
		}
	});

	const clearApiKeyCommand = vscode.commands.registerCommand("voicedev.clearApiKey", async () => {
		// Show provider quick pick (exclude local since it doesn't need an API key)
		const providers = [
			{ label: "Groq", value: "groq" },
			{ label: "Mistral", value: "mistral" },
			{ label: "OpenAI", value: "openai" },
		];

		const selected = await vscode.window.showQuickPick(providers, {
			placeHolder: "Select the provider for which you want to clear the API key",
		});

		if (!selected) {
			return;
		}

		const provider = selected.value;
		await SecretStorageHelper.getInstance().deleteApiKey(provider);
		notifications.showApiKeyRemoved(selected.label);
		statusBar.setSuccess("API key cleared");
	});

	// List Voice Commands - opens quick pick with all available commands
	const listCommandsCmd = vscode.commands.registerCommand("voicedev.listCommands", async () => {
		const registry = getCommandRegistry();
		const listCommand = registry.findById("list-commands");
		if (listCommand) {
			await listCommand.execute();
		} else {
			void notifications.showWarning("Voice commands not loaded yet. Please try again.");
		}
	});

	// Open Command Center - opens webview with all commands
	const openCommandCenterCmd = vscode.commands.registerCommand("voicedev.openCommandCenter", () => {
		CommandCenterPanel.createOrShow(context.extensionUri);
	});

	const showWelcomeCmd = vscode.commands.registerCommand("voicedev.showWelcome", async () => {
		await WelcomeMessageManager.show(context);
	});

	const showShortcutsCmd = vscode.commands.registerCommand("voicedev.showShortcuts", async () => {
		await showShortcuts();
	});

	context.subscriptions.push(
		startCommand,
		stopCommand,
		toggleCommand,
		saveCommand,
		setApiKeyCommand,
		clearApiKeyCommand,
		listCommandsCmd,
		openCommandCenterCmd,
		showWelcomeCmd,
		showShortcutsCmd,
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
