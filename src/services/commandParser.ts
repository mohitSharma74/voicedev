/**
 * Command Parser
 * Parses transcribed voice input and matches it against registered commands
 * Uses Fuse.js for fuzzy matching and PatternMatcher for wildcard patterns
 */

import { VoiceCommand, ParsedResult, CommandParserConfig, DEFAULT_PARSER_CONFIG } from "@commands/types";
import { getCommandRegistry } from "@commands/registry";
import { getPatternMatcher } from "./patternMatcher";

/**
 * Internal type for fuse.js search items
 */
interface TriggerItem {
	trigger: string;
	command: VoiceCommand;
}

/**
 * Type for Fuse search result
 */
interface FuseSearchResult {
	item: TriggerItem;
	score?: number;
}

/**
 * Command Parser class
 * Responsible for matching voice transcriptions to commands
 */
export class CommandParser {
	// Using any for Fuse types due to ESM dynamic import complexity
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private fuse: any = null;
	private config: CommandParserConfig;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private FuseClass: any = null;
	private initialized: boolean = false;

	constructor(config: Partial<CommandParserConfig> = {}) {
		this.config = { ...DEFAULT_PARSER_CONFIG, ...config };
	}

	/**
	 * Initialize the parser by loading Fuse.js dynamically
	 * Must be called before using parse()
	 */
	async init(): Promise<void> {
		if (this.initialized) {
			return;
		}

		// Dynamic import of fuse.js (ESM module)
		const FuseModule = await import("fuse.js");
		this.FuseClass = FuseModule.default;
		this.initialized = true;
	}

	/**
	 * Initialize or refresh the Fuse.js instance with current commands
	 * Should be called after commands are registered or when commands change
	 */
	refresh(): void {
		if (!this.FuseClass) {
			console.warn("CommandParser not initialized. Call init() first.");
			return;
		}

		const registry = getCommandRegistry();
		const triggers = registry.getAllTriggers();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		this.fuse = new this.FuseClass(triggers, {
			keys: ["trigger"],
			threshold: this.config.fuseThreshold,
			includeScore: true,
			ignoreLocation: true, // Match anywhere in the string
			minMatchCharLength: 2,
		});
	}

	/**
	 * Check if the parser is ready to use
	 */
	isReady(): boolean {
		return this.initialized && this.fuse !== null;
	}

	/**
	 * Parse a transcribed text and determine if it's a command or dictation
	 * @param text The transcribed voice input
	 * @returns ParsedResult indicating command match or dictation
	 */
	parse(text: string): ParsedResult {
		const normalizedText = this.normalizeText(text);

		// If not initialized or no fuse, treat as dictation
		if (!this.fuse) {
			return {
				type: "dictation",
				confidence: 0,
				originalText: text,
			};
		}

		// First: Check wildcard patterns
		const registry = getCommandRegistry();
		const patternMatcher = getPatternMatcher();
		const patternResult = patternMatcher.match(normalizedText, registry.getAll());

		if (patternResult.matched && patternResult.command) {
			return {
				type: "command",
				command: patternResult.command,
				confidence: patternResult.confidence,
				originalText: text,
				matchedTrigger: patternResult.pattern,
				extractedArgs: { wildcards: patternResult.wildcards },
			};
		}

		// Second: Search for matching commands using Fuse.js
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const results = this.fuse.search(normalizedText) as FuseSearchResult[];

		if (results.length === 0) {
			return {
				type: "dictation",
				confidence: 0,
				originalText: text,
			};
		}

		// Get the best match
		const bestMatch = results[0];
		const fuseScore = bestMatch.score ?? 1;

		// Convert fuse score (0 = perfect, 1 = worst) to confidence (1 = perfect, 0 = worst)
		const confidence = 1 - fuseScore;

		// Check if confidence meets threshold
		if (confidence >= this.config.confidenceThreshold) {
			return {
				type: "command",
				command: bestMatch.item.command,
				confidence,
				originalText: text,
				matchedTrigger: bestMatch.item.trigger,
			};
		}

		// Below threshold, treat as dictation
		return {
			type: "dictation",
			confidence,
			originalText: text,
			matchedTrigger: bestMatch.item.trigger, // Include for debugging
		};
	}

	/**
	 * Normalize text for better matching
	 * - Convert to lowercase
	 * - Trim whitespace
	 * - Remove extra spaces
	 * - Remove punctuation
	 */
	private normalizeText(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[.,!?;:'"]/g, "") // Remove punctuation
			.replace(/\s+/g, " "); // Collapse multiple spaces
	}

	/**
	 * Get multiple potential matches for debugging/UI purposes
	 * @param text The transcribed text
	 * @param limit Maximum number of results
	 * @returns Array of potential matches with confidence scores
	 */
	getSuggestions(text: string, limit: number = 5): ParsedResult[] {
		const normalizedText = this.normalizeText(text);

		if (!this.fuse) {
			return [];
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const results = this.fuse.search(normalizedText, { limit }) as FuseSearchResult[];

		return results.map((result: FuseSearchResult) => ({
			type: "command" as const,
			command: result.item.command,
			confidence: 1 - (result.score ?? 1),
			originalText: text,
			matchedTrigger: result.item.trigger,
		}));
	}

	/**
	 * Update the confidence threshold
	 */
	setConfidenceThreshold(threshold: number): void {
		if (threshold < 0 || threshold > 1) {
			throw new Error("Confidence threshold must be between 0 and 1");
		}
		this.config.confidenceThreshold = threshold;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): CommandParserConfig {
		return { ...this.config };
	}
}

// Export singleton instance
let parserInstance: CommandParser | null = null;

export function getCommandParser(): CommandParser {
	if (!parserInstance) {
		parserInstance = new CommandParser();
	}
	return parserInstance;
}

/**
 * Initialize the command parser singleton
 * Must be called during extension activation
 */
export async function initCommandParser(): Promise<CommandParser> {
	const parser = getCommandParser();
	await parser.init();
	return parser;
}

// Export for testing with custom config
export function createCommandParser(config?: Partial<CommandParserConfig>): CommandParser {
	return new CommandParser(config);
}
