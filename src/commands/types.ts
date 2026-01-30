/**
 * Voice Command Types
 * Defines the interfaces for the voice command system
 */

/**
 * Categories for organizing voice commands
 */
export type CommandCategory = "editor" | "git" | "terminal" | "navigation" | "system";

/**
 * Terminal helper interface for running commands in the integrated terminal
 */
export interface TerminalHelper {
	run(command: string, options?: { name?: string; execute?: boolean; focus?: boolean }): void;
}

/**
 * File helper interface for file picker operations
 */
export interface FileHelper {
	pickFile(options?: { title?: string }): Promise<string | undefined>;
	getActiveFilePath(): string | undefined;
}

/**
 * Execution context passed to commands
 */
export interface ExecutionContext {
	args?: {
		wildcards: string[];
		originalText: string;
		matchedPattern: string;
	};
	terminal: TerminalHelper;
	files: FileHelper;
}

/**
 * Represents a voice command that can be executed
 */
export interface VoiceCommand {
	/** Unique identifier for the command */
	id: string;

	/** Array of trigger phrases that activate this command */
	triggers: string[];

	/** Human-readable description of what the command does */
	description: string;

	/** Optional keyboard shortcut hint */
	shortcut?: string;

	/** Category for organizing commands */
	category: CommandCategory;

	/** The action to perform when the command is triggered */
	execute: (ctx?: ExecutionContext) => Promise<void> | void;

	/** Flag for Copilot-dependent commands */
	requiresCopilot?: boolean;
}

/**
 * Result of parsing a voice transcription
 */
export interface ParsedResult {
	/** Whether this was recognized as a command or should be treated as dictation */
	type: "command" | "dictation";

	/** The matched command (only present if type is 'command') */
	command?: VoiceCommand;

	/** Confidence score from 0 to 1 (1 = perfect match) */
	confidence: number;

	/** The original transcribed text */
	originalText: string;

	/** The specific trigger phrase that was matched (if any) */
	matchedTrigger?: string;

	/** Extracted arguments from wildcard patterns */
	extractedArgs?: { wildcards: string[] };
}

/**
 * Configuration for the command parser
 */
export interface CommandParserConfig {
	/** Confidence threshold (0-1) above which a match is considered a command */
	confidenceThreshold: number;

	/** Fuse.js threshold for fuzzy matching (0 = exact, 1 = match anything) */
	fuseThreshold: number;
}

/**
 * Default parser configuration
 */
export const DEFAULT_PARSER_CONFIG: CommandParserConfig = {
	confidenceThreshold: 0.7,
	fuseThreshold: 0.3,
};
