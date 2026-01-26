/**
 * Commands Module
 * Exports all command-related types, registry, and command definitions
 */

// Types
export * from "./types";

// Registry
export { getCommandRegistry, CommandRegistry } from "./registry";

// Command definitions
export { editorCommands } from "./editorCommands";
export { systemCommands } from "./systemCommands";

// Utility function to register all built-in commands
import { getCommandRegistry } from "./registry";
import { editorCommands } from "./editorCommands";
import { systemCommands } from "./systemCommands";

/**
 * Register all built-in voice commands
 * Call this during extension activation
 */
export function registerAllCommands(): void {
	const registry = getCommandRegistry();

	// Register editor commands
	registry.registerAll(editorCommands);

	// Register system commands
	registry.registerAll(systemCommands);
}
