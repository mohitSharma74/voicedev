import * as vscode from "vscode";

/**
 * Intelligently inserts transcribed text into the active editor or sends it to the active terminal.
 * Priority: Editor first, then terminal, then error if neither is available.
 *
 * @param text The transcribed text to insert or send
 * @throws Error if text is empty after trimming
 * @throws Error if neither editor nor terminal is active
 * @throws Error if editor is read-only
 */
export async function insertOrSendText(text: string): Promise<void> {
	// Trim whitespace from transcription
	const trimmedText = text.trim();

	// Validate not empty
	if (trimmedText.length === 0) {
		throw new Error("Transcription was empty. Nothing to insert.");
	}

	// Check context priority: editor first, then terminal
	const editor = vscode.window.activeTextEditor;
	const terminal = vscode.window.activeTerminal;

	if (editor) {
		// Editor is active - insert text into editor
		await insertTranscribedText(trimmedText, editor);
	} else if (terminal) {
		// No editor but terminal is active - send to terminal
		sendToTerminal(trimmedText, terminal);
	} else {
		// Neither editor nor terminal is active
		throw new Error("No active editor or terminal. Open a file or terminal to insert transcription.");
	}
}

/**
 * Inserts transcribed text into the active text editor.
 * - Replaces selected text if a selection exists
 * - Inserts at cursor position if no selection
 * - Moves cursor to end of inserted text
 *
 * @param text The transcribed text to insert (should already be trimmed)
 * @param editor The active text editor
 * @throws Error if editor is read-only
 */
export async function insertTranscribedText(text: string, editor: vscode.TextEditor): Promise<void> {
	// Get current selection (or cursor position if no selection)
	const selection = editor.selection;

	// Perform the edit operation
	const success = await editor.edit((editBuilder) => {
		if (selection.isEmpty) {
			// No selection: insert at cursor position
			editBuilder.insert(selection.active, text);
		} else {
			// Selection exists: replace it
			editBuilder.replace(selection, text);
		}
	});

	// Check if edit was successful (fails for read-only files)
	if (!success) {
		throw new Error("Cannot insert text in read-only file.");
	}

	// Calculate end position after insertion
	const startPos = selection.isEmpty ? selection.active : selection.start;
	const endPos = calculateEndPosition(startPos, text);

	// Move cursor to end of inserted text
	editor.selection = new vscode.Selection(endPos, endPos);
}

/**
 * Sends transcribed text to the active integrated terminal.
 * - Text is sent without auto-execution (no Enter key pressed)
 * - Terminal is made visible after sending text
 *
 * @param text The transcribed text to send (should already be trimmed)
 * @param terminal The active terminal
 * @throws Error if terminal is disposed or unavailable
 */
export function sendToTerminal(text: string, terminal: vscode.Terminal): void {
	// Check if terminal is still available (might be disposed)
	// Note: VS Code doesn't provide a direct way to check if terminal is disposed,
	// but sendText will fail gracefully if it is
	try {
		// Send text to terminal without auto-execution (false = no Enter key)
		terminal.sendText(text, false);

		// Make terminal visible
		terminal.show(false); // false = take focus
	} catch (error) {
		throw new Error(
			"Terminal is no longer available. " + (error instanceof Error ? error.message : "Unknown error"),
		);
	}
}

/**
 * Calculates the end position after inserting text at a given position.
 * Handles both single-line and multi-line text correctly.
 *
 * @param startPos The starting position where text was inserted
 * @param text The text that was inserted
 * @returns The position at the end of the inserted text
 */
export function calculateEndPosition(startPos: vscode.Position, text: string): vscode.Position {
	const lines = text.split("\n");

	if (lines.length === 1) {
		// Single line: same line, offset character by text length
		return startPos.translate(0, text.length);
	} else {
		// Multi-line: move to last line, character position is length of last line
		const lastLine = lines[lines.length - 1];
		return new vscode.Position(startPos.line + lines.length - 1, lastLine.length);
	}
}
