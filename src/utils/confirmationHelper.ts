/**
 * Confirmation Helper
 * Provides confirmation dialogs for dangerous operations
 */

import * as vscode from "vscode";

export interface ConfirmationOptions {
	/** Title for the confirmation dialog */
	title: string;
	/** Detailed message explaining the action */
	message: string;
	/** Label for the confirm button (default: "Yes") */
	confirmLabel?: string;
	/** Label for the cancel button (default: "Cancel") */
	cancelLabel?: string;
	/** Show a warning modal instead of quick pick */
	useWarningModal?: boolean;
}

/**
 * Show a confirmation dialog and return true if user confirms
 * @param options Configuration for the confirmation dialog
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export async function showConfirmation(options: ConfirmationOptions): Promise<boolean> {
	const { title, message, confirmLabel = "Yes", cancelLabel = "Cancel", useWarningModal = false } = options;

	if (useWarningModal) {
		// Use warning message with buttons for dangerous operations
		const result = await vscode.window.showWarningMessage(
			`${title}\n\n${message}`,
			{ modal: true },
			confirmLabel,
			cancelLabel,
		);
		return result === confirmLabel;
	}

	// Use quick pick for standard confirmations
	const items: vscode.QuickPickItem[] = [
		{ label: `$(check) ${confirmLabel}`, description: "Proceed with the action" },
		{ label: `$(x) ${cancelLabel}`, description: "Cancel the operation" },
	];

	const selection = await vscode.window.showQuickPick(items, {
		title,
		placeHolder: message,
	});

	return selection?.label.includes(confirmLabel) ?? false;
}

/**
 * Shorthand for git push confirmation
 */
export async function confirmGitPush(): Promise<boolean> {
	return showConfirmation({
		title: "Confirm Git Push",
		message: "Are you sure you want to push commits to the remote repository?",
		confirmLabel: "Push",
		cancelLabel: "Cancel",
	});
}

/**
 * Shorthand for git commit with message confirmation
 */
export async function confirmGitCommit(message: string): Promise<boolean> {
	const preview = message.length > 60 ? `${message.substring(0, 60)}...` : message;
	return showConfirmation({
		title: "Confirm Git Commit",
		message: `Commit with message: "${preview}"`,
		confirmLabel: "Commit",
		cancelLabel: "Cancel",
	});
}
