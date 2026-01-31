/**
 * Navigation Commands
 * Voice commands for navigating within the editor
 */

import * as vscode from "vscode";
import { VoiceCommand, ExecutionContext } from "./types";
import { getNotificationService } from "@ui/notificationService";

/**
 * Show a warning message to the user
 */
function showWarning(message: string): void {
	void getNotificationService().showWarning(message);
}

/**
 * Show an error message to the user
 */
function showError(message: string): void {
	void getNotificationService().showError(message);
}

/**
 * Parse a line number from spoken text
 * Handles: "42", "one hundred", "fifty five", etc.
 * @param text The spoken text containing a number
 * @returns The parsed line number or null if parsing fails
 */
function parseLineNumber(text: string): number | null {
	// First, try direct numeric parsing
	const directNumber = parseInt(text, 10);
	if (!isNaN(directNumber) && directNumber > 0) {
		return directNumber;
	}

	// Handle common spoken number patterns
	const normalized = text.toLowerCase().trim();

	// Map of spoken numbers to values
	const wordNumbers: Record<string, number> = {
		zero: 0,
		one: 1,
		two: 2,
		three: 3,
		four: 4,
		five: 5,
		six: 6,
		seven: 7,
		eight: 8,
		nine: 9,
		ten: 10,
		eleven: 11,
		twelve: 12,
		thirteen: 13,
		fourteen: 14,
		fifteen: 15,
		sixteen: 16,
		seventeen: 17,
		eighteen: 18,
		nineteen: 19,
		twenty: 20,
		thirty: 30,
		forty: 40,
		fifty: 50,
		sixty: 60,
		seventy: 70,
		eighty: 80,
		ninety: 90,
		hundred: 100,
		thousand: 1000,
	};

	// Simple word to number (for single words like "ten", "twenty")
	if (wordNumbers[normalized] !== undefined) {
		return wordNumbers[normalized];
	}

	// Handle compound numbers like "twenty five" or "one hundred"
	const words = normalized.split(/[\s-]+/);
	let result = 0;
	let current = 0;

	for (const word of words) {
		const value = wordNumbers[word];
		if (value === undefined) {
			// Try extracting digits from mixed content like "line50"
			const extracted = word.match(/\d+/);
			if (extracted) {
				return parseInt(extracted[0], 10);
			}
			continue; // Skip unknown words
		}

		if (value === 100) {
			current = current === 0 ? 100 : current * 100;
		} else if (value === 1000) {
			current = current === 0 ? 1000 : current * 1000;
			result += current;
			current = 0;
		} else if (value >= 20 && value <= 90) {
			current += value;
		} else {
			current += value;
		}
	}

	result += current;
	return result > 0 ? result : null;
}

/**
 * Open File Command
 * Opens VS Code Quick Open (Ctrl+P) pre-filled with the spoken text
 */
const openFileCommand: VoiceCommand = {
	id: "open-file",
	triggers: ["open file *", "open *", "go to file *", "find file *"],
	description: "Open file using Quick Open picker",
	category: "navigation",
	execute: async (ctx?: ExecutionContext) => {
		const searchText = ctx?.args?.wildcards?.[0]?.trim();

		if (!searchText) {
			// Just open Quick Open without pre-filled text
			await vscode.commands.executeCommand("workbench.action.quickOpen");
			return;
		}

		// Open Quick Open and pre-fill with the search text
		await vscode.commands.executeCommand("workbench.action.quickOpen", searchText);
	},
};

/**
 * Go to Line Command
 * Navigates to a specific line number in the active editor
 */
const goToLineCommand: VoiceCommand = {
	id: "go-to-line",
	triggers: ["go to line *", "jump to line *", "line *", "go line *"],
	description: "Navigate to a specific line number",
	category: "navigation",
	execute: async (ctx?: ExecutionContext) => {
		const lineArg = ctx?.args?.wildcards?.[0]?.trim();

		if (!lineArg) {
			// Open the "Go to Line" dialog
			await vscode.commands.executeCommand("workbench.action.gotoLine");
			return;
		}

		// Parse line number - handle spoken numbers like "twenty five"
		const lineNumber = parseLineNumber(lineArg);

		if (lineNumber === null || lineNumber < 1) {
			showWarning(`Could not parse line number from: "${lineArg}". Please say a number.`);
			// Fall back to opening the dialog
			await vscode.commands.executeCommand("workbench.action.gotoLine");
			return;
		}

		// Check for active editor
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			showError("No active editor. Please open a file first.");
			return;
		}

		// Validate line number is within document bounds
		const maxLines = editor.document.lineCount;
		const targetLine = Math.min(lineNumber, maxLines);

		if (lineNumber > maxLines) {
			showWarning(`Line ${lineNumber} exceeds document length (${maxLines} lines). Going to last line.`);
		}

		// Navigate to the line (VS Code lines are 0-indexed internally)
		const position = new vscode.Position(targetLine - 1, 0);
		const selection = new vscode.Selection(position, position);

		editor.selection = selection;
		editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);

		getNotificationService().showJumpedToLine(targetLine);
	},
};

/**
 * Go to Symbol Command
 * Opens the symbol picker in the current file
 */
const goToSymbolCommand: VoiceCommand = {
	id: "go-to-symbol",
	triggers: ["go to symbol", "find symbol", "jump to symbol", "go to definition"],
	description: "Open symbol picker in current file",
	category: "navigation",
	execute: async () => {
		await vscode.commands.executeCommand("workbench.action.gotoSymbol");
	},
};

/**
 * Go to Top Command
 * Goes to the beginning of the file
 */
const goToTopCommand: VoiceCommand = {
	id: "go-to-top",
	triggers: ["go to top", "go to start", "go to beginning", "jump to top"],
	description: "Go to the beginning of the file",
	category: "navigation",
	execute: () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			showError("No active editor. Please open a file first.");
			return;
		}

		const position = new vscode.Position(0, 0);
		editor.selection = new vscode.Selection(position, position);
		editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
	},
};

/**
 * Go to Bottom Command
 * Goes to the end of the file
 */
const goToBottomCommand: VoiceCommand = {
	id: "go-to-bottom",
	triggers: ["go to bottom", "go to end", "jump to bottom", "jump to end"],
	description: "Go to the end of the file",
	category: "navigation",
	execute: () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			showError("No active editor. Please open a file first.");
			return;
		}

		const lastLine = editor.document.lineCount - 1;
		const lastChar = editor.document.lineAt(lastLine).text.length;
		const position = new vscode.Position(lastLine, lastChar);

		editor.selection = new vscode.Selection(position, position);
		editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
	},
};

/**
 * All navigation commands exported as an array
 */
export const navigationCommands: VoiceCommand[] = [
	openFileCommand,
	goToLineCommand,
	goToSymbolCommand,
	goToTopCommand,
	goToBottomCommand,
];

// Export individually
export {
	openFileCommand,
	goToLineCommand,
	goToSymbolCommand,
	goToTopCommand,
	goToBottomCommand,
	parseLineNumber, // Export for testing
};
