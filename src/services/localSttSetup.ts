import * as vscode from "vscode";
import * as cp from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface SetupResult {
	success: boolean;
	error?: string;
	pythonPath?: string;
}

interface PythonCheckResult {
	available: boolean;
	version?: string;
	error?: string;
}

interface FfmpegCheckResult {
	available: boolean;
	error?: string;
}

export class LocalSttSetup {
	private globalStoragePath: string;
	private venvPath: string;
	private extensionPath: string;

	constructor(globalStorageUri: vscode.Uri, extensionPath: string) {
		this.globalStoragePath = globalStorageUri.fsPath;
		this.venvPath = path.join(this.globalStoragePath, "voicedev-stt");
		this.extensionPath = extensionPath;
	}

	/**
	 * Check if setup is complete and venv exists with faster-whisper installed
	 */
	async isSetupComplete(): Promise<boolean> {
		try {
			const pythonPath = this.getPythonPath();
			await fs.access(pythonPath);

			// Also verify faster-whisper is installed
			const result = await this.runCommand(pythonPath, ["-c", "import faster_whisper; print('ok')"]);
			return result.success && (result.stdout?.includes("ok") ?? false);
		} catch {
			return false;
		}
	}

	/**
	 * Get path to Python executable in venv
	 */
	getPythonPath(): string {
		const platform = os.platform();
		if (platform === "win32") {
			return path.join(this.venvPath, "Scripts", "python.exe");
		}
		return path.join(this.venvPath, "bin", "python");
	}

	/**
	 * Get path to pip executable in venv
	 */
	private getPipPath(): string {
		const platform = os.platform();
		if (platform === "win32") {
			return path.join(this.venvPath, "Scripts", "pip.exe");
		}
		return path.join(this.venvPath, "bin", "pip");
	}

	/**
	 * Get path to requirements.txt in extension
	 */
	private getRequirementsPath(): string {
		return path.join(this.extensionPath, "stt", "local", "requirements.txt");
	}

