export interface ITranscriptionProvider {
	/**
	 * Transcribe audio buffer to text
	 * @param audioBuffer WAV audio buffer
	 */
	transcribe(audioBuffer: Buffer): Promise<string>;

	/**
	 * Check if API key is valid/configured
	 */
	validateApiKey(): Promise<boolean>;

	/**
	 * Get provider name
	 */
	getName(): string;

	/**
	 * Clean up resources
	 */
	dispose(): void;
}
