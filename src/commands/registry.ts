/**
 * Command Registry
 * Central registry for all voice commands
 */

import { VoiceCommand, CommandCategory } from "./types";

/**
 * Singleton registry that stores all available voice commands
 */
class CommandRegistry {
	private static instance: CommandRegistry;
	private commands: Map<string, VoiceCommand> = new Map();

	private constructor() {}

	/**
	 * Get the singleton instance of the registry
	 */
	static getInstance(): CommandRegistry {
		if (!CommandRegistry.instance) {
			CommandRegistry.instance = new CommandRegistry();
		}
		return CommandRegistry.instance;
	}

	/**
	 * Register a new voice command
	 * @param command The command to register
	 * @throws Error if a command with the same ID already exists
	 */
	register(command: VoiceCommand): void {
		if (this.commands.has(command.id)) {
			throw new Error(`Command with ID '${command.id}' is already registered`);
		}
		this.commands.set(command.id, command);
	}

	/**
	 * Register multiple commands at once
	 * @param commands Array of commands to register
	 */
	registerAll(commands: VoiceCommand[]): void {
		for (const command of commands) {
			this.register(command);
		}
	}

	/**
	 * Unregister a command by ID
	 * @param id The command ID to remove
	 * @returns true if the command was removed, false if it didn't exist
	 */
	unregister(id: string): boolean {
		return this.commands.delete(id);
	}

	/**
	 * Get a command by its ID
	 * @param id The command ID
	 * @returns The command or undefined if not found
	 */
	findById(id: string): VoiceCommand | undefined {
		return this.commands.get(id);
	}

	/**
	 * Get all registered commands
	 * @returns Array of all commands
	 */
	getAll(): VoiceCommand[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Get all commands in a specific category
	 * @param category The category to filter by
	 * @returns Array of commands in that category
	 */
	getByCategory(category: CommandCategory): VoiceCommand[] {
		return this.getAll().filter((cmd) => cmd.category === category);
	}

	/**
	 * Get all trigger phrases with their associated commands
	 * Used by the parser for fuzzy matching
	 * @returns Array of objects containing trigger and command reference
	 */
	getAllTriggers(): { trigger: string; command: VoiceCommand }[] {
		const triggers: { trigger: string; command: VoiceCommand }[] = [];

		for (const command of this.commands.values()) {
			for (const trigger of command.triggers) {
				triggers.push({ trigger: trigger.toLowerCase(), command });
			}
		}

		return triggers;
	}

	/**
	 * Get all enabled commands (excluding disabled IDs)
	 */
	getEnabledCommands(disabledIds: Set<string>): VoiceCommand[] {
		if (disabledIds.size === 0) {
			return this.getAll();
		}
		return this.getAll().filter((cmd) => !disabledIds.has(cmd.id));
	}

	/**
	 * Get all trigger phrases for enabled commands
	 */
	getEnabledTriggers(disabledIds: Set<string>): { trigger: string; command: VoiceCommand }[] {
		const triggers: { trigger: string; command: VoiceCommand }[] = [];
		const commands = this.getEnabledCommands(disabledIds);

		for (const command of commands) {
			for (const trigger of command.triggers) {
				triggers.push({ trigger: trigger.toLowerCase(), command });
			}
		}

		return triggers;
	}

	/**
	 * Get the total number of registered commands
	 */
	get size(): number {
		return this.commands.size;
	}

	/**
	 * Clear all registered commands (useful for testing)
	 */
	clear(): void {
		this.commands.clear();
	}
}

// Export singleton instance getter
export const getCommandRegistry = (): CommandRegistry => CommandRegistry.getInstance();

// Export type for dependency injection in tests
export { CommandRegistry };
