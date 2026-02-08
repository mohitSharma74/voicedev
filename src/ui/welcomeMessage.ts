import * as vscode from "vscode";

export class WelcomeMessageManager {
	private static readonly STORAGE_KEY = "voicedev.welcomed";

	static async showIfFirstTime(context: vscode.ExtensionContext): Promise<void> {
		const hasBeenWelcomed = context.globalState.get<boolean>(this.STORAGE_KEY, false);
		if (hasBeenWelcomed) {
			return;
		}

		await this.show(context);
	}

	static async show(context: vscode.ExtensionContext): Promise<void> {
		const message =
			"🎙️ Welcome to VoiceDev! Voice-control your development workflow.\n\n" +
			"⚠️ This extension is in early preview - expect rapid improvements and new features!\n\n" +
			"Quick Start:\n" +
			"1. Press Ctrl+Shift+V (Cmd+Shift+V on Mac) to start recording\n" +
			"2. Say a command like 'save all' or 'format document'\n" +
			"3. Press Ctrl+Shift+V again to execute\n\n" +
			"Need help? Try saying 'list commands' to see all available voice commands.";

		const choice = await vscode.window.showInformationMessage(
			message,
			"Get Started",
			"Set API Key",
			"View Commands",
			"Share Feedback",
			"Don't Show Again",
		);

		switch (choice) {
			case "Get Started":
				await vscode.commands.executeCommand("voicedev.toggleRecording");
				break;
			case "Set API Key":
				await vscode.commands.executeCommand("voicedev.setApiKey");
				break;
			case "View Commands":
				await vscode.commands.executeCommand("voicedev.listCommands");
				break;
			case "Share Feedback":
				await vscode.env.openExternal(
					vscode.Uri.parse("https://github.com/mohitSharma74/voicedev/issues/new/choose"),
				);
				break;
			case "Don't Show Again":
				await context.globalState.update(this.STORAGE_KEY, true);
				return;
			default:
				break;
		}

		await context.globalState.update(this.STORAGE_KEY, true);
	}
}
