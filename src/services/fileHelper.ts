/**
 * File Helper
 * Provides file picker utilities and active file access
 */

import * as vscode from "vscode";
import { FileHelper } from "@commands/types";

/**
 * Singleton class that provides file operations
 */
class FileHelperImpl implements FileHelper {
	private static instance: FileHelperImpl;

	private constructor() {}

	/**
	 * Get the singleton instance
	 */
	static getInstance(): FileHelperImpl {
		if (!FileHelperImpl.instance) {
			FileHelperImpl.instance = new FileHelperImpl();
		}
		return FileHelperImpl.instance;
	}

	/**
	 * Show a file picker dialog and return the selected file path
	 * @param options Options for the file picker
	 * @returns The selected file path or undefined if cancelled
	 */
	async pickFile(options: { title?: string } = {}): Promise<string | undefined> {
		const { title = "Select a file" } = options;

		// Get the workspace folders
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			void vscode.window.showWarningMessage("No workspace folder is open");
			return undefined;
		}

		// Use the first workspace folder as default
		const defaultUri = workspaceFolders[0].uri;

		// Show open dialog
		const result = await vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: false,
			openLabel: "Select",
			title,
			defaultUri,
		});

		if (!result || result.length === 0) {
			return undefined;
		}

		// Return the file path
		return result[0].fsPath;
	}

	/**
	 * Get the path of the currently active file in the editor
	 * @returns The file path or undefined if no file is active
	 */
	getActiveFilePath(): string | undefined {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return undefined;
		}

		return activeEditor.document.uri.fsPath;
	}
}

// Singleton instance
let fileHelperInstance: FileHelperImpl | null = null;

/**
 * Get the file helper singleton instance
 */
export function getFileHelper(): FileHelper {
	if (!fileHelperInstance) {
		fileHelperInstance = FileHelperImpl.getInstance();
	}
	return fileHelperInstance;
}
