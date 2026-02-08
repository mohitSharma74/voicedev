/**
 * Error Formatter
 * Converts technical errors into user-friendly, actionable messages
 */

import * as vscode from "vscode";
import { NotificationAction } from "@ui/notificationService";

/**
 * Formatted error result with message and optional actions
 */
export interface FormattedError {
	message: string;
	actions?: NotificationAction[];
}

/**
 * Error Formatter class
 * Provides pattern-matching for common errors and generates helpful messages
 */
export class ErrorFormatter {
	/**
	 * Format a transcription error into a user-friendly message
	 */
	static formatTranscriptionError(error: Error): FormattedError {
		const errorMessage = error.message.toLowerCase();

		// API key errors
		if (errorMessage.includes("401") || errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
			return {
				message: "Invalid or missing API key",
				actions: [
					{
						title: "Set API Key",
						action: () => vscode.commands.executeCommand("voicedev.setApiKey"),
					},
				],
			};
		}

		// Network errors
		if (
			errorMessage.includes("network") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("econnrefused") ||
			errorMessage.includes("enotfound") ||
			errorMessage.includes("fetch failed")
		) {
			return {
				message: "Network connection failed. Check your internet connection.",
				actions: [
					{
						title: "Retry",
						action: () => vscode.commands.executeCommand("voicedev.toggleRecording"),
					},
				],
			};
		}

		// Rate limit errors
		if (errorMessage.includes("rate limit") || errorMessage.includes("429") || errorMessage.includes("too many")) {
			return {
				message: "API rate limit exceeded. Try again in a few moments.",
				actions: [],
			};
		}

		// Audio format errors
		if (
			errorMessage.includes("audio") ||
			errorMessage.includes("format") ||
			errorMessage.includes("invalid file")
		) {
			return {
				message: "Audio format error. Try recording again.",
				actions: [
					{
						title: "Start Recording",
						action: () => vscode.commands.executeCommand("voicedev.startRecording"),
					},
				],
			};
		}

		// Empty audio
		if (errorMessage.includes("empty") || errorMessage.includes("no audio") || errorMessage.includes("silent")) {
			return {
				message: "No audio detected. Speak clearly and try again.",
				actions: [
					{
						title: "Start Recording",
						action: () => vscode.commands.executeCommand("voicedev.startRecording"),
					},
				],
			};
		}

		// Generic fallback
		return {
			message: `Transcription failed: ${error.message}`,
			actions: [
				{
					title: "View Logs",
					action: () => vscode.commands.executeCommand("workbench.action.output.toggleOutput"),
				},
			],
		};
	}

	/**
	 * Format a command execution error into a user-friendly message
	 */
	static formatCommandExecutionError(commandName: string, error: Error): FormattedError {
		const errorMessage = error.message.toLowerCase();

		// No active editor
		if (errorMessage.includes("no active") || errorMessage.includes("no editor")) {
			return {
				message: `Cannot execute "${commandName}": No file is open`,
				actions: [
					{
						title: "Open File",
						action: () => vscode.commands.executeCommand("workbench.action.quickOpen"),
					},
				],
			};
		}

		// No workspace
		if (errorMessage.includes("no workspace") || errorMessage.includes("no folder")) {
			return {
				message: `Cannot execute "${commandName}": No workspace folder is open`,
				actions: [
					{
						title: "Open Folder",
						action: () => vscode.commands.executeCommand("workbench.action.files.openFolder"),
					},
				],
			};
		}

		// Permission denied
		if (errorMessage.includes("permission") || errorMessage.includes("access denied")) {
			return {
				message: `Cannot execute "${commandName}": Permission denied`,
				actions: [],
			};
		}

		// Command not found
		if (errorMessage.includes("not found") || errorMessage.includes("unknown command")) {
			return {
				message: `Command "${commandName}" is not available`,
				actions: [
					{
						title: "Show Commands",
						action: () => vscode.commands.executeCommand("voicedev.listCommands"),
					},
				],
			};
		}

		// Generic fallback
		return {
			message: `Failed to execute "${commandName}": ${error.message}`,
			actions: [
				{
					title: "Show Commands",
					action: () => vscode.commands.executeCommand("voicedev.listCommands"),
				},
			],
		};
	}

	/**
	 * Format a recording error into a user-friendly message
	 */
	static formatRecordingError(error: Error): FormattedError {
		const errorMessage = error.message.toLowerCase();

		// Permission denied
		if (errorMessage.includes("permission") || errorMessage.includes("access")) {
			return {
				message: "Microphone access denied. Grant permission in system settings.",
				actions: [],
			};
		}

		// No device
		if (
			errorMessage.includes("device") ||
			errorMessage.includes("no microphone") ||
			errorMessage.includes("not found")
		) {
			return {
				message: "No microphone found. Connect a microphone and try again.",
				actions: [],
			};
		}

		// Device busy
		if (errorMessage.includes("busy") || errorMessage.includes("in use") || errorMessage.includes("locked")) {
			return {
				message: "Microphone is in use by another application.",
				actions: [],
			};
		}

		// Generic fallback
		return {
			message: `Recording failed: ${error.message}`,
			actions: [],
		};
	}

	/**
	 * Format a Copilot CLI error into a user-friendly message
	 */
	static formatCopilotError(error: Error): FormattedError {
		const errorMessage = error.message.toLowerCase();

		// Not installed
		if (errorMessage.includes("not found") || errorMessage.includes("not installed")) {
			return {
				message: "Copilot CLI is not installed",
				actions: [
					{
						title: "Install Guide",
						action: () => {
							void vscode.env.openExternal(
								vscode.Uri.parse("https://docs.github.com/en/copilot/reference/cli-command-reference"),
							);
						},
					},
				],
			};
		}

		// Not authenticated
		if (errorMessage.includes("auth") || errorMessage.includes("login") || errorMessage.includes("unauthorized")) {
			return {
				message: "Copilot CLI authentication required",
				actions: [
					{
						title: "Authentication Guide",
						action: () => {
							void vscode.env.openExternal(
								vscode.Uri.parse("https://docs.github.com/en/copilot/reference/cli-command-reference"),
							);
						},
					},
				],
			};
		}

		// Generic fallback
		return {
			message: `Copilot CLI error: ${error.message}`,
			actions: [],
		};
	}

	/**
	 * Format a git error into a user-friendly message
	 */
	static formatGitError(error: Error): FormattedError {
		const errorMessage = error.message.toLowerCase();

		// Not a git repository
		if (errorMessage.includes("not a git repository") || errorMessage.includes("not a git repo")) {
			return {
				message: "This folder is not a Git repository",
				actions: [
					{
						title: "Initialize Git",
						action: () => {
							const terminal = vscode.window.createTerminal("Git Init");
							terminal.show();
							terminal.sendText("git init", true);
						},
					},
				],
			};
		}

		// No commits
		if (errorMessage.includes("no commits") || errorMessage.includes("empty repository")) {
			return {
				message: "No commits in this repository yet",
				actions: [],
			};
		}

		// Merge conflict
		if (errorMessage.includes("conflict") || errorMessage.includes("merge")) {
			return {
				message: "Merge conflicts need to be resolved first",
				actions: [
					{
						title: "Open Source Control",
						action: () => vscode.commands.executeCommand("workbench.view.scm"),
					},
				],
			};
		}

		// Generic fallback
		return {
			message: `Git error: ${error.message}`,
			actions: [],
		};
	}
}
