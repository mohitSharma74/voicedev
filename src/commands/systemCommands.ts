/**
 * System Commands
 * Voice commands for VoiceDev system functions
 */

import * as vscode from "vscode";
import { VoiceCommand, CommandCategory } from "./types";
import { getCommandRegistry } from "./registry";
import { getNotificationService } from "@ui/notificationService";
import { showShortcuts } from "@ui/shortcutHints";

/**
 * Format commands for display in the quick pick
 */
function formatCommandList(): vscode.QuickPickItem[] {
	const registry = getCommandRegistry();
	const commands = registry.getAll();

	// Group commands by category
	const byCategory = new Map<CommandCategory, VoiceCommand[]>();

	for (const cmd of commands) {
		// Skip the list-commands command itself
		if (cmd.id === "list-commands") {
			continue;
		}

		if (!byCategory.has(cmd.category)) {
			byCategory.set(cmd.category, []);
		}
		byCategory.get(cmd.category)!.push(cmd);
	}

	const items: vscode.QuickPickItem[] = [];

	// Category display names and icons
	const categoryInfo: Record<CommandCategory, { label: string; icon: string }> = {
		editor: { label: "Editor", icon: "$(edit)" },
		git: { label: "Git", icon: "$(git-branch)" },
		terminal: { label: "Terminal", icon: "$(terminal)" },
		navigation: { label: "Navigation", icon: "$(compass)" },
		system: { label: "System", icon: "$(gear)" },
	};

	// Sort categories
	const categoryOrder: CommandCategory[] = ["editor", "git", "terminal", "navigation", "system"];

	for (const category of categoryOrder) {
		const cmds = byCategory.get(category);
		if (!cmds || cmds.length === 0) {
			continue;
		}

		const info = categoryInfo[category];

		// Add category separator
		items.push({
			label: `${info.icon} ${info.label}`,
			kind: vscode.QuickPickItemKind.Separator,
		});

		// Add commands in this category
		for (const cmd of cmds) {
			const triggerPreview = cmd.triggers
				.slice(0, 3)
				.map((t) => `"${t}"`)
				.join(", ");
			const extraTriggers = cmd.triggers.length > 3 ? `+${cmd.triggers.length - 3} more triggers` : undefined;
			const shortcutHint = cmd.shortcut ? `Shortcut: ${cmd.shortcut}` : undefined;
			const detail = [shortcutHint, extraTriggers].filter(Boolean).join(" | ");

			items.push({
				label: cmd.description,
				description: triggerPreview,
				detail: detail || undefined,
			});
		}
	}

	return items;
}

/**
 * List Commands Command
 * Shows all available voice commands in a quick pick
 */
const listCommandsCommand: VoiceCommand = {
	id: "list-commands",
	triggers: ["list commands", "show commands", "what commands", "help", "available commands", "voice commands"],
	description: "Show all available voice commands",
	category: "system",
	shortcut: "Ctrl+Shift+L",
	execute: async () => {
		const items = formatCommandList();

		if (items.length === 0) {
			void getNotificationService().showInfo("No voice commands registered yet.");
			return;
		}

		const selected = await vscode.window.showQuickPick(items, {
			title: "VoiceDev - Available Voice Commands",
			placeHolder: "Voice commands you can use...",
			matchOnDescription: true,
		});

		// If user selected a command, we could execute it
		// For now, just showing the list is enough
		if (selected && selected.kind !== vscode.QuickPickItemKind.Separator) {
			// Find the command by description and execute it
			const registry = getCommandRegistry();
			const command = registry.getAll().find((cmd) => cmd.description === selected.label);
			if (command) {
				await command.execute();
			}
		}
	},
};

/**
 * Open Command Center Command
 * Opens the Command Center webview panel
 */
const openCommandCenterCommand: VoiceCommand = {
	id: "open-command-center",
	triggers: ["open command center", "show command center", "command reference", "voice command help"],
	description: "Open the Command Center panel",
	category: "system",
	execute: async () => {
		await vscode.commands.executeCommand("voicedev.openCommandCenter");
	},
};

/**
 * Show Keyboard Shortcuts Command
 */
const showShortcutsCommand: VoiceCommand = {
	id: "show-shortcuts",
	triggers: ["show shortcuts", "keyboard shortcuts", "show keys"],
	description: "Show keyboard shortcuts",
	category: "system",
	execute: async () => {
		await showShortcuts();
	},
};

/**
 * All system commands exported as an array
 */
export const systemCommands: VoiceCommand[] = [listCommandsCommand, openCommandCenterCommand, showShortcutsCommand];

export { listCommandsCommand, openCommandCenterCommand, showShortcutsCommand };
