/**
 * System Commands
 * Voice commands for VoiceDev system functions
 */

import * as vscode from "vscode";
import { VoiceCommand } from "./types";
import { showShortcuts } from "@ui/shortcutHints";

/**
 * List Commands Command
 * Opens Command Center with all available voice commands
 */
const listCommandsCommand: VoiceCommand = {
	id: "list-commands",
	triggers: ["list commands", "show commands", "what commands", "help", "available commands", "voice commands"],
	description: "Show all available voice commands",
	category: "system",
	shortcut: "Ctrl+Shift+L",
	execute: async () => {
		await vscode.commands.executeCommand("voicedev.openCommandCenter");
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
