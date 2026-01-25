export interface RecordingConfig {
	maxDurationSeconds: number;
	sampleRate: number;
	channels: number;
	useMockRecorder: boolean;
}

export interface FeatureConfig {
	recording: RecordingConfig;
}

export const featureConfig: FeatureConfig = {
	recording: {
		maxDurationSeconds: 30,
		sampleRate: 16000,
		channels: 1,
		useMockRecorder: false,
	},
};
