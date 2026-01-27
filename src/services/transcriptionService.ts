import * as vscode from "vscode";
import { ITranscriptionProvider } from "@services/providers/ITranscriptionProvider";
import { GroqProvider } from "@services/providers/groqProvider";
import { LocalWhisperProvider } from "@services/providers/localWhisperProvider";

export type SttProviderType = "groq" | "openai" | "local";

export class TranscriptionService {
	private provider: ITranscriptionProvider;
	private context: vscode.ExtensionContext;
	private currentProviderType: SttProviderType;
	private configChangeDisposable: vscode.Disposable;
	private onProviderChangeEmitter = new vscode.EventEmitter<SttProviderType>();

	/**
	 * Event fired when the STT provider changes
	 */
	public readonly onProviderChange = this.onProviderChangeEmitter.event;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;

		const config = vscode.workspace.getConfiguration("voicedev");
		this.currentProviderType = config.get<SttProviderType>("stt.provider", "groq");
		this.provider = this.createProvider(this.currentProviderType);

		// Listen for configuration changes
		this.configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("voicedev.stt.provider")) {
				this.switchProvider();
			}
		});
	}

	private createProvider(type: SttProviderType): ITranscriptionProvider {
		switch (type) {
			case "local":
				return new LocalWhisperProvider(this.context);
			case "openai":
				// Future: OpenAI provider
				console.warn("OpenAI provider not yet implemented, falling back to Groq");
				return new GroqProvider();
			case "groq":
			default:
				return new GroqProvider();
		}
	}

	private switchProvider(): void {
		const config = vscode.workspace.getConfiguration("voicedev");
		const newType = config.get<SttProviderType>("stt.provider", "groq");

		if (newType !== this.currentProviderType) {
			// Dispose old provider
			this.provider.dispose();

			// Create new provider
			this.currentProviderType = newType;
			this.provider = this.createProvider(newType);

			console.log(`[TranscriptionService] Switched to ${this.provider.getName()}`);

			// Notify listeners about the provider change
			this.onProviderChangeEmitter.fire(newType);
		}
	}

	async transcribe(audioBuffer: Buffer): Promise<string> {
		return await this.provider.transcribe(audioBuffer);
	}

	async validateApiKey(): Promise<boolean> {
		return await this.provider.validateApiKey();
	}

	getProviderName(): string {
		return this.provider.getName();
	}

	/**
	 * Get the current provider type
	 */
	getProviderType(): SttProviderType {
		return this.currentProviderType;
	}

	dispose(): void {
		this.onProviderChangeEmitter.dispose();
		this.configChangeDisposable.dispose();
		this.provider.dispose();
	}
}
