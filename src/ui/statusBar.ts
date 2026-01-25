import * as vscode from "vscode";

export class StatusBarManager {
	private item: vscode.StatusBarItem;
	private recordingInterval: NodeJS.Timeout | undefined;
	private recordingSeconds = 0;

	constructor() {
		this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.item.command = "workbench.action.showCommands";
		this.setIdle();
		this.item.show();
	}

	setIdle(): void {
		this.clearInterval();
		this.recordingSeconds = 0;
		this.item.text = "$(mic) VoiceDev";
		this.item.tooltip = "VoiceDev ready — press Ctrl+Shift+V (Cmd+Shift+V on macOS) to start recording";
	}

	setRecording(): void {
		this.clearInterval();
		this.recordingSeconds = 0;
		this.item.text = "$(pulse) Recording... 0s";
		this.item.tooltip = "Recording audio... release the hotkey to stop";
		this.recordingInterval = setInterval(() => {
			this.recordingSeconds += 1;
			this.item.text = `$(pulse) Recording... ${this.recordingSeconds}s`;
		}, 1000);
	}

	dispose(): void {
		this.clearInterval();
		this.item.dispose();
	}

	private clearInterval(): void {
		if (this.recordingInterval) {
			clearInterval(this.recordingInterval);
			this.recordingInterval = undefined;
		}
	}
}
