import * as vscode from "vscode";
import * as cp from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { ITranscriptionProvider } from "@services/providers/ITranscriptionProvider";
import { LocalSttSetup, SetupResult } from "@services/localSttSetup";

interface TranscriptionResponse {
	ok: boolean;
	text?: string;
	language?: string;
	error?: string;
}

interface PendingRequest {
	audioPath: string;
	resolve: (text: string) => void;
	reject: (error: Error) => void;
}

export class LocalWhisperProvider implements ITranscriptionProvider {
	private serverProcess: cp.ChildProcess | null = null;
	private isServerReady = false;
	private setup: LocalSttSetup;
	private extensionPath: string;
	private pendingRequests: PendingRequest[] = [];
	private currentRequest: PendingRequest | null = null;
	private responseBuffer = "";
	private serverStartPromise: Promise<void> | null = null;
	private restartAttempts = 0;
	private readonly maxRestartAttempts = 3;
	private disposed = false;

	constructor(context: vscode.ExtensionContext) {
		this.setup = new LocalSttSetup(context.globalStorageUri, context.extensionPath);
		this.extensionPath = context.extensionPath;
	}

	async transcribe(audioBuffer: Buffer): Promise<string> {
		if (this.disposed) {
			throw new Error("LocalWhisperProvider has been disposed");
		}

		// Ensure server is running (setup if needed)
		await this.ensureServerRunning();

		// Save audio to temp file
		const tempPath = await this.saveTempWav(audioBuffer);

		try {
			// Send request to server and wait for response
			const text = await this.sendRequest(tempPath);
			return text;
		} finally {
			// Clean up temp file
			await this.deleteTempFile(tempPath);
		}
	}

	async validateApiKey(): Promise<boolean> {
		// Local provider doesn't need API key, but we check if setup is complete
		return await this.setup.isSetupComplete();
	}

	getName(): string {
		return "Local Whisper (faster-whisper)";
	}

	dispose(): void {
		this.disposed = true;
		this.stopServer();

		// Reject any pending requests
		const error = new Error("Provider disposed");
		if (this.currentRequest) {
			this.currentRequest.reject(error);
			this.currentRequest = null;
		}
		for (const req of this.pendingRequests) {
			req.reject(error);
		}
		this.pendingRequests = [];
	}

	private async ensureServerRunning(): Promise<void> {
		// If server is running and ready, return immediately
		if (this.serverProcess && this.isServerReady) {
			return;
		}

		// If server is currently starting, wait for it
		if (this.serverStartPromise) {
			await this.serverStartPromise;
			return;
		}

		// Check if setup is complete
		const isSetup = await this.setup.isSetupComplete();
		if (!isSetup) {
			// Run setup with progress UI
			const result: SetupResult = await this.setup.runSetup();
			if (!result.success) {
				throw new Error(result.error || "Local STT setup failed");
			}
		}

		// Start the server
		this.serverStartPromise = this.startServer();
		try {
			await this.serverStartPromise;
		} finally {
			this.serverStartPromise = null;
		}
	}

	private async startServer(): Promise<void> {
		return new Promise((resolve, reject) => {
			const pythonPath = this.setup.getPythonPath();
			const serverPath = path.join(this.extensionPath, "stt", "local", "server.py");

			// Get model from settings
			const config = vscode.workspace.getConfiguration("voicedev");
			const model = config.get<string>("local.model", "base");

			this.serverProcess = cp.spawn(pythonPath, [serverPath], {
				env: { ...process.env, VOICEDEV_MODEL: model },
				stdio: ["pipe", "pipe", "pipe"],
				windowsHide: true,
			});

			// Timeout for server startup (model loading can take time, especially first time)
			const timeoutId = setTimeout(() => {
				if (!this.isServerReady) {
					this.stopServer();
					reject(new Error("Server startup timeout (60s). The model may be downloading. Please try again."));
				}
			}, 60000);

			// Handle stdout - wait for "READY" signal
			this.serverProcess.stdout?.on("data", (data: Buffer) => {
				const text = data.toString();

				if (!this.isServerReady && text.includes("READY")) {
					this.isServerReady = true;
					this.restartAttempts = 0;
					clearTimeout(timeoutId);
					resolve();

					// Continue handling any remaining data after READY
					const afterReady = text.split("READY")[1];
					if (afterReady?.trim()) {
						this.handleServerOutput(Buffer.from(afterReady));
					}
				} else if (this.isServerReady) {
					this.handleServerOutput(data);
				}
			});

			this.serverProcess.stderr?.on("data", (data: Buffer) => {
				console.error("[LocalWhisper stderr]", data.toString());
			});

			this.serverProcess.on("error", (error) => {
				clearTimeout(timeoutId);
				this.handleServerError(error);
				if (!this.isServerReady) {
					reject(error);
				}
			});

			this.serverProcess.on("exit", (code) => {
				clearTimeout(timeoutId);
				this.handleServerExit(code);
				if (!this.isServerReady) {
					reject(new Error(`Server exited during startup with code ${code}`));
				}
			});
		});
	}

