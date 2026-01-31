import * as vscode from "vscode";
import { SttProviderType } from "@services/transcriptionService";

export class StatusBarManager {
	private item: vscode.StatusBarItem;
	private recordingInterval: NodeJS.Timeout | undefined;
	private recordingSeconds = 0;
	private currentProvider: SttProviderType = "groq";
	private currentState: "idle" | "recording" | "transcribing" | "success" | "error" = "idle";
	private resetTimeout: NodeJS.Timeout | undefined;

	constructor() {
		this.item = vscode.window.createStatusBarItem("voicedev.statusBar", vscode.StatusBarAlignment.Right, 50);
		this.item.command = "voicedev.toggleRecording";
		this.setIdle();
		this.item.show();
	}

	/**
	 * Set the current STT provider and update the display
	 */
	setProvider(provider: SttProviderType): void {
		this.currentProvider = provider;
		// Refresh current state display with new provider
		switch (this.currentState) {
			case "recording":
				this.setRecording();
				break;
			case "transcribing":
				this.setTranscribing();
				break;
			case "idle":
			default:
				this.setIdle();
				break;
		}
	}

	/**
	 * Get the icon for the current provider
	 */
	private getProviderIcon(): string {
		switch (this.currentProvider) {
			case "local":
				return "$(device-desktop)";
			case "openai":
				return "$(hub)";
			case "groq":
			default:
				return "$(cloud)";
		}
	}

	/**
	 * Get the provider display name for tooltips
	 */
	private getProviderDisplayName(): string {
		switch (this.currentProvider) {
			case "local":
				return "Local Whisper (offline)";
			case "openai":
				return "OpenAI Whisper";
			case "groq":
			default:
				return "Groq Whisper (cloud)";
		}
	}

	setIdle(): void {
		this.currentState = "idle";
		this.clearInterval();
		this.clearResetTimeout();
		this.recordingSeconds = 0;
		this.item.text = `${this.getProviderIcon()} $(unmute) VoiceDev`;
		this.item.tooltip = this.buildTooltip();
		this.item.backgroundColor = undefined;
	}

	setRecording(): void {
		this.currentState = "recording";
		this.clearInterval();
		this.clearResetTimeout();
		this.recordingSeconds = 0;
		this.item.text = `${this.getProviderIcon()} $(record-keys) Recording... 0s`;
		this.item.tooltip = this.buildTooltip();
		this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
		this.recordingInterval = setInterval(() => {
			this.recordingSeconds += 1;
			this.item.text = `${this.getProviderIcon()} $(record-keys) Recording... ${this.recordingSeconds}s`;
		}, 1000);
	}

	setTranscribing(): void {
		this.currentState = "transcribing";
		this.clearInterval();
		this.clearResetTimeout();
		this.item.text = `${this.getProviderIcon()} $(loading~spin) Transcribing...`;
		this.item.tooltip = this.buildTooltip();
		this.item.backgroundColor = undefined;
	}

	setSuccess(action: string): void {
		this.currentState = "success";
		this.clearInterval();
		this.clearResetTimeout();
		this.item.text = `${this.getProviderIcon()} $(check) ${action}`;
		this.item.tooltip = this.buildTooltip();
		this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.prominentBackground");
		this.resetTimeout = setTimeout(() => this.setIdle(), 2000);
	}

	setError(message: string): void {
		this.currentState = "error";
		this.clearInterval();
		this.clearResetTimeout();
		this.item.text = `${this.getProviderIcon()} $(error) ${message}`;
		this.item.tooltip = this.buildTooltip();
		this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
		this.resetTimeout = setTimeout(() => this.setIdle(), 3000);
	}

	dispose(): void {
		this.clearInterval();
		this.clearResetTimeout();
		this.item.dispose();
	}

	private clearInterval(): void {
		if (this.recordingInterval) {
			clearInterval(this.recordingInterval);
			this.recordingInterval = undefined;
		}
	}

	private clearResetTimeout(): void {
		if (this.resetTimeout) {
			clearTimeout(this.resetTimeout);
			this.resetTimeout = undefined;
		}
	}

	private buildTooltip(): vscode.MarkdownString {
		const tooltip = new vscode.MarkdownString(
			`**VoiceDev** - ${this.getProviderDisplayName()}\n\n` +
				"**Keyboard Shortcuts:**\n" +
				"- `Ctrl+Shift+V` (Cmd+Shift+V on Mac) - Toggle recording\n" +
				"- `Ctrl+Shift+L` - List voice commands\n\n" +
				`Click to ${this.currentState === "recording" ? "stop" : "start"} recording`,
		);
		tooltip.isTrusted = true;
		return tooltip;
	}
}
