/**
 * Copilot Commands
 * Voice commands for GitHub Copilot CLI and Chat integration
 */

import * as vscode from "vscode";
import { VoiceCommand, ExecutionContext } from "./types";
import { requireCopilot, getCopilotCliCommand } from "@services/copilotDetection";
import { getNotificationService } from "@ui/notificationService";

/**
 * Build a Copilot CLI prompt command.
 * For terminal execution, we avoid shell-specific quoting/fallback logic
 * and rely on the terminal's native handling.
 */
export function buildCopilotPromptCommand(prompt: string): string {
	const cli = getCopilotCliCommand();
	// Use -p flag for one-shot prompts
	// Escape backslashes first, then double quotes to prevent injection
	const escaped = prompt.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	return `${cli} -p "${escaped}"`;
}

/**
 * Show a warning message to the user
 */
function showWarning(message: string): void {
	void getNotificationService().showWarning(message);
}

const CHAT_DIRECT_PROMPT_COMMANDS = ["workbench.action.chat.open", "workbench.action.openChat.open"];
const CHAT_OPEN_COMMANDS = [
	"workbench.action.chat.open",
	"workbench.action.openChat.open",
	"workbench.panel.chat.view.copilot.focus",
	"workbench.panel.chat.view.edits.focus",
	"github.copilot.chat.open",
];
const CHAT_PASTE_COMMANDS = [
	"editor.action.clipboardPasteAction",
	"editor.action.clipboardPasteActionWithoutFormatting",
];
const CHAT_SUBMIT_COMMANDS = ["workbench.action.chat.submit", "workbench.action.chat.send"];

async function getAvailableCommands(): Promise<Set<string>> {
	try {
		const commands = await vscode.commands.getCommands(true);
		return new Set(commands);
	} catch {
		return new Set();
	}
}

async function executeFirstAvailableCommand(
	available: Set<string>,
	commandIds: string[],
	args: unknown[] = [],
): Promise<boolean> {
	const shouldFilter = available.size > 0;
	for (const commandId of commandIds) {
		if (shouldFilter && !available.has(commandId)) {
			continue;
		}
		try {
			await vscode.commands.executeCommand(commandId, ...args);
			return true;
		} catch {
			// Try next command ID.
		}
	}
	return false;
}

/**
 * Open GitHub Copilot Chat and send a message
 * Uses command discovery and fallback IDs to stay compatible across VS Code versions.
 */
async function openCopilotChat(message: string): Promise<void> {
	const availableCommands = await getAvailableCommands();

	const promptVariants: unknown[][] = [
		[message],
		[{ query: message }],
		[{ prompt: message }],
		[{ initialQuery: message }],
		[{ message }],
	];

	try {
		for (const args of promptVariants) {
			const sentWithPromptArgs = await executeFirstAvailableCommand(
				availableCommands,
				CHAT_DIRECT_PROMPT_COMMANDS,
				args,
			);
			if (sentWithPromptArgs) {
				return;
			}
		}
	} catch {
		// Continue to open/paste fallback flow.
	}

	const opened = await executeFirstAvailableCommand(availableCommands, CHAT_OPEN_COMMANDS);
	if (!opened) {
		await getNotificationService().showError(
			"Could not open Copilot Chat automatically. Please open it manually and paste your question.",
			[
				{
					title: "Copy to Clipboard",
					action: async () => {
						await vscode.env.clipboard.writeText(message);
					},
				},
			],
		);
		return;
	}

	await new Promise((resolve) => setTimeout(resolve, 350));
	await vscode.env.clipboard.writeText(message);

	const pasted = await executeFirstAvailableCommand(availableCommands, CHAT_PASTE_COMMANDS);
	if (!pasted) {
		await getNotificationService().showInfo("Copilot Chat opened. Prompt copied to clipboard, please paste it.");
		return;
	}

	const submitted = await executeFirstAvailableCommand(availableCommands, CHAT_SUBMIT_COMMANDS);
	if (!submitted) {
		await getNotificationService().showInfo("Copilot Chat opened. Prompt pasted in chat input.");
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

			ctx?.terminal.run(buildCopilotPromptCommand(`Explain: ${query}`));
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

			ctx?.terminal.run(buildCopilotPromptCommand(`Explain the code in file: ${filePath}`));
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
				buildCopilotPromptCommand(
					"Write one conventional commit message for the current staged and unstaged git changes.",
				),
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

			ctx?.terminal.run(buildCopilotPromptCommand(`Suggest shell commands for: ${query}`));
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
			const availableCommands = await getAvailableCommands();
			const opened = await executeFirstAvailableCommand(availableCommands, CHAT_OPEN_COMMANDS);
			if (!opened) {
				await getNotificationService().showWarning(
					"Could not find a Copilot Chat command in this VS Code build.",
				);
			}
		},
	},
];
