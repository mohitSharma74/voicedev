/**
 * HTML Template Generator for Command Center Webview
 * Table layout similar to VS Code Keyboard Shortcuts page
 */

import * as vscode from "vscode";
import { CommandDisplayData } from "./CommandCenterPanel";
import { getCommandCenterStyles } from "./commandCenterStyles";

/** Category display metadata */
const categoryInfo: Record<string, { label: string; icon: string }> = {
	editor: { label: "Editor", icon: "edit" },
	git: { label: "Git", icon: "git-branch" },
	terminal: { label: "Terminal", icon: "terminal" },
	navigation: { label: "Navigation", icon: "compass" },
	system: { label: "System", icon: "gear" },
};

/** Order for displaying categories */
const categoryOrder = ["editor", "git", "terminal", "navigation", "system"];

/**
 * Generates the HTML content for the Command Center webview
 */
export function getCommandCenterHtml(
	webview: vscode.Webview,
	extensionUri: vscode.Uri,
	commands: CommandDisplayData[],
	extensionVersion?: string,
): string {
	const nonce = getNonce();
	const commandsByCategory = groupByCategory(commands);
	const commandsJson = JSON.stringify(commands);

	// Get webview URIs for logo images
	const logoUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "assets", "logo-128x128.png"));

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>VoiceDev Command Center</title>
    <style>${getCommandCenterStyles()}</style>
</head>
<body>
    <div class="container">
        <header class="header">
            <img class="header-logo" src="${logoUri.toString()}" alt="Voice-powered commands for VS Code" />
            <h1>VoiceDev Command Center</h1>
            <p class="subtitle">All available voice commands for hands-free coding</p>
        </header>

        <div class="search-container">
            <span class="search-icon">&#128269;</span>
            <input
                type="text"
                id="searchInput"
                placeholder="Search commands by trigger phrase, description, or category..."
                autofocus
            />
            <span id="resultCount" class="result-count"></span>
        </div>

        <div class="filter-bar">
            <button class="filter-btn active" data-category="all">All</button>
            ${Object.entries(categoryInfo)
				.map(([key, info]) => `<button class="filter-btn" data-category="${key}">${info.label}</button>`)
				.join("")}
        </div>

        <main id="commandList" class="command-list">
            ${renderCommandSections(commandsByCategory)}
        </main>

        <footer class="footer">
            <div class="preview-notice">
                <span class="preview-badge">⚡ Preview${extensionVersion ? ` ${extensionVersion}` : ""}</span>
                <p>This extension is in active development. <a href="https://github.com/mohitSharma74/voicedev/issues/new/choose">Share feedback</a> to help shape VoiceDev!</p>
            </div>
            <div class="footer-tip">
                <p>💡 Tip: Say any trigger phrase while recording to execute commands</p>
            </div>
        </footer>
    </div>

    <script nonce="${nonce}">
        ${getClientScript(commandsJson)}
    </script>
