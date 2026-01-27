/**
 * Terminal Helper
 * Manages a dedicated "VoiceDev" terminal for running commands
 */

import * as vscode from "vscode";
import { TerminalHelper } from "@commands/types";

const TERMINAL_NAME = "VoiceDev";

/**
 * Singleton class that manages the VoiceDev terminal
 */
class TerminalHelperImpl implements TerminalHelper {
	private static instance: TerminalHelperImpl;
	private terminal: vscode.Terminal | null = null;

	private constructor() {}

	/**
	 * Get the singleton instance
	 */
	static getInstance(): TerminalHelperImpl {
		if (!TerminalHelperImpl.instance) {
			TerminalHelperImpl.instance = new TerminalHelperImpl();
		}
		return TerminalHelperImpl.instance;
	}

	/**
	 * Get existing VoiceDev terminal or create a new one
	 */
	private getOrCreateTerminal(): vscode.Terminal {
		// Check if terminal exists and is not disposed
		if (this.terminal) {
			try {
				// Try to access the terminal to check if it's disposed
				// If disposed, this will throw or we can check the exit status
				const state = this.terminal.state;
				if (state) {
					return this.terminal;
				}
			} catch {
				// Terminal is disposed, create new one
				this.terminal = null;
			}
		}

		// Look for existing VoiceDev terminal
		const existingTerminal = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
		if (existingTerminal) {
			this.terminal = existingTerminal;
			return this.terminal;
		}

		// Create new terminal
		this.terminal = vscode.window.createTerminal({
			name: TERMINAL_NAME,
			hideFromUser: false,
		});

		return this.terminal;
	}

	/**
	 * Run a command in the VoiceDev terminal
	 * @param command The command to run
	 * @param options Options for execution
	 */
	run(command: string, options: { name?: string; execute?: boolean; focus?: boolean } = {}): void {
		const { execute = true, focus = true } = options;

		const terminal = this.getOrCreateTerminal();

		// Focus the terminal so user can see output
		if (focus) {
			terminal.show();
		}

		// Send the command
		terminal.sendText(command, execute);
	}

	/**
	 * Dispose the terminal (for cleanup)
	 */
	dispose(): void {
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
		}
	}
}

// Singleton instance
let terminalHelperInstance: TerminalHelperImpl | null = null;

/**
 * Get the terminal helper singleton instance
 */
export function getTerminalHelper(): TerminalHelper {
	if (!terminalHelperInstance) {
		terminalHelperInstance = TerminalHelperImpl.getInstance();
	}
	return terminalHelperInstance;
}

/**
 * Dispose the terminal helper (for extension deactivation)
 */
export function disposeTerminalHelper(): void {
	if (terminalHelperInstance) {
		terminalHelperInstance.dispose();
		terminalHelperInstance = null;
	}
}
