/**
 * Pattern Matcher
 * Handles wildcard pattern matching for voice commands
 * Supports patterns like "ask copilot explain *" to capture variable text
 */

import { VoiceCommand } from "@commands/types";

/**
 * Result of a pattern match attempt
 */
export interface PatternMatchResult {
	/** Whether a match was found */
	matched: boolean;
	/** The matched command (if any) */
	command?: VoiceCommand;
	/** The pattern that matched (if any) */
	pattern?: string;
	/** The extracted wildcard values */
	wildcards: string[];
	/** Confidence score (1.0 = exact match) */
	confidence: number;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;

	if (len1 === 0 && len2 === 0) {
		return 1;
	}
	if (len1 === 0 || len2 === 0) {
		return 0;
	}

	// Create distance matrix
	const matrix: number[][] = [];
	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	// Fill the matrix
	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1, // deletion
				matrix[i][j - 1] + 1, // insertion
				matrix[i - 1][j - 1] + cost, // substitution
			);
		}
	}

	const distance = matrix[len1][len2];
	const maxLen = Math.max(len1, len2);
	return 1 - distance / maxLen;
}

/**
 * Pattern matcher class for wildcard command matching
 */
export class PatternMatcher {
	/** Minimum similarity threshold for fuzzy matching (85%) */
	private readonly SIMILARITY_THRESHOLD = 0.85;

	/**
	 * Match input text against commands with wildcard patterns
	 * @param input The normalized input text
	 * @param commands Array of commands to match against
	 * @returns PatternMatchResult with match details
	 */
	match(input: string, commands: VoiceCommand[]): PatternMatchResult {
		let bestMatch: PatternMatchResult | null = null;

		for (const command of commands) {
			for (const trigger of command.triggers) {
				// Skip non-wildcard patterns
				if (!trigger.includes("*")) {
					continue;
				}

				const result = this.matchPattern(input, trigger, command);
				if (result.matched) {
					// Keep the best match (highest confidence)
					if (!bestMatch || result.confidence > bestMatch.confidence) {
						bestMatch = result;
					}
				}
			}
		}

		if (bestMatch) {
			return bestMatch;
		}

		return {
			matched: false,
			wildcards: [],
			confidence: 0,
		};
	}

	/**
	 * Match input against a single wildcard pattern
	 * @param input The normalized input text
	 * @param pattern The pattern with wildcards (e.g., "ask copilot explain *")
	 * @param command The associated command
	 * @returns PatternMatchResult
	 */
	private matchPattern(input: string, pattern: string, command: VoiceCommand): PatternMatchResult {
		// Normalize the pattern
		const normalizedPattern = pattern.toLowerCase().trim();

		// Find the wildcard position
		const wildcardIndex = normalizedPattern.indexOf("*");
		if (wildcardIndex === -1) {
			// No wildcard, exact match required
			const similarity = calculateSimilarity(input, normalizedPattern);
			return {
				matched: similarity >= this.SIMILARITY_THRESHOLD,
				command: similarity >= this.SIMILARITY_THRESHOLD ? command : undefined,
				pattern: normalizedPattern,
				wildcards: [],
				confidence: similarity,
			};
		}

		// Split pattern into prefix (before *) and suffix (after *)
		const prefix = normalizedPattern.substring(0, wildcardIndex).trim();
		const suffix = normalizedPattern.substring(wildcardIndex + 1).trim();

		// Check if input starts with prefix (with fuzzy matching)
		const inputPrefix = input.substring(0, prefix.length);
		const prefixSimilarity = calculateSimilarity(inputPrefix, prefix);

		if (prefixSimilarity < this.SIMILARITY_THRESHOLD) {
			return {
				matched: false,
				wildcards: [],
				confidence: prefixSimilarity,
			};
		}

		// Extract the wildcard content
		let wildcardContent: string;
		let suffixSimilarity = 1;

		if (suffix.length === 0) {
			// Pattern ends with *, capture everything after prefix
			wildcardContent = input.substring(prefix.length).trim();
		} else {
			// Pattern has suffix, need to find where suffix starts in input
			const suffixStartIndex = input.indexOf(suffix, prefix.length);
			if (suffixStartIndex === -1) {
				// Suffix not found, try fuzzy matching on the end
				const minSuffixPos = Math.max(prefix.length, input.length - suffix.length - 50);
				let bestSuffixMatch = { index: -1, similarity: 0 };

				for (let i = minSuffixPos; i <= input.length - suffix.length; i++) {
					const candidateSuffix = input.substring(i, i + suffix.length);
					const similarity = calculateSimilarity(candidateSuffix, suffix);
					if (similarity > bestSuffixMatch.similarity) {
						bestSuffixMatch = { index: i, similarity };
					}
				}

				if (bestSuffixMatch.similarity < this.SIMILARITY_THRESHOLD) {
					return {
						matched: false,
						wildcards: [],
						confidence: bestSuffixMatch.similarity,
					};
				}

				wildcardContent = input.substring(prefix.length, bestSuffixMatch.index).trim();
				suffixSimilarity = bestSuffixMatch.similarity;
			} else {
				wildcardContent = input.substring(prefix.length, suffixStartIndex).trim();
				// Verify suffix matches
				const actualSuffix = input.substring(suffixStartIndex, suffixStartIndex + suffix.length);
				suffixSimilarity = calculateSimilarity(actualSuffix, suffix);
			}
		}

		// Calculate overall confidence
		const overallConfidence = (prefixSimilarity + suffixSimilarity) / 2;

		return {
			matched: overallConfidence >= this.SIMILARITY_THRESHOLD,
			command: overallConfidence >= this.SIMILARITY_THRESHOLD ? command : undefined,
			pattern: normalizedPattern,
			wildcards: [wildcardContent],
			confidence: overallConfidence,
		};
	}

	/**
	 * Check if a command has any wildcard patterns
	 * @param command The command to check
	 * @returns true if the command has wildcard triggers
	 */
	hasWildcardTriggers(command: VoiceCommand): boolean {
		return command.triggers.some((trigger) => trigger.includes("*"));
	}
}

// Singleton instance
let patternMatcherInstance: PatternMatcher | null = null;

/**
 * Get the pattern matcher singleton instance
 */
export function getPatternMatcher(): PatternMatcher {
	if (!patternMatcherInstance) {
		patternMatcherInstance = new PatternMatcher();
	}
	return patternMatcherInstance;
}

/**
 * Reset the pattern matcher instance (useful for testing)
 */
export function resetPatternMatcher(): void {
	patternMatcherInstance = null;
}
