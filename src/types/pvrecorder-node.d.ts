declare module "@picovoice/pvrecorder-node" {
	export class PvRecorder {
		constructor(frameLength: number, deviceIndex?: number, bufferedFramesCount?: number);
		start(): void;
		stop(): void;
		release(): void;
		read(): Promise<Int16Array>;
		readSync(): Int16Array;
		setDebugLogging(isDebugLoggingEnabled: boolean): void;
		getSelectedDevice(): string;
		get frameLength(): number;
		get sampleRate(): number;
		get version(): string;
		get isRecording(): boolean;
		static getAvailableDevices(): string[];
	}
}
