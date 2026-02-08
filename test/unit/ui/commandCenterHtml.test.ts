// eslint-disable @typescript-eslint/no-explicit-any

import * as assert from "assert";
import { describe, it } from "mocha";
import proxyquire from "proxyquire";

describe("Command Center HTML", () => {
	it("includes CSP image source and renders a logo without inline handlers", () => {
		const module = proxyquire.noCallThru()("../../../src/ui/commandCenter/commandCenterHtml", {
			vscode: {
				Uri: {
					joinPath: (_extensionUri: unknown, ...segments: string[]) => ({ path: segments.join("/") }),
				},
			},
		});

		const webview = {
			cspSource: "vscode-webview:",
			asWebviewUri: (uri: { path: string }) => ({ toString: () => `webview://${uri.path}` }),
		};

		const html = module.getCommandCenterHtml(webview as any, {} as any, [
			{
				id: "list-commands",
				triggers: ["list commands"],
				description: "Show all available voice commands",
				category: "system",
				requiresCopilot: false,
				disabled: false,
			},
		]);

		assert.ok(html.includes("img-src vscode-webview: data:"));
		assert.ok(html.includes('src="webview://media/assets/logo-128x128.png"'));
		assert.strictEqual(html.includes("onerror="), false);
	});
});
