import * as assert from "assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as sinon from "sinon";
import * as proxyquire from "proxyquire";
import { SecretStorageHelper } from "../../../../src/utils/secretStorage";

// Mock the Groq SDK instance
const mockGroqInstance = {
	audio: {
		transcriptions: {
			create: sinon.stub(),
		},
	},
};

// Mock Groq constructor
const mockGroqConstructor = sinon.stub().returns(mockGroqInstance);

// Mock SecretStorageHelper
const mockSecretStorage = {
	getApiKey: sinon.stub(),
	setApiKey: sinon.stub(),
	deleteApiKey: sinon.stub(),
};

// Use proxyquire to load GroqProvider with mocked dependencies
// Note: For ES modules, we need to handle the default export properly
const groqProviderModule = proxyquire.noCallThru()("../../../../src/services/providers/groqProvider", {
	"groq-sdk": {
		__esModule: true,
		default: mockGroqConstructor,
	},
});
const { GroqProvider } = groqProviderModule;

describe("GroqProvider", () => {
	let groqProvider: any;
	let secretStorageGetInstanceStub: sinon.SinonStub;

	beforeEach(() => {
		// Create a new instance for each test
		groqProvider = new GroqProvider();

		// Setup SecretStorageHelper mock
		secretStorageGetInstanceStub = sinon.stub(SecretStorageHelper, "getInstance").returns(mockSecretStorage as any);
	});

	afterEach(() => {
		// Restore all stubs
		sinon.restore();
		mockGroqInstance.audio.transcriptions.create.reset();
		mockSecretStorage.getApiKey.reset();
		mockGroqConstructor.reset();
	});

	describe("transcribe", () => {
		it("should successfully transcribe audio when API key is present", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const expectedTranscription = "Hello, this is a test transcription";

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create.resolves(expectedTranscription);

			// Act
			const result = await groqProvider.transcribe(audioBuffer);

			// Assert
			assert.strictEqual(result, expectedTranscription);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("groq"), true);
			assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			assert.strictEqual(mockGroqConstructor.calledOnce, true);
			assert.strictEqual(mockGroqConstructor.calledWith({ apiKey }), true);

			const callArgs = mockGroqInstance.audio.transcriptions.create.getCall(0).args[0];
			assert.strictEqual(callArgs.model, "whisper-large-v3");
			assert.strictEqual(callArgs.language, "en");
			assert.strictEqual(callArgs.response_format, "text");
			assert.ok(callArgs.file); // File should be present
		});

		it("should throw error when API key is missing", async () => {
			// Arrange
			const audioBuffer = Buffer.from("test audio data");
			mockSecretStorage.getApiKey.resolves(undefined);

			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Groq API key not found"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.called, false);
				assert.strictEqual(mockGroqConstructor.called, false);
			}
		});

		it("should throw error when API returns 401 (Unauthorized)", async () => {
			// Arrange
			const apiKey = "invalid-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError: any = new Error("Unauthorized");
			apiError.status = 401;

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create.rejects(apiError);

			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Invalid Groq API key"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			}
		});

		it("should throw error when API returns 429 (Rate Limit)", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError: any = new Error("Rate limit exceeded");
			apiError.status = 429;

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create.rejects(apiError);

			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Groq API rate limit exceeded"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			}
		});

		it("should throw generic error for other API errors", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError = new Error("Network error");

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create.rejects(apiError);

			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Transcription failed"));
				assert.ok(error.message.includes("Network error"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			}
		});

		it("should reuse Groq instance when already initialized", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer1 = Buffer.from("test audio data 1");
			const audioBuffer2 = Buffer.from("test audio data 2");
			const transcription1 = "First transcription";
			const transcription2 = "Second transcription";

			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create
				.onFirstCall()
				.resolves(transcription1)
				.onSecondCall()
				.resolves(transcription2);

			// Act
			const result1 = await groqProvider.transcribe(audioBuffer1);
			const result2 = await groqProvider.transcribe(audioBuffer2);

			// Assert
			assert.strictEqual(result1, transcription1);
			assert.strictEqual(result2, transcription2);
			// Groq constructor should only be called once (when first transcribe is called)
			assert.strictEqual(mockGroqConstructor.calledOnce, true);
			assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledTwice, true);
		});
	});

	describe("validateApiKey", () => {
		it("should return true when API key exists", async () => {
			// Arrange
			mockSecretStorage.getApiKey.resolves("test-api-key");

			// Act
			const result = await groqProvider.validateApiKey();

			// Assert
			assert.strictEqual(result, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("groq"), true);
		});

		it("should return false when API key does not exist", async () => {
			// Arrange
			mockSecretStorage.getApiKey.resolves(undefined);

			// Act
			const result = await groqProvider.validateApiKey();

			// Assert
			assert.strictEqual(result, false);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("groq"), true);
		});
	});

	describe("getName", () => {
		it("should return correct provider name", () => {
			// Act
			const name = groqProvider.getName();

			// Assert
			assert.strictEqual(name, "Groq Whisper");
		});
	});

	describe("dispose", () => {
		it("should clean up Groq instance", () => {
			// Act & Assert - verify dispose doesn't throw
			assert.doesNotThrow(() => groqProvider.dispose());
		});
	});
});
