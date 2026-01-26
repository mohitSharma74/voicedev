import { ITranscriptionProvider } from "./providers/ITranscriptionProvider";
import { GroqProvider } from "./providers/groqProvider";

export class TranscriptionService {
	private provider: ITranscriptionProvider;

	constructor() {
		// In the future, we can switch providers based on config
		// const config = vscode.workspace.getConfiguration('voicedev');
		// const providerType = config.get<string>('stt.provider') || 'groq';

		// Defaulting to Groq for now as per Phase 1.3 plan
		this.provider = new GroqProvider();
	}

	async transcribe(audioBuffer: Buffer): Promise<string> {
		return await this.provider.transcribe(audioBuffer);
	}

	async validateApiKey(): Promise<boolean> {
		return await this.provider.validateApiKey();
	}

	dispose(): void {
		this.provider.dispose();
	}
}
