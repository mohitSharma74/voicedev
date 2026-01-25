declare module "pvrecorder-node" {
	export class PvRecorder {
		constructor(deviceIndex: number, frameLength: number, sampleRate?: number);
		start(): void;
		stop(): void;
		release(): void;
		read(): Promise<Int16Array>;
		static getAvailableDevices(): string[];
		static getDefaultDevice(): number;
	}
}

declare module "@picovoice/pvrecorder-node" {
	export class PvRecorder {
		constructor(deviceIndex: number, frameLength: number, sampleRate?: number);
		start(): void;
		stop(): void;
		release(): void;
		read(): Promise<Int16Array>;
		static getAvailableDevices(): string[];
		static getDefaultDevice(): number;
	}
}
