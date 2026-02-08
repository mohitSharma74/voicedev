/**
 * CSS Styles for Command Center Webview
 * Uses VS Code CSS variables for theme compatibility
 * Table layout similar to VS Code Keyboard Shortcuts page
 */

export function getCommandCenterStyles(): string {
	return `
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.5;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .header-logo {
            max-height: 40px;
            margin-right: 12px;
            vertical-align: middle;
            display: inline-block;
        }

        /* Theme-aware logo styling */
        body.vscode-dark .header-logo,
        body.vscode-high-contrast .header-logo {
            filter: invert(1) brightness(0.9);
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
            color: var(--vscode-foreground);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
        }

        /* Search */
        .search-container {
            position: relative;
            margin-bottom: 16px;
        }

        #searchInput {
            width: 100%;
            padding: 12px 16px 12px 40px;
            font-size: 14px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            outline: none;
        }

        #searchInput:focus {
            border-color: var(--vscode-focusBorder);
        }

        #searchInput::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        .search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--vscode-input-placeholderForeground);
            font-size: 16px;
        }

        .result-count {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }

        /* Filter Bar */
        .filter-bar {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .filter-btn {
            padding: 6px 12px;
            border: 1px solid var(--vscode-button-border, transparent);
            border-radius: 4px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
        }

        .filter-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .filter-btn.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        /* Command List - Table Layout */
        .command-list {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .category-section {
            margin-bottom: 8px;
        }

        .category-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
            color: var(--vscode-foreground);
        }

        .command-count {
            font-size: 12px;
            font-weight: normal;
            color: var(--vscode-descriptionForeground);
            background-color: var(--vscode-badge-background);
            padding: 2px 8px;
            border-radius: 10px;
        }

        /* Table Styles - Similar to VS Code Keyboard Shortcuts */
        .commands-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .commands-table thead {
            display: none; /* Hide header, use category headers instead */
        }

        .commands-table tbody tr {
            border-bottom: 1px solid var(--vscode-panel-border);
            transition: background-color 0.1s ease;
        }

        .commands-table tbody tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .commands-table tbody tr.disabled {
            opacity: 0.55;
        }

        .commands-table td {
            padding: 10px 12px;
            vertical-align: top;
        }

        /* Trigger Column */
        .trigger-cell {
            width: 35%;
            min-width: 200px;
        }

        .trigger-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .trigger-phrase {
            font-size: 12px;
            color: var(--vscode-textLink-foreground);
            background-color: var(--vscode-textBlockQuote-background);
            padding: 4px 8px;
            border-radius: 4px;
            font-style: italic;
            white-space: nowrap;
        }

        /* Description Column */
        .description-cell {
            width: 45%;
        }

        .command-description {
            font-size: 13px;
            color: var(--vscode-foreground);
            font-weight: 500;
        }

        .command-id {
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        /* Category Column */
        .category-cell {
            width: 20%;
            min-width: 120px;
            text-align: right;
        }

        /* Preview Notice */
        .preview-notice {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-charts-purple, #a855f7);
            padding: 12px 16px;
            margin-bottom: 12px;
            border-radius: 4px;
        }

        .preview-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-charts-purple, #a855f7);
            background-color: var(--vscode-badge-background);
            padding: 4px 8px;
            border-radius: 3px;
            margin-bottom: 8px;
        }

        .preview-notice p {
            font-size: 13px;
            color: var(--vscode-foreground);
            margin-top: 8px;
        }

        .preview-notice a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        .preview-notice a:hover {
            text-decoration: underline;
        }

        .footer-tip {
            text-align: center;
            margin-top: 16px;
        }

        .footer-tip p {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }

        .category-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            background-color: var(--vscode-badge-background);
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: capitalize;
        }

        /* Badges */
        .badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 3px;
            text-transform: uppercase;
            white-space: nowrap;
            margin-left: 8px;
        }

        .copilot-badge {
            background-color: var(--vscode-charts-purple, #a855f7);
            color: white;
        }

        .disabled-badge {
            background-color: var(--vscode-inputValidation-warningBackground, #f59e0b);
            color: var(--vscode-inputValidation-warningForeground, #1f1f1f);
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state h3 {
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .commands-table {
                font-size: 12px;
            }

            .commands-table td {
                padding: 8px;
            }

            .trigger-cell {
                width: 40%;
                min-width: 150px;
            }

            .description-cell {
                width: 35%;
            }

            .category-cell {
                width: 25%;
                min-width: 100px;
            }

            .trigger-phrase {
                font-size: 11px;
                padding: 3px 6px;
            }
        }

        @media (max-width: 600px) {
            .filter-bar {
                overflow-x: auto;
                flex-wrap: nowrap;
                padding-bottom: 8px;
            }

            .commands-table .category-cell {
                display: none; /* Hide category column on very small screens */
            }

            .trigger-cell {
                width: 45%;
            }

            .description-cell {
                width: 55%;
            }
        }
    `;
}
