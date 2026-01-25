declare module "node-record-lpcm16" {
	export interface RecordOptions {
		sampleRate?: number;
		channels?: number;
		threshold?: number;
		recorder?: string;
		verbose?: boolean;
	}

	export interface Recording {
		stream(): NodeJS.ReadableStream;
		stop(): void;
	}

	export function record(options?: RecordOptions): Recording;
	export function stop(): void;
}
