import Groq, { toFile } from "groq-sdk";
import { ITranscriptionProvider } from "./ITranscriptionProvider";
import { SecretStorageHelper } from "../../utils/secretStorage";

export class GroqProvider implements ITranscriptionProvider {
	private groq: Groq | null = null;
	private readonly providerId = "groq";

	async transcribe(audioBuffer: Buffer): Promise<string> {
		const apiKey = await SecretStorageHelper.getInstance().getApiKey(this.providerId);

		if (!apiKey) {
			throw new Error('Groq API key not found. Please set it using "VoiceDev: Set API Key" command.');
		}

		if (!this.groq) {
			this.groq = new Groq({ apiKey });
		}

		try {
			// Convert Buffer to File using Groq SDK's toFile utility
			const file = await toFile(audioBuffer, "audio.wav", { type: "audio/wav" });

			const transcription = await this.groq.audio.transcriptions.create({
				file,
				model: "whisper-large-v3",
				language: "en",
				response_format: "text",
			});

			return transcription as unknown as string;
		} catch (error: unknown) {
			console.error("Groq transcription error:", error);

			// Type guard for error object with status property
			const isErrorWithStatus = (err: unknown): err is { status: number } => {
				return typeof err === "object" && err !== null && "status" in err;
			};

			if (isErrorWithStatus(error) && error.status === 401) {
				throw new Error("Invalid Groq API key. Please check your key.");
			}
			if (isErrorWithStatus(error) && error.status === 429) {
				throw new Error("Groq API rate limit exceeded. Please try again later.");
			}

			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Transcription failed: ${errorMessage}`);
		}
	}

	async validateApiKey(): Promise<boolean> {
		const apiKey = await SecretStorageHelper.getInstance().getApiKey(this.providerId);
		return !!apiKey;
	}

	getName(): string {
		return "Groq Whisper";
	}

	dispose(): void {
		this.groq = null;
	}
}
