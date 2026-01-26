/**
 * WAV file encoder for converting raw PCM audio buffers to WAV format.
 *
 * WAV format structure:
 * - RIFF header (12 bytes)
 * - fmt chunk (24 bytes for PCM)
 * - data chunk header (8 bytes)
 * - PCM audio data
 */

export interface WavConfig {
	sampleRate: number;
	channels: number;
	bitDepth: 16; // Only 16-bit supported
}

/**
 * Converts a raw PCM audio buffer to WAV format.
 *
 * @param pcmBuffer Raw PCM audio data (16-bit little-endian samples)
 * @param config Audio configuration (sample rate, channels, bit depth)
 * @returns WAV file buffer ready to be written to disk
 */
export function encodeWav(pcmBuffer: Buffer, config: WavConfig): Buffer {
	const { sampleRate, channels, bitDepth } = config;
	const bytesPerSample = bitDepth / 8;
	const blockAlign = channels * bytesPerSample;
	const byteRate = sampleRate * blockAlign;
	const dataSize = pcmBuffer.length;
	const fileSize = 36 + dataSize; // WAV header is 44 bytes, minus 8 for RIFF header

	const wavBuffer = Buffer.alloc(44 + dataSize);
	let offset = 0;

	// RIFF chunk descriptor
	wavBuffer.write("RIFF", offset);
	offset += 4;
	wavBuffer.writeUInt32LE(fileSize, offset);
	offset += 4;
	wavBuffer.write("WAVE", offset);
	offset += 4;

	// fmt sub-chunk
	wavBuffer.write("fmt ", offset);
	offset += 4;
	wavBuffer.writeUInt32LE(16, offset);
	offset += 4; // Sub-chunk size (16 for PCM)
	wavBuffer.writeUInt16LE(1, offset);
	offset += 2; // Audio format (1 = PCM)
	wavBuffer.writeUInt16LE(channels, offset);
	offset += 2;
	wavBuffer.writeUInt32LE(sampleRate, offset);
	offset += 4;
	wavBuffer.writeUInt32LE(byteRate, offset);
	offset += 4;
	wavBuffer.writeUInt16LE(blockAlign, offset);
	offset += 2;
	wavBuffer.writeUInt16LE(bitDepth, offset);
	offset += 2;

	// data sub-chunk
	wavBuffer.write("data", offset);
	offset += 4;
	wavBuffer.writeUInt32LE(dataSize, offset);
	offset += 4;

	// Copy PCM audio data
	pcmBuffer.copy(wavBuffer, offset);

	return wavBuffer;
}

/**
 * Calculates the duration of a PCM buffer in seconds.
 *
 * @param pcmBuffer Raw PCM audio data
 * @param sampleRate Sample rate in Hz
 * @param channels Number of audio channels
 * @returns Duration in seconds
 */
export function calculateDuration(pcmBuffer: Buffer, sampleRate: number, channels: number): number {
	const bytesPerSample = 2; // 16-bit = 2 bytes
	const totalSamples = pcmBuffer.length / (bytesPerSample * channels);
	return totalSamples / sampleRate;
}