	/**
	 * Run full setup process with progress UI
	 */
	async runSetup(): Promise<SetupResult> {
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "VoiceDev: Setting up offline speech engine",
				cancellable: false,
			},
			async (progress) => {
				try {
					// Step 1: Check Python
					progress.report({ message: "Checking Python installation..." });
					const pythonCheck = await this.checkPython();
					if (!pythonCheck.available) {
						return { success: false, error: pythonCheck.error };
					}

					// Step 2: Check ffmpeg
					progress.report({ message: "Checking ffmpeg...", increment: 10 });
					const ffmpegCheck = await this.checkFfmpeg();
					if (!ffmpegCheck.available) {
						return { success: false, error: ffmpegCheck.error };
					}

					// Step 3: Create global storage directory if needed
					progress.report({ message: "Preparing directories...", increment: 10 });
					await this.ensureDirectories();

					// Step 4: Create venv
					progress.report({ message: "Creating Python environment...", increment: 10 });
					const venvResult = await this.createVenv();
					if (!venvResult.success) {
						return { success: false, error: venvResult.error };
					}

					// Step 5: Install dependencies
					progress.report({
						message: "Installing faster-whisper (this may take 1-2 minutes)...",
						increment: 20,
					});
					const installResult = await this.installDependencies();
					if (!installResult.success) {
						return { success: false, error: installResult.error };
					}

					progress.report({ message: "Setup complete!", increment: 50 });
					return { success: true, pythonPath: this.getPythonPath() };
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return { success: false, error: `Setup failed: ${errorMessage}` };
				}
			},
		);
	}

	/**
	 * Check Python availability (3.9+)
	 */
	async checkPython(): Promise<PythonCheckResult> {
		// Try different Python commands
		const pythonCommands = os.platform() === "win32" ? ["python", "python3"] : ["python3", "python"];

		for (const cmd of pythonCommands) {
			const result = await this.runCommand(cmd, ["--version"]);
			if (result.success && result.stdout) {
				const versionMatch = result.stdout.match(/Python (\d+)\.(\d+)/);
				if (versionMatch) {
					const major = parseInt(versionMatch[1], 10);
					const minor = parseInt(versionMatch[2], 10);

					if (major >= 3 && minor >= 9) {
						return {
							available: true,
							version: `${major}.${minor}`,
						};
					}

					return {
						available: false,
						error: `Python 3.9+ required, found ${major}.${minor}. Please upgrade Python.`,
					};
				}
			}
		}

		return {
			available: false,
			error: "Python 3.9+ is required. Please install Python and ensure it's in your PATH.",
		};
	}

	/**
	 * Check ffmpeg availability
	 */
	async checkFfmpeg(): Promise<FfmpegCheckResult> {
		const result = await this.runCommand("ffmpeg", ["-version"]);
		if (result.success) {
			return { available: true };
		}

		return {
			available: false,
			error: "ffmpeg not found in PATH. Please install ffmpeg to use Local STT.",
		};
	}

	/**
	 * Ensure global storage directory exists
	 */
	private async ensureDirectories(): Promise<void> {
		await fs.mkdir(this.globalStoragePath, { recursive: true });
	}

	/**
	 * Create virtual environment
	 */
	private async createVenv(): Promise<{ success: boolean; error?: string }> {
		// Remove existing venv if present (clean install)
		try {
			await fs.rm(this.venvPath, { recursive: true, force: true });
		} catch {
			// Ignore if doesn't exist
		}

		// Find Python command
		const pythonCommands = os.platform() === "win32" ? ["python", "python3"] : ["python3", "python"];
		let pythonCmd = "python";

		for (const cmd of pythonCommands) {
			const result = await this.runCommand(cmd, ["--version"]);
			if (result.success) {
				pythonCmd = cmd;
				break;
			}
		}

		// Create venv
		const result = await this.runCommand(
			pythonCmd,
			["-m", "venv", this.venvPath],
			{ timeout: 60000 }, // 1 minute timeout
		);

		if (!result.success) {
			return {
				success: false,
				error: `Failed to create virtual environment: ${result.stderr || result.error}`,
			};
		}

		return { success: true };
	}

	/**
	 * Install dependencies into venv
	 */
	private async installDependencies(): Promise<{ success: boolean; error?: string }> {
		const pipPath = this.getPipPath();
		const requirementsPath = this.getRequirementsPath();

		// Upgrade pip first
		await this.runCommand(pipPath, ["install", "--upgrade", "pip"], { timeout: 120000 });

		// Install requirements
		const result = await this.runCommand(
			pipPath,
			["install", "-r", requirementsPath],
			{ timeout: 300000 }, // 5 minute timeout for large downloads
		);

		if (!result.success) {
			return {
				success: false,
				error: `Failed to install dependencies: ${result.stderr || result.error}`,
			};
		}

		return { success: true };
	}

	/**
	 * Run a command and return result
	 */
	private runCommand(
		command: string,
		args: string[],
		options: { timeout?: number } = {},
	): Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }> {
		return new Promise((resolve) => {
			const timeout = options.timeout || 30000;
			let stdout = "";
			let stderr = "";
			let timedOut = false;

			const proc = cp.spawn(command, args, {
				shell: true,
				windowsHide: true,
			});

			const timeoutId = setTimeout(() => {
				timedOut = true;
				proc.kill();
				resolve({ success: false, error: `Command timed out after ${timeout}ms` });
			}, timeout);

			proc.stdout?.on("data", (data: Buffer) => {
				stdout += data.toString();
			});

			proc.stderr?.on("data", (data: Buffer) => {
				stderr += data.toString();
			});

			proc.on("close", (code) => {
				if (timedOut) {
					return;
				}
				clearTimeout(timeoutId);
				resolve({
					success: code === 0,
					stdout,
					stderr,
				});
			});

			proc.on("error", (err) => {
				if (timedOut) {
					return;
				}
				clearTimeout(timeoutId);
				resolve({
					success: false,
					error: err.message,
					stdout,
					stderr,
				});
			});
		});
	}
}
