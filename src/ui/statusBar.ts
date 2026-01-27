import * as vscode from "vscode";
import { SttProviderType } from "@services/transcriptionService";

export class StatusBarManager {
	private item: vscode.StatusBarItem;
	private recordingInterval: NodeJS.Timeout | undefined;
	private recordingSeconds = 0;
	private currentProvider: SttProviderType = "groq";
	private currentState: "idle" | "recording" | "transcribing" = "idle";

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
		this.recordingSeconds = 0;
		this.item.text = `${this.getProviderIcon()} $(mic) VoiceDev`;
		this.item.tooltip = `VoiceDev - Provider: ${this.getProviderDisplayName()}\nClick to start recording (or press Ctrl+Shift+V / Cmd+Shift+V)`;
		this.item.backgroundColor = undefined;
	}

	setRecording(): void {
		this.currentState = "recording";
		this.clearInterval();
		this.recordingSeconds = 0;
		this.item.text = `${this.getProviderIcon()} $(pulse) Recording... 0s`;
		this.item.tooltip = `Recording with ${this.getProviderDisplayName()} — click to stop`;
		this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
		this.recordingInterval = setInterval(() => {
			this.recordingSeconds += 1;
			this.item.text = `${this.getProviderIcon()} $(pulse) Recording... ${this.recordingSeconds}s`;
		}, 1000);
	}

	setTranscribing(): void {
		this.currentState = "transcribing";
		this.clearInterval();
		this.item.text = `${this.getProviderIcon()} $(sync~spin) Transcribing...`;
		this.item.tooltip = `Transcribing with ${this.getProviderDisplayName()}...`;
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
