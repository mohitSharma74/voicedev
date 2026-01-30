/**
 * Copilot Detection
 * Detects GitHub Copilot CLI availability and provides install prompts
 */

import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import { constants as fsConstants } from "fs";
import { getNotificationService } from "@ui/notificationService";
import { ErrorFormatter } from "@utils/errorFormatter";

const execAsync = promisify(exec);

function getConfiguredCliPath(): string | undefined {
	const config = vscode.workspace.getConfiguration("voicedev");
	const cliPath = config.get<string>("copilot.cliPath")?.trim();
	return cliPath ? cliPath : undefined;
}

function formatCliCommand(cliPath: string): string {
	if (cliPath.startsWith('"') && cliPath.endsWith('"')) {
		return cliPath;
	}
	if (cliPath.includes(" ")) {
		return `"${cliPath.replace(/"/g, '\\"')}"`;
	}
	return cliPath;
}

async function isValidCliPath(cliPath: string): Promise<boolean> {
	try {
		const accessMode = process.platform === "win32" ? fsConstants.F_OK : fsConstants.X_OK;
		await fs.access(cliPath, accessMode);
		const stats = await fs.stat(cliPath);
		return stats.isFile();
	} catch {
		return false;
	}
}

export function getCopilotCliCommand(): string {
	const cliPath = getConfiguredCliPath();
	return cliPath ? formatCliCommand(cliPath) : "gh";
}

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

	const configuredCliPath = getConfiguredCliPath();
	const cliCommand = configuredCliPath ? formatCliCommand(configuredCliPath) : "gh";

	try {
		// Validate custom CLI path if provided
		if (configuredCliPath) {
			const isValid = await isValidCliPath(configuredCliPath);
			if (!isValid) {
				const status: CopilotStatus = {
					available: false,
					error:
						`Configured GitHub CLI path is invalid: ${configuredCliPath}. ` +
						"Update voicedev.copilot.cliPath or leave it empty to use gh from PATH.",
				};
				copilotStatusCache = status;
				return status;
			}
		}

		// Check if gh is installed first
		try {
			await execAsync(`${cliCommand} --version`);
		} catch {
			const status: CopilotStatus = {
				available: false,
				error: configuredCliPath
					? `GitHub CLI not executable at configured path: ${configuredCliPath}.`
					: "GitHub CLI (gh) not found. Please install it from https://cli.github.com/",
			};
			copilotStatusCache = status;
			return status;
		}

		// Check if copilot extension is installed
		const { stdout } = await execAsync(`${cliCommand} copilot --version`);
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

	await getNotificationService().showWarning("GitHub Copilot CLI is not installed.", [
		{
			title: "Open Documentation",
			action: () => vscode.env.openExternal(vscode.Uri.parse(DOCS_URL)),
		},
		{
			title: "Install gh-copilot",
			action: () => {
				const terminal = vscode.window.createTerminal("Install Copilot");
				terminal.show();
				terminal.sendText(`${getCopilotCliCommand()} extension install github/gh-copilot`, true);
			},
		},
	]);
}

/**
 * Require Copilot to be available, showing install prompt if not
 * @returns true if Copilot is available, false otherwise
 */
export async function requireCopilot(): Promise<boolean> {
	const status = await checkCopilotAvailability();

	if (!status.available) {
		console.warn("Copilot not available:", status.error);
		if (status.error?.includes("Configured GitHub CLI path")) {
			const formatted = ErrorFormatter.formatCopilotError(new Error(status.error));
			void getNotificationService().showError(formatted.message, formatted.actions);
			return false;
		}
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
