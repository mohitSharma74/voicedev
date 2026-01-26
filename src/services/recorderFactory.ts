import { featureConfig } from "../config/feature.config";
import * as vscode from "vscode";
import { MockVoiceRecorder } from "./mockRecorder";
import { IVoiceRecorder } from "./IVoiceRecorder";

export function createRecorder(context: vscode.ExtensionContext): IVoiceRecorder {
	if (featureConfig.recording.useMockRecorder) {
		return new MockVoiceRecorder(context);
	}

	// Lazy-load to avoid requiring native module when mock recorder is enabled.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { VoiceRecorder } = require("./recorder") as typeof import("./recorder");
	return new VoiceRecorder();
}
