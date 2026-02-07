import * as assert from "assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as sinon from "sinon";
import * as proxyquire from "proxyquire";
import { SecretStorageHelper } from "../../../../src/utils/secretStorage";

// Mock the Mistral SDK instance
const mockMistralInstance = {
	audio: {
		transcriptions: {
			complete: sinon.stub(),
		},
	},
};

// Mock Mistral constructor
const mockMistralConstructor = sinon.stub().returns(mockMistralInstance);

// Mock SecretStorageHelper
const mockSecretStorage = {
	getApiKey: sinon.stub(),
	setApiKey: sinon.stub(),
	deleteApiKey: sinon.stub(),
};

// Use proxyquire to load MistralProvider with mocked dependencies
const mistralProviderModule = proxyquire.noCallThru()("../../../../src/services/providers/mistralProvider", {
	"@mistralai/mistralai": {
		__esModule: true,
		Mistral: mockMistralConstructor,
	},
});
const { MistralProvider } = mistralProviderModule;

describe("MistralProvider", () => {
	let mistralProvider: any;
	let secretStorageGetInstanceStub: sinon.SinonStub;

	beforeEach(() => {
		// Create a new instance for each test
		mistralProvider = new MistralProvider();

		// Setup SecretStorageHelper mock
		secretStorageGetInstanceStub = sinon
			.stub(SecretStorageHelper, "getInstance")
			.returns(mockSecretStorage as unknown as SecretStorageHelper);
	});

	afterEach(() => {
		// Restore all stubs
		sinon.restore();
		mockMistralInstance.audio.transcriptions.complete.reset();
		mockSecretStorage.getApiKey.reset();
		// Reset call count but keep the return value
		mockMistralConstructor.resetHistory();
	});

	describe("transcribe", () => {
		it("should successfully transcribe audio when API key is present", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const expectedTranscription = "Hello, this is a test transcription";

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockMistralInstance.audio.transcriptions.complete.resolves({ text: expectedTranscription });

			// Act
			const result = await mistralProvider.transcribe(audioBuffer);

			// Assert
			assert.strictEqual(result, expectedTranscription);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("mistral"), true);
			assert.strictEqual(mockMistralInstance.audio.transcriptions.complete.calledOnce, true);
			assert.strictEqual(mockMistralConstructor.calledOnce, true);
			assert.strictEqual(mockMistralConstructor.calledWith({ apiKey }), true);

			const callArgs = mockMistralInstance.audio.transcriptions.complete.getCall(0).args[0];
			assert.strictEqual(callArgs.model, "voxtral-mini-latest");
			assert.ok(callArgs.file); // File should be present
			assert.ok(callArgs.file.content); // File content should be present
			assert.strictEqual(callArgs.file.fileName, "audio.wav");
		});

		it("should throw error when API key is missing", async () => {
			// Arrange
			const audioBuffer = Buffer.from("test audio data");
			mockSecretStorage.getApiKey.resolves(undefined);

			// Act & Assert
			try {
				await mistralProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Mistral API key not found"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockMistralInstance.audio.transcriptions.complete.called, false);
				assert.strictEqual(mockMistralConstructor.called, false);
			}
		});

		it("should throw error when API returns 401 (Unauthorized)", async () => {
			// Arrange
			const apiKey = "invalid-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError: any = new Error("Unauthorized");
			apiError.statusCode = 401;

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockMistralInstance.audio.transcriptions.complete.rejects(apiError);

			// Act & Assert
			try {
				await mistralProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Invalid Mistral API key"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockMistralInstance.audio.transcriptions.complete.calledOnce, true);
			}
		});

		it("should throw error when API returns 429 (Rate Limit)", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError: any = new Error("Rate limit exceeded");
			apiError.statusCode = 429;

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockMistralInstance.audio.transcriptions.complete.rejects(apiError);

			// Act & Assert
			try {
				await mistralProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Mistral API rate limit exceeded"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockMistralInstance.audio.transcriptions.complete.calledOnce, true);
			}
		});

		it("should throw generic error for other API errors", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError = new Error("Network error");

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockMistralInstance.audio.transcriptions.complete.rejects(apiError);

			// Act & Assert
			try {
				await mistralProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Transcription failed"));
				assert.ok(error.message.includes("Network error"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockMistralInstance.audio.transcriptions.complete.calledOnce, true);
			}
		});

		it("should reuse Mistral instance when already initialized", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer1 = Buffer.from("test audio data 1");
			const audioBuffer2 = Buffer.from("test audio data 2");
			const transcription1 = "First transcription";
			const transcription2 = "Second transcription";

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockMistralInstance.audio.transcriptions.complete
				.onFirstCall()
				.resolves({ text: transcription1 })
				.onSecondCall()
				.resolves({ text: transcription2 });

			// Act
			const result1 = await mistralProvider.transcribe(audioBuffer1);
			const result2 = await mistralProvider.transcribe(audioBuffer2);

			// Assert
			assert.strictEqual(result1, transcription1);
			assert.strictEqual(result2, transcription2);
			// Mistral constructor should only be called once (when first transcribe is called)
			assert.strictEqual(mockMistralConstructor.calledOnce, true);
			assert.strictEqual(mockMistralInstance.audio.transcriptions.complete.calledTwice, true);
		});
	});

	describe("validateApiKey", () => {
		it("should return true when API key exists", async () => {
			// Arrange
			mockSecretStorage.getApiKey.resolves("test-api-key");

			// Act
			const result = await mistralProvider.validateApiKey();

			// Assert
			assert.strictEqual(result, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("mistral"), true);
		});

		it("should return false when API key does not exist", async () => {
			// Arrange
			mockSecretStorage.getApiKey.resolves(undefined);

			// Act
			const result = await mistralProvider.validateApiKey();

			// Assert
			assert.strictEqual(result, false);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("mistral"), true);
		});
	});

	describe("getName", () => {
		it("should return correct provider name", () => {
			// Act
			const name = mistralProvider.getName();

			// Assert
			assert.strictEqual(name, "Mistral Voxtral");
		});
	});

	describe("dispose", () => {
		it("should clean up Mistral instance", () => {
			// Act & Assert - verify dispose doesn't throw
			assert.doesNotThrow(() => mistralProvider.dispose());
		});
	});
});
