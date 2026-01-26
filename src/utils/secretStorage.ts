import * as vscode from "vscode";

export class SecretStorageHelper {
	private static instance: SecretStorageHelper;
	private secretStorage: vscode.SecretStorage;

	private constructor(context: vscode.ExtensionContext) {
		this.secretStorage = context.secrets;
	}

	static init(context: vscode.ExtensionContext): void {
		SecretStorageHelper.instance = new SecretStorageHelper(context);
	}

	static getInstance(): SecretStorageHelper {
		if (!SecretStorageHelper.instance) {
			throw new Error("SecretStorageHelper not initialized");
		}
		return SecretStorageHelper.instance;
	}

	async getApiKey(provider: string): Promise<string | undefined> {
		return await this.secretStorage.get(`voicedev.${provider}.apiKey`);
	}

	async setApiKey(provider: string, key: string): Promise<void> {
		await this.secretStorage.store(`voicedev.${provider}.apiKey`, key);
	}

	async deleteApiKey(provider: string): Promise<void> {
		await this.secretStorage.delete(`voicedev.${provider}.apiKey`);
	}
}
