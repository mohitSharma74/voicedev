import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import * as os from "os";

export type SoundType = "start" | "stop";

export class AudioPlayer {
	private soundsEnabled: boolean;

	constructor() {
		const config = vscode.workspace.getConfiguration("voicedev");
		this.soundsEnabled = config.get<boolean>("audio.feedbackSounds", true);
	}

	public play(context: vscode.ExtensionContext, type: SoundType): void {
		// Re-read config in case it changed
		const config = vscode.workspace.getConfiguration("voicedev");
		this.soundsEnabled = config.get<boolean>("audio.feedbackSounds", true);

		if (!this.soundsEnabled) {
			return;
		}

		const filename = type === "start" ? "start-chime.wav" : "stop-chime.wav";
		const soundPath = path.join(context.extensionPath, "media", "sounds", filename);

		this.playFile(soundPath);
	}

	private playFile(filePath: string): void {
		const platform = os.platform();
		let command = "";
		let args: string[] = [];

		if (platform === "darwin") {
			// macOS
			command = "afplay";
			args = [filePath];
		} else if (platform === "win32") {
			// Windows - use PowerShell
			command = "powershell";
			const psCommand = `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`;
			args = ["-c", psCommand];
		} else if (platform === "linux") {
			// Linux - try paplay (PulseAudio) first, then aplay (ALSA)
			// For simplicity in this implementation, we'll try aplay which is common
			command = "aplay";
			args = [filePath];
		} else {
			console.warn(`Audio playback not supported on platform: ${platform}`);
			return;
		}

		// Spawn process in detached/independent mode so it doesn't block
		// We ignore stdout/stderr to keep it clean, unless we want to debug
		const child = cp.spawn(command, args, {
			stdio: "ignore",
			detached: false, // Keep attached to extension process but don't wait for it
			windowsHide: true,
		});

		child.on("error", (err) => {
			console.warn(`Failed to play sound ${filePath}: ${err.message}`);
		});

		child.unref(); // Allow the parent to exit independently of the child
	}
}

export const audioPlayer = new AudioPlayer();
