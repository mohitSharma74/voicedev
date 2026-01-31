/**
 * Loading Indicator
 * Progress indicators for async operations using VS Code's progress API
 */

import * as vscode from "vscode";

/**
 * Loading Indicator utility class
 * Provides consistent progress indicators across the extension
 */
export class LoadingIndicator {
	private static readonly BRAND_PREFIX = "🎙️ VoiceDev:";

	/**
	 * Show progress notification with optional cancellation
	 * Use for important operations that users should be aware of
	 *
	 * @param title The title to display in the progress notification
	 * @param task The async task to execute with progress reporting
	 * @param options Optional configuration (cancellable)
	 * @returns The result of the task
	 */
	static async withProgress<T>(
		title: string,
		task: (
			progress: vscode.Progress<{ message?: string; increment?: number }>,
			token: vscode.CancellationToken,
		) => Promise<T>,
		options?: { cancellable?: boolean },
	): Promise<T> {
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `${LoadingIndicator.BRAND_PREFIX} ${title}`,
				cancellable: options?.cancellable ?? false,
			},
			task,
		);
	}

	/**
	 * Show progress in status bar only (less intrusive)
	 * Use for background operations that don't need prominent display
	 *
	 * @param title The title to display in the status bar
	 * @param task The async task to execute
	 * @returns The result of the task
	 */
	static async withStatusBar<T>(title: string, task: () => Promise<T>): Promise<T> {
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Window,
				title: `VoiceDev: ${title}`,
			},
			async () => task(),
		);
	}

	/**
	 * Wrap API key validation with progress indicator
	 *
	 * @param validateFn The validation function to execute
	 * @returns The validation result
	 */
	static async withApiKeyValidation<T>(validateFn: () => Promise<T>): Promise<T> {
		return this.withProgress("Validating API key", async (progress) => {
			progress.report({ message: "Connecting to provider..." });
			return validateFn();
		});
	}

	/**
	 * Wrap command execution with status bar progress
	 * Use for commands that may take a moment to execute
	 *
	 * @param commandName The name of the command being executed
	 * @param executeFn The execution function
	 * @returns The execution result
	 */
	static async withCommandExecution<T>(commandName: string, executeFn: () => Promise<T>): Promise<T> {
		return this.withStatusBar(`Executing: ${commandName}`, executeFn);
	}

	/**
	 * Wrap local STT setup with progress indicator
	 *
	 * @param setupFn The setup function to execute
	 * @returns The setup result
	 */
	static async withLocalSttSetup<T>(setupFn: () => Promise<T>): Promise<T> {
		return this.withProgress(
			"Setting up local speech-to-text",
			async (progress) => {
				progress.report({ message: "This may take a few minutes on first run..." });
				return setupFn();
			},
			{ cancellable: true },
		);
	}
}