	private stopServer(): void {
		if (this.serverProcess) {
			this.serverProcess.kill("SIGTERM");
			this.serverProcess = null;
			this.isServerReady = false;
			this.responseBuffer = "";
		}
	}

	private handleServerOutput(data: Buffer): void {
		// Accumulate output (may receive partial JSON)
		this.responseBuffer += data.toString();

		// Process complete lines (newline-delimited JSON)
		const lines = this.responseBuffer.split("\n");
		this.responseBuffer = lines.pop() || ""; // Keep incomplete line

		for (const line of lines) {
			if (!line.trim()) {
				continue;
			}

			try {
				const response = JSON.parse(line) as TranscriptionResponse;

				if (this.currentRequest) {
					if (response.ok && response.text !== undefined) {
						this.currentRequest.resolve(response.text);
					} else {
						this.currentRequest.reject(new Error(response.error || "Unknown transcription error"));
					}
					this.currentRequest = null;
					this.processNextRequest();
				}
			} catch {
				console.error("[LocalWhisper] Failed to parse response:", line);
			}
		}
	}

	private handleServerError(error: Error): void {
		console.error("[LocalWhisper] Server error:", error.message);

		// Reject current request
		if (this.currentRequest) {
			this.currentRequest.reject(new Error(`Server error: ${error.message}`));
			this.currentRequest = null;
		}
	}

	private handleServerExit(code: number | null): void {
		const wasReady = this.isServerReady;
		this.isServerReady = false;
		this.serverProcess = null;
		this.responseBuffer = "";

		// Reject current request if any
		if (this.currentRequest) {
			this.currentRequest.reject(new Error(`Server exited with code ${code}`));
			this.currentRequest = null;
		}

		// If we have pending requests and haven't exceeded restart attempts, restart
		if (
			!this.disposed &&
			wasReady &&
			this.pendingRequests.length > 0 &&
			this.restartAttempts < this.maxRestartAttempts
		) {
			this.restartAttempts++;
			console.log(
				`[LocalWhisper] Server exited, attempting restart (${this.restartAttempts}/${this.maxRestartAttempts})`,
			);

			this.ensureServerRunning().catch((e: unknown) => {
				// Reject all pending requests
				const error = e instanceof Error ? e : new Error(String(e));
				for (const req of this.pendingRequests) {
					req.reject(error);
				}
				this.pendingRequests = [];
			});
		} else if (this.pendingRequests.length > 0) {
			// Exceeded restart attempts or disposed, reject all pending
			const error = new Error("Server crashed and max restart attempts exceeded");
			for (const req of this.pendingRequests) {
				req.reject(error);
			}
			this.pendingRequests = [];
		}
	}

	private sendRequest(audioPath: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.pendingRequests.push({ audioPath, resolve, reject });
			this.processNextRequest();
		});
	}

	private processNextRequest(): void {
		if (this.currentRequest || this.pendingRequests.length === 0) {
			return;
		}

		if (!this.serverProcess || !this.isServerReady) {
			// Server not ready, requests will be processed after startup
			return;
		}

		this.currentRequest = this.pendingRequests.shift()!;
		const request = JSON.stringify({ audio: this.currentRequest.audioPath });
		this.serverProcess.stdin?.write(request + "\n");
	}

	private async saveTempWav(audioBuffer: Buffer): Promise<string> {
		const tempDir = os.tmpdir();
		const filename = `voicedev-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
		const tempPath = path.join(tempDir, filename);
		await fs.writeFile(tempPath, audioBuffer);
		return tempPath;
	}

	private async deleteTempFile(filePath: string): Promise<void> {
		try {
			await fs.unlink(filePath);
		} catch {
			// Ignore deletion errors (file may already be deleted)
			console.warn("[LocalWhisper] Failed to delete temp file:", filePath);
		}
	}
}
