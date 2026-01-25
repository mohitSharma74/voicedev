import * as vscode from 'vscode';

/**
 * Called when the extension is activated.
 * The extension is activated the very first time a command is executed.
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('VoiceDev extension is now active!');

	// Register the hello world command - this will be replaced with voice commands in Phase 2
	const helloWorldDisposable = vscode.commands.registerCommand('voicedev.helloWorld', () => {
		vscode.window.showInformationMessage('Hello from VoiceDev! 🎤 Voice commands coming soon...');
	});

	context.subscriptions.push(helloWorldDisposable);

	// Show activation message in status bar briefly
	vscode.window.setStatusBarMessage('$(mic) VoiceDev Ready', 3000);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate() {
	console.log('VoiceDev extension deactivated');
}
