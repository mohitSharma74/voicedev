/**
 * Copilot Detection
 * Detects GitHub Copilot CLI availability and provides install prompts
 */

import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Copilot availability status
 */
export interface CopilotStatus {
	/** Whether gh copilot is available */
	available: boolean;
	/** The installed version (if available) */
	version?: string;
	/** Error message if not available */
	error?: string;
}

// Cache for copilot status
let copilotStatusCache: CopilotStatus | null = null;

/**
 * Check if GitHub Copilot CLI is installed and available
 * Runs `gh copilot --version` to verify
 */
export async function checkCopilotAvailability(): Promise<CopilotStatus> {
	// Return cached result if available
	if (copilotStatusCache) {
		return copilotStatusCache;
	}

	try {
		// Check if gh is installed first
		try {
			await execAsync("gh --version");
		} catch {
			const status: CopilotStatus = {
				available: false,
				error: "GitHub CLI (gh) not found. Please install it from https://cli.github.com/",
			};
			copilotStatusCache = status;
			return status;
		}

		// Check if copilot extension is installed
		const { stdout } = await execAsync("gh copilot --version");
		const version = stdout.trim();

		const status: CopilotStatus = {
			available: true,
			version,
		};
		copilotStatusCache = status;
		return status;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		// Check if it's because copilot extension is not installed
		if (errorMessage.includes("unknown command") || errorMessage.includes("not found")) {
			const status: CopilotStatus = {
				available: false,
				error: "GitHub Copilot CLI extension not installed. Run: gh extension install github/gh-copilot",
			};
			copilotStatusCache = status;
			return status;
		}

		const status: CopilotStatus = {
			available: false,
			error: `Failed to check Copilot availability: ${errorMessage}`,
		};
		copilotStatusCache = status;
		return status;
	}
}

/**
 * Show an install prompt with a link to GitHub Copilot CLI documentation
 */
export async function showInstallPrompt(): Promise<void> {
	const DOCS_URL = "https://docs.github.com/en/copilot/github-copilot-in-the-cli";

	const choice = await vscode.window.showWarningMessage(
		"GitHub Copilot CLI is not installed or not available.",
		"Open Documentation",
		"Install gh-copilot",
	);

	if (choice === "Open Documentation") {
		void vscode.env.openExternal(vscode.Uri.parse(DOCS_URL));
	} else if (choice === "Install gh-copilot") {
		// Open terminal and run install command
		const terminal = vscode.window.createTerminal("Install Copilot");
		terminal.show();
		terminal.sendText("gh extension install github/gh-copilot", true);
	}
}

/**
 * Require Copilot to be available, showing install prompt if not
 * @returns true if Copilot is available, false otherwise
 */
export async function requireCopilot(): Promise<boolean> {
	const status = await checkCopilotAvailability();

	if (!status.available) {
		console.warn("Copilot not available:", status.error);
		await showInstallPrompt();
		return false;
	}

	return true;
}

/**
 * Initialize Copilot detection on extension activation
 * Logs the status but doesn't show prompts unless commands are used
 */
export async function initCopilotDetection(): Promise<void> {
	const status = await checkCopilotAvailability();

	if (status.available) {
		console.log(`VoiceDev: GitHub Copilot CLI detected (${status.version})`);
	} else {
		console.log(`VoiceDev: GitHub Copilot CLI not available - ${status.error}`);
	}
}

/**
 * Clear the cached status (useful for testing or retry)
 */
export function clearCopilotCache(): void {
	copilotStatusCache = null;
}

/**
 * Get cached status without running detection again
 */
export function getCachedCopilotStatus(): CopilotStatus | null {
	return copilotStatusCache;
}
