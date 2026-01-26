import * as vscode from "vscode";

export class StatusBarManager {
	private item: vscode.StatusBarItem;
	private recordingInterval: NodeJS.Timeout | undefined;
	private recordingSeconds = 0;

	constructor() {
		this.item = vscode.window.createStatusBarItem("voicedev.statusBar", vscode.StatusBarAlignment.Right, 50);
		this.item.command = "voicedev.toggleRecording";
		this.setIdle();
		this.item.show();
	}

	setIdle(): void {
		this.clearInterval();
		this.recordingSeconds = 0;
		this.item.text = "$(mic) VoiceDev";
		this.item.tooltip = "Click to start recording (or press Ctrl+Shift+V / Cmd+Shift+V)";
		this.item.backgroundColor = undefined;
	}

	setRecording(): void {
		this.clearInterval();
		this.recordingSeconds = 0;
		this.item.text = "$(pulse) Recording... 0s";
		this.item.tooltip = "Recording in progress — click to stop";
		this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
		this.recordingInterval = setInterval(() => {
			this.recordingSeconds += 1;
			this.item.text = `$(pulse) Recording... ${this.recordingSeconds}s`;
		}, 1000);
	}

	setTranscribing(): void {
		this.clearInterval();
		this.item.text = "$(sync~spin) Transcribing...";
		this.item.tooltip = "Transcribing audio to text...";
		this.item.backgroundColor = undefined;
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