</body>
</html>`;
}

/**
 * Generates a random nonce for CSP
 */
function getNonce(): string {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

/**
 * Groups commands by category
 */
function groupByCategory(commands: CommandDisplayData[]): Map<string, CommandDisplayData[]> {
	const grouped = new Map<string, CommandDisplayData[]>();

	// Initialize all categories
	for (const key of Object.keys(categoryInfo)) {
		grouped.set(key, []);
	}

	for (const cmd of commands) {
		const existing = grouped.get(cmd.category) || [];
		existing.push(cmd);
		grouped.set(cmd.category, existing);
	}

	return grouped;
}

/**
 * Renders all category sections with table layout
 */
function renderCommandSections(commandsByCategory: Map<string, CommandDisplayData[]>): string {
	let html = "";

	for (const category of categoryOrder) {
		const commands = commandsByCategory.get(category) || [];
		if (commands.length === 0) {
			continue;
		}

		const info = categoryInfo[category];
		html += `
        <section class="category-section" data-category="${category}">
            <h2 class="category-header">
                ${info.label}
                <span class="command-count">${commands.length}</span>
            </h2>
            <table class="commands-table">
                <tbody>
                    ${commands.map((cmd) => renderCommandRow(cmd)).join("")}
                </tbody>
            </table>
        </section>`;
	}

	if (html === "") {
		html = `
        <div class="empty-state">
            <h3>No commands found</h3>
            <p>Try adjusting your search or filters</p>
        </div>`;
	}

	return html;
}

/**
 * Renders a single command row in the table
 * Columns: Trigger | Description | Category
 */
function renderCommandRow(cmd: CommandDisplayData): string {
	const copilotBadge = cmd.requiresCopilot
		? '<span class="badge copilot-badge" title="Requires GitHub Copilot">Copilot</span>'
		: "";
	const disabledBadge = cmd.disabled
		? '<span class="badge disabled-badge" title="Disabled in settings">Disabled</span>'
		: "";
	const rowClass = cmd.disabled ? "command-row disabled" : "command-row";

	return `
	<tr class="${rowClass}" data-command-id="${cmd.id}" data-category="${cmd.category}">
		<td class="trigger-cell">
			<div class="trigger-list">
				${cmd.triggers.map((t) => `<span class="trigger-phrase">"${escapeHtml(t)}"</span>`).join("")}
			</div>
		</td>
		<td class="description-cell">
			<div class="command-description">${escapeHtml(cmd.description)}${copilotBadge}${disabledBadge}</div>
			<div class="command-id">${escapeHtml(cmd.id)}</div>
		</td>
		<td class="category-cell">
			<span class="category-tag">${escapeHtml(cmd.category)}</span>
		</td>
	</tr>`;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
	const htmlEscapes: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};
	return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Client-side JavaScript for search and filtering
 */
function getClientScript(commandsJson: string): string {
	return `
        const allCommands = ${commandsJson};

        // DOM elements
        const searchInput = document.getElementById('searchInput');
        const commandList = document.getElementById('commandList');
        const resultCount = document.getElementById('resultCount');
        const filterBtns = document.querySelectorAll('.filter-btn');

        let currentFilter = 'all';

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            filterCommands(e.target.value, currentFilter);
        });

        // Category filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.category;
                filterCommands(searchInput.value, currentFilter);
            });
        });

        function filterCommands(query, category) {
            const normalizedQuery = query.toLowerCase().trim();
            const rows = document.querySelectorAll('.command-row');
            const sections = document.querySelectorAll('.category-section');
            let visibleCount = 0;

            rows.forEach(row => {
                const commandId = row.dataset.commandId;
                const rowCategory = row.dataset.category;
                const command = allCommands.find(c => c.id === commandId);

                if (!command) return;

                // Check category filter
                const categoryMatch = category === 'all' || rowCategory === category;

                // Check search query
                let searchMatch = true;
                if (normalizedQuery) {
                    const searchableText = [
                        command.id,
                        command.description,
                        command.category,
                        ...command.triggers
                    ].join(' ').toLowerCase();

                    searchMatch = searchableText.includes(normalizedQuery);
                }

                const isVisible = categoryMatch && searchMatch;
                row.style.display = isVisible ? '' : 'none';
                if (isVisible) visibleCount++;
            });

            // Update section visibility
            sections.forEach(section => {
                const sectionCategory = section.dataset.category;
                const categoryMatch = category === 'all' || sectionCategory === category;

                // Check if section has visible rows
                const visibleInSection = Array.from(section.querySelectorAll('.command-row'))
                    .filter(row => row.style.display !== 'none').length;

                section.style.display = (categoryMatch && visibleInSection > 0) ? 'block' : 'none';
            });

            // Update result count
            if (normalizedQuery || category !== 'all') {
                resultCount.textContent = visibleCount + ' command' + (visibleCount !== 1 ? 's' : '') + ' found';
            } else {
                resultCount.textContent = '';
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Focus search with /
            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
            // Clear search with Escape
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterCommands('', currentFilter);
                searchInput.blur();
            }
        });
    `;
}
