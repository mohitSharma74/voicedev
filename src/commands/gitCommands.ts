/**
 * Git Commands
 * Voice commands for common Git operations in the terminal
 */

import * as vscode from "vscode";
import { VoiceCommand, ExecutionContext } from "./types";
import { confirmGitPush, confirmGitCommit } from "@utils/confirmationHelper";

/**
 * Escape double quotes and special characters for safe shell execution
 */
function escapeDoubleQuotes(str: string): string {
	return str
		.replace(/\\/g, "\\\\") // Escape backslashes first
		.replace(/"/g, '\\"') // Escape double quotes
		.replace(/`/g, "\\`") // Escape backticks
		.replace(/\$/g, "\\$"); // Escape dollar signs
}

/**
 * Show a warning message to the user
 */
function showWarning(message: string): void {
	void vscode.window.showWarningMessage(`VoiceDev: ${message}`);
}

/**
 * Show an error message to the user
 */
function showError(message: string): void {
	void vscode.window.showErrorMessage(`VoiceDev: ${message}`);
}

/**
 * Git Status Command
 * Runs git status in the terminal
 */
const gitStatusCommand: VoiceCommand = {
	id: "git-status",
	triggers: ["git status", "show git status", "check git status", "show changes"],
	description: "Run git status in terminal",
	category: "git",
	execute: (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}
		ctx.terminal.run("git status");
	},
};

/**
 * Git Pull Command
 * Runs git pull in the terminal
 */
const gitPullCommand: VoiceCommand = {
	id: "git-pull",
	triggers: ["git pull", "pull changes", "pull from remote", "fetch and merge"],
	description: "Pull changes from remote",
	category: "git",
	execute: (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}
		ctx.terminal.run("git pull");
	},
};

/**
 * Git Push Command
 * Runs git push with confirmation
 */
const gitPushCommand: VoiceCommand = {
	id: "git-push",
	triggers: ["git push", "push changes", "push to remote", "push commits"],
	description: "Push commits to remote (with confirmation)",
	category: "git",
	execute: async (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}

		const confirmed = await confirmGitPush();
		if (!confirmed) {
			void vscode.window.showInformationMessage("Git push cancelled.");
			return;
		}

		ctx.terminal.run("git push");
	},
};

/**
 * Git Commit Command (interactive)
 * Opens git commit in editor mode
 */
const gitCommitCommand: VoiceCommand = {
	id: "git-commit",
	triggers: ["git commit", "commit changes", "create commit"],
	description: "Open git commit (editor mode)",
	category: "git",
	execute: (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}
		// This opens the default editor for commit message
		ctx.terminal.run("git commit");
	},
};

/**
 * Git Commit with Message Command
 * Commits with a spoken message after confirmation
 */
const gitCommitMessageCommand: VoiceCommand = {
	id: "git-commit-message",
	triggers: ["git commit message *", "commit message *", "commit with message *"],
	description: "Commit with a spoken message",
	category: "git",
	execute: async (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}

		const message = ctx.args?.wildcards?.[0];
		if (!message || message.trim().length === 0) {
			showWarning("Please provide a commit message. Say: 'git commit message <your message>'");
			return;
		}

		const trimmedMessage = message.trim();

		// Confirm before committing
		const confirmed = await confirmGitCommit(trimmedMessage);
		if (!confirmed) {
			void vscode.window.showInformationMessage("Git commit cancelled.");
			return;
		}

		// Escape the message for safe shell execution
		const escapedMessage = escapeDoubleQuotes(trimmedMessage);
		ctx.terminal.run(`git commit -m "${escapedMessage}"`);
	},
};

/**
 * Git Push Force Blocker
 * Explicitly blocks force push commands
 */
const gitPushForceBlocker: VoiceCommand = {
	id: "git-push-force-blocked",
	triggers: ["git push force", "git force push", "force push", "git push dash f", "git push -f"],
	description: "Force push (blocked for safety)",
	category: "git",
	execute: () => {
		showError(
			"Force push is blocked for safety. If you really need to force push, " +
				"please use the terminal directly.",
		);
	},
};

/**
 * Git Add All Command
 * Stages all changes
 */
const gitAddAllCommand: VoiceCommand = {
	id: "git-add-all",
	triggers: ["git add all", "stage all", "add all changes", "stage all changes"],
	description: "Stage all changes (git add .)",
	category: "git",
	execute: (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}
		ctx.terminal.run("git add .");
	},
};

/**
 * Git Diff Command
 * Shows unstaged changes
 */
const gitDiffCommand: VoiceCommand = {
	id: "git-diff",
	triggers: ["git diff", "show diff", "show differences", "what changed"],
	description: "Show unstaged changes",
	category: "git",
	execute: (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}
		ctx.terminal.run("git diff");
	},
};

/**
 * Git Log Command
 * Shows recent commit history
 */
const gitLogCommand: VoiceCommand = {
	id: "git-log",
	triggers: ["git log", "show git log", "show commits", "commit history"],
	description: "Show recent commit history",
	category: "git",
	execute: (ctx?: ExecutionContext) => {
		if (!ctx?.terminal) {
			showError("Terminal helper not available");
			return;
		}
		// Show last 10 commits in a nice format
		ctx.terminal.run("git log --oneline -10");
	},
};

/**
 * All git commands exported as an array for easy registration
 */
export const gitCommands: VoiceCommand[] = [
	gitStatusCommand,
	gitPullCommand,
	gitPushCommand,
	gitCommitCommand,
	gitCommitMessageCommand,
	gitPushForceBlocker,
	gitAddAllCommand,
	gitDiffCommand,
	gitLogCommand,
];

// Also export individually for direct access if needed
export {
	gitStatusCommand,
	gitPullCommand,
	gitPushCommand,
	gitCommitCommand,
	gitCommitMessageCommand,
	gitPushForceBlocker,
	gitAddAllCommand,
	gitDiffCommand,
	gitLogCommand,
};
