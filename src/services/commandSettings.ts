import * as vscode from "vscode";

export function getDisabledCommandIds(): Set<string> {
	const config = vscode.workspace.getConfiguration("voicedev");
	const disabled = config.get<string[]>("commands.disabled") ?? [];
	return new Set(disabled.map((id) => id.trim()).filter((id) => id.length > 0));
}

export function isCommandDisabled(commandId: string): boolean {
	return getDisabledCommandIds().has(commandId);
}
