"use strict";
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v });
			}
		: function (o, v) {
				o["default"] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const mocha_1 = require("mocha");
const sinon = __importStar(require("sinon"));
const proxyquire = __importStar(require("proxyquire"));
const secretStorage_1 = require("../../../../src/utils/secretStorage");
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
const { GroqProvider } = proxyquire.noCallThru()("../../../../src/services/providers/groqProvider", {
	"groq-sdk": {
		default: mockGroqConstructor,
		"@noCallThru": true,
	},
});
(0, mocha_1.describe)("GroqProvider", () => {
	let groqProvider;
	let secretStorageGetInstanceStub;
	(0, mocha_1.beforeEach)(() => {
		// Create a new instance for each test
		groqProvider = new GroqProvider();
		// Setup SecretStorageHelper mock
		secretStorageGetInstanceStub = sinon
			.stub(secretStorage_1.SecretStorageHelper, "getInstance")
			.returns(mockSecretStorage);
	});
	(0, mocha_1.afterEach)(() => {
		// Restore all stubs
		sinon.restore();
		mockGroqInstance.audio.transcriptions.create.reset();
		mockSecretStorage.getApiKey.reset();
		mockGroqConstructor.reset();
	});
	(0, mocha_1.describe)("transcribe", () => {
		(0, mocha_1.it)("should successfully transcribe audio when API key is present", async () => {
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
		(0, mocha_1.it)("should throw error when API key is missing", async () => {
			// Arrange
			const audioBuffer = Buffer.from("test audio data");
			mockSecretStorage.getApiKey.resolves(undefined);
			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Groq API key not found"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.called, false);
				assert.strictEqual(mockGroqConstructor.called, false);
			}
		});
		(0, mocha_1.it)("should throw error when API returns 401 (Unauthorized)", async () => {
			// Arrange
			const apiKey = "invalid-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError = new Error("Unauthorized");
			apiError.status = 401;
			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create.rejects(apiError);
			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Invalid Groq API key"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			}
		});
		(0, mocha_1.it)("should throw error when API returns 429 (Rate Limit)", async () => {
			// Arrange
			const apiKey = "test-api-key";
			const audioBuffer = Buffer.from("test audio data");
			const apiError = new Error("Rate limit exceeded");
			apiError.status = 429;
			mockSecretStorage.getApiKey.resolves(apiKey);
			mockGroqInstance.audio.transcriptions.create.rejects(apiError);
			// Act & Assert
			try {
				await groqProvider.transcribe(audioBuffer);
				assert.fail("Expected error to be thrown");
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Groq API rate limit exceeded"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			}
		});
		(0, mocha_1.it)("should throw generic error for other API errors", async () => {
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
			} catch (error) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Transcription failed"));
				assert.ok(error.message.includes("Network error"));
				assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
				assert.strictEqual(mockGroqInstance.audio.transcriptions.create.calledOnce, true);
			}
		});
		(0, mocha_1.it)("should reuse Groq instance when already initialized", async () => {
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
	(0, mocha_1.describe)("validateApiKey", () => {
		(0, mocha_1.it)("should return true when API key exists", async () => {
			// Arrange
			mockSecretStorage.getApiKey.resolves("test-api-key");
			// Act
			const result = await groqProvider.validateApiKey();
			// Assert
			assert.strictEqual(result, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledOnce, true);
			assert.strictEqual(mockSecretStorage.getApiKey.calledWith("groq"), true);
		});
		(0, mocha_1.it)("should return false when API key does not exist", async () => {
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
	(0, mocha_1.describe)("getName", () => {
		(0, mocha_1.it)("should return correct provider name", () => {
			// Act
			const name = groqProvider.getName();
			// Assert
			assert.strictEqual(name, "Groq Whisper");
		});
	});
	(0, mocha_1.describe)("dispose", () => {
		(0, mocha_1.it)("should clean up Groq instance", () => {
			// Act & Assert - verify dispose doesn't throw
			assert.doesNotThrow(() => groqProvider.dispose());
		});
	});
});
//# sourceMappingURL=groqProvider.test.js.map
