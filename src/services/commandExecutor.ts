/**
 * Command Executor
 * Executes voice commands and provides user feedback
 */

import * as vscode from "vscode";
import { VoiceCommand, ParsedResult } from "@commands/types";

/**
 * Result of a command execution attempt
 */
export interface ExecutionResult {
	success: boolean;
	command: VoiceCommand;
	error?: Error;
	executionTimeMs: number;
}

/**
 * Options for command execution
 */
export interface ExecutionOptions {
	/** Show a notification on successful execution */
	showNotification: boolean;
	/** Show notification on error */
	showErrorNotification: boolean;
}

const DEFAULT_OPTIONS: ExecutionOptions = {
	showNotification: true,
	showErrorNotification: true,
};

/**
 * Command Executor class
 * Handles the execution of voice commands with feedback
 */
export class CommandExecutor {
	private options: ExecutionOptions;

	constructor(options: Partial<ExecutionOptions> = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	/**
	 * Execute a parsed command result
	 * @param result The parsed result from CommandParser
	 * @returns ExecutionResult with success/failure info
	 */
	async execute(result: ParsedResult): Promise<ExecutionResult | null> {
		if (result.type !== "command" || !result.command) {
			return null;
		}

		return this.executeCommand(result.command);
	}

	/**
	 * Execute a specific voice command
	 * @param command The command to execute
	 * @returns ExecutionResult with success/failure info
	 */
	async executeCommand(command: VoiceCommand): Promise<ExecutionResult> {
		const startTime = Date.now();

		try {
			await command.execute();

			const executionTimeMs = Date.now() - startTime;
			const result: ExecutionResult = {
				success: true,
				command,
				executionTimeMs,
			};

			// Show success notification
			if (this.options.showNotification) {
				this.showSuccessNotification(command);
			}

			return result;
		} catch (error) {
			const executionTimeMs = Date.now() - startTime;
			const execError = error instanceof Error ? error : new Error(String(error));

			const result: ExecutionResult = {
				success: false,
				command,
				error: execError,
				executionTimeMs,
			};

			// Show error notification
			if (this.options.showErrorNotification) {
				this.showErrorNotification(command, execError);
			}

			return result;
		}
	}

	/**
	 * Show a success notification for a completed command
	 */
	private showSuccessNotification(command: VoiceCommand): void {
		const icon = this.getCategoryIcon(command.category);
		const message = `${icon} ${command.description}`;

		void vscode.window.showInformationMessage(message);
	}

	/**
	 * Show an error notification for a failed command
	 */
	private showErrorNotification(command: VoiceCommand, error: Error): void {
		const message = `Failed to execute "${command.description}": ${error.message}`;

		void vscode.window.showErrorMessage(message);
	}

	/**
	 * Get an icon for a command category
	 */
	private getCategoryIcon(category: string): string {
		const icons: Record<string, string> = {
			editor: "$(edit)",
			git: "$(git-commit)",
			terminal: "$(terminal)",
			navigation: "$(compass)",
			system: "$(gear)",
		};
		return icons[category] || "$(zap)";
	}

	/**
	 * Update execution options
	 */
	setOptions(options: Partial<ExecutionOptions>): void {
		this.options = { ...this.options, ...options };
	}

	/**
	 * Get current options
	 */
	getOptions(): ExecutionOptions {
		return { ...this.options };
	}
}

// Singleton instance
let executorInstance: CommandExecutor | null = null;

export function getCommandExecutor(): CommandExecutor {
	if (!executorInstance) {
		executorInstance = new CommandExecutor();
	}
	return executorInstance;
}

// Export for testing with custom options
export function createCommandExecutor(options?: Partial<ExecutionOptions>): CommandExecutor {
	return new CommandExecutor(options);
}
