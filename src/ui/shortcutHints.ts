import * as vscode from "vscode";
export interface ShortcutHint {
	key: string;
	action: string;
}

const SHORTCUTS: ShortcutHint[] = [
	{ key: "Ctrl+Shift+V", action: "Toggle recording" },
	{ key: "Ctrl+Shift+L", action: "List voice commands" },
	{ key: "Cmd+Shift+V", action: "Toggle recording (Mac)" },
	{ key: "Cmd+Shift+L", action: "List voice commands (Mac)" },
];

export async function showShortcuts(): Promise<void> {
	const items = SHORTCUTS.map((shortcut) => ({
		label: shortcut.key,
		description: shortcut.action,
		iconPath: new vscode.ThemeIcon("keyboard"),
	}));

	await vscode.window.showQuickPick(items, {
		title: "VoiceDev Keyboard Shortcuts",
		placeHolder: "Reference for all keyboard shortcuts",
	});
}
