/**
 * Editor Commands
 * Basic voice commands for common VS Code editor actions
 */

import * as vscode from "vscode";
import { VoiceCommand } from "./types";

/**
 * Save All Files Command
 * Saves all open files in the workspace
 */
const saveAllCommand: VoiceCommand = {
	id: "save-all",
	triggers: ["save all", "save everything", "save all files", "save files"],
	description: "Save all open files",
	category: "editor",
	execute: async () => {
		await vscode.commands.executeCommand("workbench.action.files.saveAll");
	},
};

/**
 * Format Document Command
 * Formats the current document using the configured formatter
 */
const formatDocumentCommand: VoiceCommand = {
	id: "format-document",
	triggers: ["format document", "format file", "format code", "format this", "format"],
	description: "Format the current document",
	category: "editor",
	execute: async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error("No active editor to format");
		}
		await vscode.commands.executeCommand("editor.action.formatDocument");
	},
};

/**
 * New Terminal Command
 * Opens a new integrated terminal
 */
const newTerminalCommand: VoiceCommand = {
	id: "new-terminal",
	triggers: ["new terminal", "open terminal", "create terminal", "terminal"],
	description: "Open a new terminal",
	category: "terminal",
	execute: async () => {
		await vscode.commands.executeCommand("workbench.action.terminal.new");
	},
};

/**
 * Git Status Command
 * Shows the git status/source control view
 */
const gitStatusCommand: VoiceCommand = {
	id: "git-status",
	triggers: ["git status", "show git status", "source control", "show changes"],
	description: "Show git status",
	category: "git",
	execute: async () => {
		await vscode.commands.executeCommand("workbench.view.scm");
	},
};

/**
 * Close Editor Command
 * Closes the currently active editor tab
 */
const closeEditorCommand: VoiceCommand = {
	id: "close-editor",
	triggers: ["close editor", "close file", "close tab", "close this"],
	description: "Close the current editor",
	category: "editor",
	execute: async () => {
		await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
	},
};

/**
 * All editor commands exported as an array for easy registration
 */
export const editorCommands: VoiceCommand[] = [
	saveAllCommand,
	formatDocumentCommand,
	newTerminalCommand,
	gitStatusCommand,
	closeEditorCommand,
];

// Also export individually for direct access if needed
export { saveAllCommand, formatDocumentCommand, newTerminalCommand, gitStatusCommand, closeEditorCommand };
