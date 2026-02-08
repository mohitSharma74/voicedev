/**
 * Command Center Webview Panel
 * Displays all available voice commands in a searchable interface
 */

import * as vscode from "vscode";
import { getCommandRegistry } from "@commands/index";
import { CommandCategory } from "@commands/types";
import { getCommandCenterHtml } from "./commandCenterHtml";
import { isCommandDisabled } from "@services/commandSettings";

/**
 * Display-safe command data (without execute function)
 */
export interface CommandDisplayData {
	id: string;
	triggers: string[];
	description: string;
	category: CommandCategory;
	requiresCopilot: boolean;
	disabled: boolean;
}

/**
 * Manages the Command Center webview panel
 */
export class CommandCenterPanel {
	public static currentPanel: CommandCenterPanel | undefined;
	private static readonly viewType = "voicedev.commandCenter";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	/**
	 * Creates or reveals the Command Center panel
	 */
	public static createOrShow(extensionUri: vscode.Uri): void {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		// If panel exists, reveal it
		if (CommandCenterPanel.currentPanel) {
			CommandCenterPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Create new panel
		const panel = vscode.window.createWebviewPanel(
			CommandCenterPanel.viewType,
			"VoiceDev Command Center",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri],
			},
		);

		CommandCenterPanel.currentPanel = new CommandCenterPanel(panel, extensionUri);
	}

	public static refreshIfOpen(): void {
		CommandCenterPanel.currentPanel?.refresh();
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set initial HTML content
		this._update();

		// Handle panel disposal
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from webview
		this._panel.webview.onDidReceiveMessage(
			(message: { type: string }) => this._handleMessage(message),
			null,
			this._disposables,
		);
	}

	/**
	 * Updates the webview content
	 */
	private _update(): void {
		const commands = this._getCommandData();
		const extension = vscode.extensions.getExtension("mohitSharma74.voicedev");
		const version = extension?.packageJSON ? (extension.packageJSON as { version?: string }).version : undefined;
		this._panel.webview.html = getCommandCenterHtml(this._panel.webview, this._extensionUri, commands, version);
	}

	public refresh(): void {
		this._update();
	}

	/**
	 * Gets command data from registry in display-safe format
	 */
	private _getCommandData(): CommandDisplayData[] {
		const registry = getCommandRegistry();
		return registry.getAll().map((cmd) => ({
			id: cmd.id,
			triggers: cmd.triggers,
			description: cmd.description,
			category: cmd.category,
			requiresCopilot: cmd.requiresCopilot ?? false,
			disabled: isCommandDisabled(cmd.id),
		}));
	}

	/**
	 * Handles messages from the webview
	 */
	private _handleMessage(message: { type: string }): void {
		switch (message.type) {
			case "refresh":
				this._update();
				break;
		}
	}

	/**
	 * Disposes the panel and cleans up resources
	 */
	public dispose(): void {
		CommandCenterPanel.currentPanel = undefined;
		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}
