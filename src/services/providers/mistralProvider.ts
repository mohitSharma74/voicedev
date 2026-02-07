import { Mistral } from "@mistralai/mistralai";
import { ITranscriptionProvider } from "@services/providers/ITranscriptionProvider";
import { SecretStorageHelper } from "@utils/secretStorage";

export class MistralProvider implements ITranscriptionProvider {
	private client: Mistral | null = null;
	private readonly providerId = "mistral";

	async transcribe(audioBuffer: Buffer): Promise<string> {
		try {
			const apiKey = await SecretStorageHelper.getInstance().getApiKey(this.providerId);

			if (!apiKey) {
				throw new Error('Mistral API key not found. Please set it using "VoiceDev: Set API Key" command.');
			}

			if (!this.client) {
				this.client = new Mistral({ apiKey });
			}

			try {
				// Convert Buffer to File for the Mistral SDK
				const blob = new Blob([audioBuffer], { type: "audio/wav" });
				const file = new File([blob], "audio.wav", { type: "audio/wav" });

				const transcription = await this.client.audio.transcriptions.complete({
					model: "voxtral-mini-latest",
					file: file,
				});

				return transcription.text || "";
			} catch (error: unknown) {
				console.error("Mistral transcription error:", error);

				// Type guard for Mistral error object with statusCode property
				const isErrorWithStatus = (err: unknown): err is { statusCode: number } => {
					return typeof err === "object" && err !== null && "statusCode" in err;
				};

				if (isErrorWithStatus(error) && error.statusCode === 401) {
					throw new Error("Invalid Mistral API key. Please check your key.");
				}
				if (isErrorWithStatus(error) && error.statusCode === 429) {
					throw new Error("Mistral API rate limit exceeded. Please try again later.");
				}

				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				throw new Error(`Transcription failed: ${errorMessage}`);
			}
		} catch (error) {
			// Handle secret storage errors during transcription
			if (error instanceof Error && error.message.includes("Secret")) {
				throw new Error("Secret storage not available. Please restart VS Code.");
			}
			throw error;
		}
	}

	async validateApiKey(): Promise<boolean> {
		try {
			const apiKey = await SecretStorageHelper.getInstance().getApiKey(this.providerId);
			return !!apiKey;
		} catch (error) {
			// Graceful degradation if secrets not ready during activation
			console.warn("Secret storage not ready:", error);
			return false;
		}
	}

	getName(): string {
		return "Mistral Voxtral";
	}

	dispose(): void {
		this.client = null;
	}
}
