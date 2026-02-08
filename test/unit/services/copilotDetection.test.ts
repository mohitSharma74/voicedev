import * as assert from "assert";
import { afterEach, beforeEach, describe, it } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { getCopilotCliCommand } from "../../../src/services/copilotDetection";

describe("Copilot Detection", () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	function mockCliPath(cliPath: string | undefined): void {
		sandbox.stub(vscode.workspace, "getConfiguration").returns({
			get: (key: string) => {
				if (key === "copilot.cliPath") {
					return cliPath;
				}
				return undefined;
			},
		} as unknown as vscode.WorkspaceConfiguration);
	}

	it("uses copilot by default", () => {
		mockCliPath(undefined);
		assert.strictEqual(getCopilotCliCommand(), "copilot");
	});

	it("quotes configured path when it includes spaces", () => {
		mockCliPath("/Applications/Copilot CLI/bin/copilot");
		assert.strictEqual(getCopilotCliCommand(), '"/Applications/Copilot CLI/bin/copilot"');
	});

	it("keeps already-quoted configured path unchanged", () => {
		mockCliPath('"/usr/local/bin/copilot"');
		assert.strictEqual(getCopilotCliCommand(), '"/usr/local/bin/copilot"');
	});
});
