// eslint-disable @typescript-eslint/no-explicit-any

import * as assert from "assert";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
	insertOrSendText,
	insertTranscribedText,
	sendToTerminal,
	calculateEndPosition,
} from "../../../src/utils/textInsertion";

interface MockTextEditorEdit {
	insert(position: vscode.Position, value: string): void;
	replace: sinon.SinonStub;
}

describe("Text Insertion Utility", () => {
	let sandbox: sinon.SinonSandbox;
	let mockEditor: sinon.SinonStubbedInstance<vscode.TextEditor>;
	let mockTerminal: sinon.SinonStubbedInstance<vscode.Terminal>;
	let mockWindow: {
		activeTextEditor: vscode.TextEditor | undefined;
		activeTerminal: vscode.Terminal | undefined;
	};

	beforeEach(() => {
		sandbox = sinon.createSandbox();

		// Mock window.activeTextEditor and window.activeTerminal
		mockWindow = {
			activeTextEditor: undefined as vscode.TextEditor | undefined,
			activeTerminal: undefined as vscode.Terminal | undefined,
		};

		// Stub vscode.window
		sandbox.stub(vscode.window, "activeTextEditor").get(() => mockWindow.activeTextEditor);
		sandbox.stub(vscode.window, "activeTerminal").get(() => mockWindow.activeTerminal);
	});

	afterEach(() => {
		sandbox.restore();
	});

	// ===== Editor Context Tests =====

	describe("insertTranscribedText", () => {
		beforeEach(() => {
			// Create mock editor
			mockEditor = {
				selection: new vscode.Selection(0, 0, 0, 0),
				edit: sandbox.stub().resolves(true),
			} as sinon.SinonStubbedInstance<vscode.TextEditor>;
		});

		it("should insert text at cursor position when no selection", async () => {
			// Arrange
			const text = "Hello world";
			const cursorPos = new vscode.Position(0, 0);
			mockEditor.selection = new vscode.Selection(cursorPos, cursorPos);

			let capturedEditCallback: any;
			(mockEditor.edit as sinon.SinonStub).callsFake((callback: (editBuilder: MockTextEditorEdit) => void) => {
				const mockEditBuilder = {
					insert: sandbox.stub(),
					replace: sandbox.stub(),
				};
				capturedEditCallback = () => callback(mockEditBuilder);
				return Promise.resolve(true);
			});

			// Act
			await insertTranscribedText(text, mockEditor);

			// Assert
			assert.strictEqual((mockEditor.edit as sinon.SinonStub).calledOnce, true);
			capturedEditCallback(); // Execute the callback to test it
		});

		it("should replace selected text when selection exists", async () => {
			// Arrange
			const text = "bar";
			const startPos = new vscode.Position(0, 0);
			const endPos = new vscode.Position(0, 3);
			mockEditor.selection = new vscode.Selection(startPos, endPos);

			let insertCalled = false;
			const replaceCalled = false;

			(mockEditor.edit as sinon.SinonStub).callsFake((callback: (editBuilder: MockTextEditorEdit) => void) => {
				const mockEditBuilder: MockTextEditorEdit = {
					insert: () => {
						insertCalled = true;
					},
					replace: sandbox.stub(),
				};
				callback(mockEditBuilder);
				return Promise.resolve(true);
			});

			// Act
			await insertTranscribedText(text, mockEditor);

			// Assert
			assert.strictEqual((mockEditor.edit as sinon.SinonStub).calledOnce, true);
			assert.strictEqual(replaceCalled, true, "Replace should be called for selection");
			assert.strictEqual(insertCalled, false, "Insert should not be called for selection");
		});

		it("should handle multi-line text correctly", async () => {
			// Arrange
			const text = "Line 1\nLine 2\nLine 3";
			const cursorPos = new vscode.Position(0, 0);
			mockEditor.selection = new vscode.Selection(cursorPos, cursorPos);

			(mockEditor.edit as sinon.SinonStub).resolves(true);

			// Act
			await insertTranscribedText(text, mockEditor);

			// Assert
			assert.strictEqual((mockEditor.edit as sinon.SinonStub).calledOnce, true);
		});

		it("should throw error when editor is read-only", async () => {
			// Arrange
			const text = "Test text";
			const cursorPos = new vscode.Position(0, 0);
			mockEditor.selection = new vscode.Selection(cursorPos, cursorPos);
			(mockEditor.edit as sinon.SinonStub).resolves(false); // Edit fails

			// Act & Assert
			try {
				await insertTranscribedText(text, mockEditor);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("read-only"));
			}
		});

		it("should move cursor to end of inserted single-line text", async () => {
			// Arrange
			const text = "Hello";
			const cursorPos = new vscode.Position(5, 10);
			mockEditor.selection = new vscode.Selection(cursorPos, cursorPos);
			(mockEditor.edit as sinon.SinonStub).resolves(true);

			// Act
			await insertTranscribedText(text, mockEditor);

			// Assert
			// Check that selection was set (cursor moved)
			assert.ok(mockEditor.selection);
			const expectedPos = new vscode.Position(5, 15); // Line 5, char 10 + 5
			assert.strictEqual(mockEditor.selection.active.line, expectedPos.line);
			assert.strictEqual(mockEditor.selection.active.character, expectedPos.character);
		});

		it("should move cursor to end of inserted multi-line text", async () => {
			// Arrange
			const text = "Line 1\nLine 2";
			const cursorPos = new vscode.Position(0, 0);
			mockEditor.selection = new vscode.Selection(cursorPos, cursorPos);
			(mockEditor.edit as sinon.SinonStub).resolves(true);

			// Act
			await insertTranscribedText(text, mockEditor);

			// Assert
			const expectedPos = new vscode.Position(1, 6); // Line 1, char 6 (length of "Line 2")
			assert.strictEqual(mockEditor.selection.active.line, expectedPos.line);
			assert.strictEqual(mockEditor.selection.active.character, expectedPos.character);
		});
	});

	// ===== Terminal Context Tests =====

	describe("sendToTerminal", () => {
		beforeEach(() => {
			// Create mock terminal
			mockTerminal = {
				sendText: sandbox.stub(),
				show: sandbox.stub(),
			} as sinon.SinonStubbedInstance<vscode.Terminal>;
		});

		it("should send text to terminal without auto-execution", () => {
			// Arrange
			const text = "npm run test";

			// Act
			sendToTerminal(text, mockTerminal);

			// Assert
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledOnce, true);
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledWith(text, false), true);
		});

		it("should make terminal visible after sending text", () => {
			// Arrange
			const text = "echo hello";

			// Act
			sendToTerminal(text, mockTerminal);

			// Assert
			assert.strictEqual((mockTerminal.show as sinon.SinonStub).calledOnce, true);
			assert.strictEqual((mockTerminal.show as sinon.SinonStub).calledWith(false), true);
		});

		it("should handle multi-line terminal text", () => {
			// Arrange
			const text = "cd /tmp\nls -la";

			// Act
			sendToTerminal(text, mockTerminal);

			// Assert
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledOnce, true);
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledWith(text, false), true);
		});

		it("should throw error when terminal sendText fails", () => {
			// Arrange
			const text = "test command";
			(mockTerminal.sendText as sinon.SinonStub).throws(new Error("Terminal error"));

			// Act & Assert
			try {
				sendToTerminal(text, mockTerminal);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Terminal is no longer available"));
			}
		});
	});

	// ===== Context Detection Tests =====

	describe("insertOrSendText", () => {
		beforeEach(() => {
			// Create mocks
			mockEditor = {
				selection: new vscode.Selection(0, 0, 0, 0),
				edit: sandbox.stub().resolves(true),
			} as sinon.SinonStubbedInstance<vscode.TextEditor>;

			mockTerminal = {
				sendText: sandbox.stub(),
				show: sandbox.stub(),
			} as sinon.SinonStubbedInstance<vscode.Terminal>;
		});

		it("should prefer editor when both editor and terminal are active", async () => {
			// Arrange
			const text = "test text";
			mockWindow.activeTextEditor = mockEditor;
			mockWindow.activeTerminal = mockTerminal;

			// Act
			await insertOrSendText(text);

			// Assert
			assert.strictEqual((mockEditor.edit as sinon.SinonStub).calledOnce, true);
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).called, false);
		});

		it("should use terminal when only terminal is active", async () => {
			// Arrange
			const text = "npm install";
			mockWindow.activeTextEditor = undefined;
			mockWindow.activeTerminal = mockTerminal;

			// Act
			await insertOrSendText(text);

			// Assert
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledOnce, true);
			assert.strictEqual((mockTerminal.sendText as sinon.SinonStub).calledWith("npm install", false), true);
		});

		it("should throw error when neither editor nor terminal is active", async () => {
			// Arrange
			const text = "test text";
			mockWindow.activeTextEditor = undefined;
			mockWindow.activeTerminal = undefined;

			// Act & Assert
			try {
				await insertOrSendText(text);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("No active editor or terminal"));
			}
		});

		it("should trim whitespace from transcription", async () => {
			// Arrange
			const text = "  hello world  \n";
			mockWindow.activeTextEditor = mockEditor;

			let capturedText: string | undefined;

			(mockEditor.edit as sinon.SinonStub).callsFake((callback: (editBuilder: MockTextEditorEdit) => void) => {
				const mockEditBuilder: MockTextEditorEdit = {
					insert: (pos: vscode.Position, t: string) => {
						capturedText = t;
					},
					replace: sandbox.stub(),
				};
				callback(mockEditBuilder);
				return Promise.resolve(true);
			});

			// Act
			await insertOrSendText(text);

			// Assert
			assert.strictEqual(capturedText, "hello world", "Text should be trimmed");
		});

		it("should throw error when text is empty after trimming", async () => {
			// Arrange
			const text = "   \n  \t  ";
			mockWindow.activeTextEditor = mockEditor;

			// Act & Assert
			try {
				await insertOrSendText(text);
				assert.fail("Expected error to be thrown");
			} catch (error: any) {
				assert.ok(error instanceof Error);
				assert.ok(error.message.includes("Transcription was empty"));
			}
		});
	});

	// ===== Helper Function Tests =====

	describe("calculateEndPosition", () => {
		it("should calculate correct position for single-line text", () => {
			// Arrange
			const startPos = new vscode.Position(5, 10);
			const text = "Hello";

			// Act
			const endPos = calculateEndPosition(startPos, text);

			// Assert
			assert.strictEqual(endPos.line, 5);
			assert.strictEqual(endPos.character, 15); // 10 + 5
		});

		it("should calculate correct position for multi-line text", () => {
			// Arrange
			const startPos = new vscode.Position(2, 0);
			const text = "Line 1\nLine 2\nLine 3";

			// Act
			const endPos = calculateEndPosition(startPos, text);

			// Assert
			assert.strictEqual(endPos.line, 4); // 2 + 2 (two newlines)
			assert.strictEqual(endPos.character, 6); // Length of "Line 3"
		});

		it("should handle text with only one newline at end", () => {
			// Arrange
			const startPos = new vscode.Position(0, 0);
			const text = "Hello\n";

			// Act
			const endPos = calculateEndPosition(startPos, text);

			// Assert
			assert.strictEqual(endPos.line, 1); // Moved to next line
			assert.strictEqual(endPos.character, 0); // Empty line after newline
		});

		it("should handle empty string", () => {
			// Arrange
			const startPos = new vscode.Position(3, 7);
			const text = "";

			// Act
			const endPos = calculateEndPosition(startPos, text);

			// Assert
			assert.strictEqual(endPos.line, 3); // Same line
			assert.strictEqual(endPos.character, 7); // Same position
		});

		it("should handle text with multiple consecutive newlines", () => {
			// Arrange
			const startPos = new vscode.Position(0, 0);
			const text = "First\n\n\nLast";

			// Act
			const endPos = calculateEndPosition(startPos, text);

			// Assert
			assert.strictEqual(endPos.line, 3); // 0 + 3 newlines
			assert.strictEqual(endPos.character, 4); // Length of "Last"
		});
	});
});
