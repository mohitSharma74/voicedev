import * as vscode from "vscode";
import { getPlatform } from "@utils/systemCheck.js";
import { getNotificationService } from "@ui/notificationService";

const PERMISSION_STATE_KEY = "voicedev.permissionGuideDismissed";

export async function showMicrophonePermissionGuide(globalState: vscode.Memento): Promise<void> {
	if (getPlatform() !== "macos") {
		return;
	}

	const dismissed = globalState.get<boolean>(PERMISSION_STATE_KEY);
	if (dismissed) {
		return;
	}

	await getNotificationService().showInfo(
		"VoiceDev needs microphone access on macOS. Grant permission in System Preferences.",
		[
			{
				title: "Open System Preferences",
				action: async () => {
					await vscode.env.openExternal(
						vscode.Uri.parse("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"),
					);
				},
			},
			{
				title: "Don't Show Again",
				action: async () => {
					await globalState.update(PERMISSION_STATE_KEY, true);
				},
			},
		],
	);
}
