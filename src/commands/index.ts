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
export { copilotCommands, copilotChatCommands } from "./copilotCommands";
export { gitCommands } from "./gitCommands";
export { navigationCommands } from "./navigationCommands";

// Utility function to register all built-in commands
import { getCommandRegistry } from "./registry";
import { editorCommands } from "./editorCommands";
import { systemCommands } from "./systemCommands";
import { copilotCommands, copilotChatCommands } from "./copilotCommands";
import { gitCommands } from "./gitCommands";
import { navigationCommands } from "./navigationCommands";

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

	// Register copilot commands (terminal-based)
	registry.registerAll(copilotCommands);

	// Register copilot chat commands (chat panel-based)
	registry.registerAll(copilotChatCommands);

	// Register git commands (terminal-based)
	registry.registerAll(gitCommands);

	// Register navigation commands
	registry.registerAll(navigationCommands);
}
