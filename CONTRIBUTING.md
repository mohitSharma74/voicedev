# Contributing to VoiceDev

🎉 Thank you for your interest in contributing to VoiceDev! We welcome contributions from developers of all skill levels, as well as feedback and bug reports from non-technical users.

## Ways to Contribute

### For Non-Technical Users

Even if you're not a developer, you can help VoiceDev improve by:

- **Reporting bugs** you encounter while using the extension
- **Suggesting features** that would make voice development easier
- **Providing feedback** on what works well and what could be improved
- **Testing new releases** and sharing your experience

### For Developers

Technical contributors can help with:

- **Code contributions**: Fixing bugs, implementing features, improving performance
- **Documentation**: Improving README, creating tutorials, updating docs
- **Testing**: Writing unit tests, integration tests, end-to-end tests
- **Code review**: Reviewing pull requests from other contributors
- **Issue triage**: Helping categorize and prioritize issues

## Getting Started

### Prerequisites

- VS Code 1.85.0 or higher
- Node.js 18+ and npm
- Git
- (For local STT) Python 3.9-3.12 and ffmpeg

### Setup

1. Fork the repository
2. Clone your fork:
    ```bash
    git clone https://github.com/your-username/voicedev.git
    cd voicedev
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Open in VS Code:
    ```bash
    code .
    ```
5. Start development:
    ```bash
    npm run watch
    ```

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

## Reporting Issues

### Issue Templates

We provide structured templates to make issue reporting easy for everyone:

- **🐛 Bug Report**: Use this template when you encounter unexpected behavior
- **🚀 Feature Request**: Use this for suggesting new features or improvements
- **💬 General Issue**: For questions, discussions, or other topics

### Bug Reports

A good bug report includes:

1. **Clear title** summarizing the issue
2. **Steps to reproduce** (numbered list)
3. **Expected vs actual behavior**
4. **Environment details**:
    - VoiceDev version
    - VS Code version
    - Operating system
    - STT provider being used
5. **Screenshots/recordings** (if applicable)
6. **Error logs** (for technical users)

### Feature Requests

A good feature request includes:

1. **Problem statement**: What issue does this solve?
2. **Proposed solution**: How should it work?
3. **Use cases**: Who benefits and how?
4. **Alternatives considered**: Are there other ways to solve this?
5. **Technical insights** (optional): Implementation ideas

## Development Workflow

### Branching Strategy

- `main`: Stable branch (production-ready)
- `dev`: Development branch (latest features)
- Feature branches: `feature/your-feature-name`
- Bug fix branches: `fix/bug-description`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
[optional body]
[optional footer]
```

Common types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Build process or auxiliary tool changes

Examples:

```
feat(commands): add voice-to-commit functionality
fix(stt): handle local provider timeout errors
docs(readme): update installation instructions
```

### Pull Request Process

1. Create a branch from `dev`
2. Make your changes
3. Write or update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Create a pull request to `dev`
7. Request review from maintainers
8. Address feedback
9. Wait for approval and merge

## Code Style

- **TypeScript**: Follow project's existing patterns
- **Formatting**: Use Prettier (configured in project)
- **Linting**: Use ESLint (configured in project)
- **Naming**: Use descriptive names, camelCase for variables/functions
- **Comments**: Add comments for complex logic

## Testing

Run tests with:

```bash
npm test
```

Write tests for new features and bug fixes. Follow existing test patterns.

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
- Help others when you can

## Support

Need help? Check these resources:

- [Documentation](README.md)
- [Discussions](https://github.com/mohitSharma74/voicedev/discussions)
- [Existing Issues](https://github.com/mohitSharma74/voicedev/issues)

## License

By contributing to VoiceDev, you agree that your contributions will be licensed under the [BSD 3-Clause License](LICENSE).
