/**
 * Notification Service
 * Centralized notification system with consistent VoiceDev branding
 */

import * as vscode from "vscode";

/**
 * Action button for notifications
 */
export interface NotificationAction {
	title: string;
	action: () => void | Thenable<void>;
}

/**
 * Notification Service - Singleton
 * Provides consistent, branded notifications across the extension
 */
export class NotificationService {
	private static instance: NotificationService;
	private static readonly BRAND_PREFIX = "🎙️ VoiceDev:";

	private constructor() {}

	/**
	 * Get the singleton instance
	 */
	static getInstance(): NotificationService {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
		}
		return NotificationService.instance;
	}

	/**
	 * Format message with brand prefix
	 */
	private formatMessage(message: string): string {
		return `${NotificationService.BRAND_PREFIX} ${message}`;
	}

	/**
	 * Show a success notification
	 */
	async showSuccess(message: string, actions?: NotificationAction[]): Promise<void> {
		const formattedMessage = this.formatMessage(`$(check) ${message}`);
		await this.showWithActions(vscode.window.showInformationMessage, formattedMessage, actions);
	}

	/**
	 * Show an error notification
	 */
	async showError(message: string, actions?: NotificationAction[]): Promise<void> {
		const formattedMessage = this.formatMessage(`$(error) ${message}`);
		await this.showWithActions(vscode.window.showErrorMessage, formattedMessage, actions);
	}

	/**
	 * Show a warning notification
	 */
	async showWarning(message: string, actions?: NotificationAction[]): Promise<void> {
		const formattedMessage = this.formatMessage(`$(warning) ${message}`);
		await this.showWithActions(vscode.window.showWarningMessage, formattedMessage, actions);
	}

	/**
	 * Show an info notification
	 */
	async showInfo(message: string, actions?: NotificationAction[]): Promise<void> {
		const formattedMessage = this.formatMessage(`$(info) ${message}`);
		await this.showWithActions(vscode.window.showInformationMessage, formattedMessage, actions);
	}

	/**
	 * Show command execution success
	 */
	showCommandExecuted(commandName: string, icon?: string): void {
		const displayIcon = icon || "$(check)";
		void vscode.window.showInformationMessage(this.formatMessage(`${displayIcon} ${commandName}`));
	}

	/**
	 * Show transcription result preview
	 */
	showTranscriptionResult(text: string, insertLocation: string): void {
		const preview = text.length > 40 ? `${text.substring(0, 40)}...` : text;
		void vscode.window.showInformationMessage(this.formatMessage(`"${preview}" → ${insertLocation}`));
	}

	/**
	 * Show API key saved notification
	 */
	showApiKeySaved(provider: string): void {
		void vscode.window.showInformationMessage(this.formatMessage(`${provider} API key saved securely`));
	}

	/**
	 * Show API key removed notification
	 */
	showApiKeyRemoved(provider: string): void {
		void vscode.window.showInformationMessage(this.formatMessage(`${provider} API key removed`));
	}

	/**
	 * Show provider switched notification
	 */
	showProviderSwitched(provider: string): void {
		void vscode.window.showInformationMessage(this.formatMessage(`Switched to ${provider} provider`));
	}

	/**
	 * Show recording saved notification
	 */
	showRecordingSaved(filename: string, duration: string, size: string): void {
		void vscode.window.showInformationMessage(
			this.formatMessage(`Recording saved: ${filename} (${duration}, ${size})`),
		);
	}

	/**
	 * Show no recording to save warning
	 */
	showNoRecordingToSave(): void {
		void vscode.window.showWarningMessage(this.formatMessage("No recording to save. Record audio first."));
	}

	/**
	 * Show command disabled warning
	 */
	showCommandDisabled(commandDescription: string): void {
		void vscode.window.showWarningMessage(this.formatMessage(`"${commandDescription}" is disabled in settings`));
	}

	/**
	 * Show command execution failed error
	 */
	async showCommandFailed(commandDescription: string, errorMessage: string): Promise<void> {
		await this.showError(`Failed to execute "${commandDescription}": ${errorMessage}`, [
			{
				title: "Show Commands",
				action: () => vscode.commands.executeCommand("voicedev.listCommands"),
			},
		]);
	}

	/**
	 * Show transcription failed error
	 */
	async showTranscriptionFailed(errorMessage: string): Promise<void> {
		await this.showError(`Transcription failed: ${errorMessage}`, [
			{
				title: "View Logs",
				action: () => vscode.commands.executeCommand("workbench.action.output.toggleOutput"),
			},
		]);
	}

	/**
	 * Show text insertion failed error
	 */
	showTextInsertionFailed(errorMessage: string): void {
		void vscode.window.showErrorMessage(this.formatMessage(`Failed to insert text: ${errorMessage}`));
	}

	/**
	 * Show microphone permission error
	 */
	async showMicrophonePermissionError(): Promise<void> {
		const choice = await vscode.window.showErrorMessage(
			this.formatMessage("Microphone permission denied. Grant VS Code access to your microphone."),
			"Open System Preferences",
		);
		if (choice === "Open System Preferences") {
			await vscode.env.openExternal(
				vscode.Uri.parse("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"),
			);
		}
	}

	/**
	 * Show microphone error
	 */
	showMicrophoneError(errorMessage: string): void {
		void vscode.window.showErrorMessage(
			this.formatMessage(
				`Unable to start recording: ${errorMessage}\n\n` +
					"Please check:\n" +
					"• Microphone is connected\n" +
					"• VS Code has microphone permissions\n" +
					"• No other app is using the microphone",
			),
		);
	}

	/**
	 * Show recording auto-stopped notification
	 */
	showRecordingAutoStopped(maxDurationSeconds: number): void {
		void vscode.window.showInformationMessage(
			this.formatMessage(`Recording stopped after ${maxDurationSeconds}s maximum duration`),
		);
	}

	/**
	 * Show git push cancelled
	 */
	showGitPushCancelled(): void {
		void vscode.window.showInformationMessage(this.formatMessage("Git push cancelled"));
	}

	/**
	 * Show git commit cancelled
	 */
	showGitCommitCancelled(): void {
		void vscode.window.showInformationMessage(this.formatMessage("Git commit cancelled"));
	}

	/**
	 * Show no workspace warning
	 */
	async showNoWorkspace(): Promise<void> {
		await this.showWarning("No workspace folder is open", [
			{
				title: "Open Folder",
				action: () => vscode.commands.executeCommand("workbench.action.files.openFolder"),
			},
		]);
	}

	/**
	 * Show terminal helper not available error
	 */
	showTerminalNotAvailable(): void {
		void vscode.window.showErrorMessage(this.formatMessage("Terminal helper not available"));
	}

	/**
	 * Show no active editor error
	 */
	showNoActiveEditor(): void {
		void vscode.window.showErrorMessage(this.formatMessage("No active editor. Please open a file first."));
	}

	/**
	 * Show jumped to line notification
	 */
	showJumpedToLine(lineNumber: number): void {
		void vscode.window.showInformationMessage(this.formatMessage(`Jumped to line ${lineNumber}`));
	}

	/**
	 * Show line number parse warning
	 */
	showLineNumberParseWarning(input: string): void {
		void vscode.window.showWarningMessage(this.formatMessage(`Could not parse line number from: "${input}"`));
	}

	/**
	 * Show line exceeds document warning
	 */
	showLineExceedsDocument(requestedLine: number, maxLines: number): void {
		void vscode.window.showWarningMessage(
			this.formatMessage(
				`Line ${requestedLine} exceeds document length (${maxLines} lines). Going to last line.`,
			),
		);
	}

	/**
	 * Helper to show notification with action buttons
	 */
	private async showWithActions(
		showFn: (message: string, ...items: string[]) => Thenable<string | undefined>,
		message: string,
		actions?: NotificationAction[],
	): Promise<void> {
		if (!actions || actions.length === 0) {
			await showFn(message);
			return;
		}

		const actionTitles = actions.map((action) => action.title);
		const choice = await showFn(message, ...actionTitles);

		if (choice) {
			const selectedAction = actions.find((action) => action.title === choice);
			if (selectedAction) {
				await selectedAction.action();
			}
		}
	}
}

// Export singleton getter
export function getNotificationService(): NotificationService {
	return NotificationService.getInstance();
}
