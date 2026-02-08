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
			"🎙️ Welcome to VoiceDev \u2014 Voice-native development for VS Code!\n\n" +
			"Speak to navigate, commit, and control your workflow. " +
			"30+ voice commands are ready to go.\n\n" +
			"Try a full git workflow:\n" +
			"  \u2018git status\u2019 \u2192 \u2018git commit message fixed the login bug\u2019 \u2192 \u2018git push\u2019\n\n" +
			"Quick Start:\n" +
			"1. Press Ctrl+Shift+V (Cmd+Shift+V on Mac) to start recording\n" +
			"2. Speak a command or dictate text\n" +
			"3. Press Ctrl+Shift+V again to execute\n\n" +
			"Say \u2018help\u2019 or \u2018list commands\u2019 to see everything you can do.";

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
