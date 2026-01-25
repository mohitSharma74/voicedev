import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export type Platform = "macos" | "windows" | "linux" | "unknown";

export function getPlatform(): Platform {
	const platform = process.platform;
	if (platform === "darwin") {
		return "macos";
	}
	if (platform === "win32") {
		return "windows";
	}
	if (platform === "linux") {
		return "linux";
	}
	return "unknown";
}

export async function checkSoxInstalled(): Promise<boolean> {
	try {
		await execAsync("sox --version");
		return true;
	} catch (error) {
		return false;
	}
}

export function getSoxInstallInstructions(): string {
	switch (getPlatform()) {
		case "macos":
			return "Install sox with `brew install sox`";
		case "windows":
			return "Install sox with Chocolatey (`choco install sox`) or Scoop (`scoop install sox`)";
		case "linux":
			return "Install sox via your package manager (e.g., `sudo apt install sox`)";
		default:
			return "Install sox for your platform";
	}
}
