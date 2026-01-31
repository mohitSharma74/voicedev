/**
 * Copilot Commands
 * Voice commands for GitHub Copilot CLI and Chat integration
 */

import * as vscode from "vscode";
import { VoiceCommand, ExecutionContext } from "./types";
import { requireCopilot, getCopilotCliCommand } from "@services/copilotDetection";
import { getNotificationService } from "@ui/notificationService";

/**
 * Escape quotes in a string for safe shell usage
 */
function escapeQuotes(str: string): string {
	return str.replace(/"/g, '\\"');
}

/**
 * Show a warning message to the user
 */
function showWarning(message: string): void {
	void getNotificationService().showWarning(message);
}

/**
 * Open GitHub Copilot Chat and send a message
 * Uses VS Code's command palette to interact with Copilot Chat
 */
async function openCopilotChat(message: string): Promise<void> {
	try {
		// Try to open the Copilot Chat view using the workbench chat command
		// This command opens the chat view and focuses the input
		await vscode.commands.executeCommand("workbench.action.openChat.open");

		// Wait a bit for the chat view to open
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Copy the message to clipboard
		await vscode.env.clipboard.writeText(message);

		// Paste the message into the chat input
		await vscode.commands.executeCommand("editor.action.clipboardPasteAction");

		// Press Enter to send
		await vscode.commands.executeCommand("workbench.action.chat.submit");
	} catch {
		// Fallback: try alternative command IDs
		try {
			// Try the GitHub Copilot specific command
			await vscode.commands.executeCommand("github.copilot.chat.open");
			await new Promise((resolve) => setTimeout(resolve, 500));
			await vscode.env.clipboard.writeText(message);
			await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
		} catch {
			// If all else fails, show an error with instructions
			await getNotificationService().showError(
				"Could not open Copilot Chat automatically. Please open it manually and paste your question.",
				[
					{
						title: "Open Copilot Chat",
						action: () => vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus"),
					},
					{
						title: "Copy to Clipboard",
						action: async () => {
							await vscode.env.clipboard.writeText(message);
							await getNotificationService().showInfo(
								"Question copied to clipboard. Paste it into Copilot Chat.",
							);
						},
					},
				],
			);
		}
	}
}

/**
 * GitHub Copilot voice commands (Terminal-based)
 */
export const copilotCommands: VoiceCommand[] = [
	{
		id: "copilot-explain",
		triggers: ["ask copilot explain *", "copilot explain *"],
		description: "Ask GitHub Copilot to explain something",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			if (!(await requireCopilot())) {
				return;
			}

			const query = ctx?.args?.wildcards?.[0];
			if (!query) {
				showWarning("Please specify what to explain");
				return;
			}

			ctx?.terminal.run(`${getCopilotCliCommand()} copilot explain "${escapeQuotes(query)}"`);
		},
	},

	{
		id: "copilot-explain-file",
		triggers: ["ask copilot explain file", "copilot explain this file"],
		description: "Ask Copilot to explain a file",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			if (!(await requireCopilot())) {
				return;
			}

			const filePath = await ctx?.files.pickFile({ title: "Select file to explain" });
			if (!filePath) {
				return;
			}

			ctx?.terminal.run(`${getCopilotCliCommand()} copilot explain "Explain the code in ${filePath}"`);
		},
	},

	{
		id: "copilot-commit",
		triggers: ["copilot commit", "ask copilot write commit message"],
		description: "Ask Copilot to suggest a commit message",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			if (!(await requireCopilot())) {
				return;
			}

			ctx?.terminal.run(
				`${getCopilotCliCommand()} copilot suggest "Write a git commit message for the current changes"`,
			);
		},
	},

	{
		id: "copilot-suggest",
		triggers: ["ask copilot how to *", "copilot suggest *"],
		description: "Ask Copilot to suggest a shell command",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			if (!(await requireCopilot())) {
				return;
			}

			const query = ctx?.args?.wildcards?.[0];
			if (!query) {
				showWarning("Please specify what you need help with");
				return;
			}

			ctx?.terminal.run(`${getCopilotCliCommand()} copilot suggest "${escapeQuotes(query)}"`);
		},
	},
];

/**
 * GitHub Copilot Chat voice commands (Chat panel-based)
 */
export const copilotChatCommands: VoiceCommand[] = [
	{
		id: "copilot-chat-explain",
		triggers: ["ask copilot in chat explain *", "copilot chat explain *"],
		description: "Ask GitHub Copilot Chat to explain something",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			const query = ctx?.args?.wildcards?.[0];
			if (!query) {
				showWarning("Please specify what to explain");
				return;
			}

			await openCopilotChat(`Explain: ${query}`);
		},
	},

	{
		id: "copilot-chat-explain-file",
		triggers: ["ask copilot in chat explain file", "copilot chat explain this file"],
		description: "Ask Copilot Chat to explain a file",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			const filePath = await ctx?.files.pickFile({ title: "Select file to explain" });
			if (!filePath) {
				return;
			}

			await openCopilotChat(`Explain the code in ${filePath}`);
		},
	},

	{
		id: "copilot-chat-help",
		triggers: ["ask copilot in chat *", "copilot chat *"],
		description: "Ask Copilot Chat a question",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			const query = ctx?.args?.wildcards?.[0];
			if (!query) {
				showWarning("Please specify what you want to ask");
				return;
			}

			await openCopilotChat(query);
		},
	},

	{
		id: "copilot-chat-suggest",
		triggers: ["ask copilot in chat how to *", "copilot chat suggest *"],
		description: "Ask Copilot Chat to suggest how to do something",
		category: "terminal",
		requiresCopilot: true,
		execute: async (ctx?: ExecutionContext) => {
			const query = ctx?.args?.wildcards?.[0];
			if (!query) {
				showWarning("Please specify what you need help with");
				return;
			}

			await openCopilotChat(`How do I ${query}?`);
		},
	},

	{
		id: "copilot-chat-open",
		triggers: ["open copilot chat", "show copilot chat"],
		description: "Open GitHub Copilot Chat panel",
		category: "terminal",
		requiresCopilot: false,
		execute: async () => {
			try {
				await vscode.commands.executeCommand("workbench.action.openChat.open");
			} catch {
				try {
					await vscode.commands.executeCommand("github.copilot.chat.open");
				} catch {
					await vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus");
				}
			}
		},
	},
];
