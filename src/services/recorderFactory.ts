import { featureConfig } from "../config/feature.config";
import { MockVoiceRecorder } from "./mockRecorder";
import { VoiceRecorder } from "./recorder";
import { IVoiceRecorder } from "./IVoiceRecorder";

export function createRecorder(): IVoiceRecorder {
	if (featureConfig.recording.useMockRecorder) {
		return new MockVoiceRecorder();
	}

	return new VoiceRecorder();
}
