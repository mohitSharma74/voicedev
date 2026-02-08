// eslint-disable @typescript-eslint/no-explicit-any

import * as assert from "assert";
import { afterEach, beforeEach, describe, it } from "mocha";
import * as sinon from "sinon";
import proxyquire from "proxyquire";

describe("Copilot Commands", () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	function loadCopilotCommandsModule(options?: { availableCommands?: string[]; cliCommand?: string }) {
		const executeCommand = sandbox.stub().resolves(undefined);
		const getCommands = sandbox.stub().resolves(options?.availableCommands ?? []);
		const writeText = sandbox.stub().resolves(undefined);
		const requireCopilot = sandbox.stub().resolves(true);
		const getCopilotCliCommand = sandbox.stub().returns(options?.cliCommand ?? "copilot");
		const notifications = {
			showWarning: sandbox.stub().resolves(undefined),
			showError: sandbox.stub().resolves(undefined),
			showInfo: sandbox.stub().resolves(undefined),
		};

		const module = proxyquire.noCallThru()("../../../src/commands/copilotCommands", {
			vscode: {
				commands: {
					executeCommand,
					getCommands,
				},
				env: {
					clipboard: {
						writeText,
					},
				},
			},
			"@services/copilotDetection": {
				requireCopilot,
				getCopilotCliCommand,
			},
			"@ui/notificationService": {
				getNotificationService: () => notifications,
			},
		});

		return {
			module,
			executeCommand,
			getCommands,
			writeText,
			requireCopilot,
			getCopilotCliCommand,
			notifications,
		};
	}

	it("builds one-shot command with interactive fallback", () => {
		const { module } = loadCopilotCommandsModule({ cliCommand: "copilot" });
		const command = module.buildCopilotPromptCommand("Explain: why tests fail");
		assert.strictEqual(command, "copilot -p 'Explain: why tests fail' || copilot -i 'Explain: why tests fail'");
	});

	it("executes explain command using copilot prompt mode", async () => {
		const { module } = loadCopilotCommandsModule({ cliCommand: "copilot" });
		const explainCommand = module.copilotCommands.find((cmd: any) => cmd.id === "copilot-explain");
		assert.ok(explainCommand, "Expected copilot-explain command");

		const run = sandbox.stub();
		await explainCommand.execute({
			args: { wildcards: ["why tests fail"] },
			terminal: { run },
		});

		assert.strictEqual(run.calledOnce, true);
		assert.strictEqual(
			run.firstCall.args[0],
			"copilot -p 'Explain: why tests fail' || copilot -i 'Explain: why tests fail'",
		);
	});

	it("opens chat using first available command id", async () => {
		const { module, executeCommand, getCommands } = loadCopilotCommandsModule({
			availableCommands: ["workbench.action.chat.open"],
		});

		const openCommand = module.copilotChatCommands.find((cmd: any) => cmd.id === "copilot-chat-open");
		assert.ok(openCommand, "Expected copilot-chat-open command");

		await openCommand.execute();

		assert.strictEqual(getCommands.calledOnceWithExactly(true), true);
		assert.strictEqual(executeCommand.calledOnceWithExactly("workbench.action.chat.open"), true);
	});
});
