// eslint-disable @typescript-eslint/no-explicit-any

import * as assert from "assert";
import { afterEach, beforeEach, describe, it } from "mocha";
import * as sinon from "sinon";
import proxyquire from "proxyquire";

describe("System Commands", () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it("routes list-commands to Command Center", async () => {
		const executeCommand = sandbox.stub().resolves(undefined);

		const module = proxyquire.noCallThru()("../../../src/commands/systemCommands", {
			vscode: {
				commands: { executeCommand },
			},
			"../ui/shortcutHints": {
				showShortcuts: sandbox.stub().resolves(undefined),
			},
		});

		await module.listCommandsCommand.execute();

		assert.strictEqual(executeCommand.calledOnceWithExactly("voicedev.openCommandCenter"), true);
	});
});
