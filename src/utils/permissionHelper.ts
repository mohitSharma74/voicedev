import * as vscode from "vscode";
import { getPlatform } from "@utils/systemCheck.js";

const PERMISSION_STATE_KEY = "voicedev.permissionGuideDismissed";

export async function showMicrophonePermissionGuide(globalState: vscode.Memento): Promise<void> {
	if (getPlatform() !== "macos") {
		return;
	}

	const dismissed = globalState.get<boolean>(PERMISSION_STATE_KEY);
	if (dismissed) {
		return;
	}

	const choice = await vscode.window.showInformationMessage(
		"VoiceDev needs microphone access on macOS. Please grant permission in System Preferences.",
		"Open System Preferences",
		"Don't Show Again",
	);

	if (choice === "Open System Preferences") {
		void vscode.env.openExternal(
			vscode.Uri.parse("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"),
		);
	}

	if (choice === "Don't Show Again") {
		void globalState.update(PERMISSION_STATE_KEY, true);
	}
}
