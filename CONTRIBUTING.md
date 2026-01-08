# Contributing to Claude Code Setup

Thank you for your interest in contributing to Claude Code Setup! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guide](#style-guide)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Git

### Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/claude-code-setup.git
   cd claude-code-setup
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Build the project**

   ```bash
   pnpm build
   ```

5. **Link for local testing**

   ```bash
   pnpm link
   ```

   Now you can run `claude-setup` from anywhere on your machine.

## Development Workflow

### 1. Create a Branch

Create a descriptive branch name:

```bash
git checkout -b feature/add-python-detection
git checkout -b fix/env-var-parsing
git checkout -b docs/improve-readme
```

### 2. Make Changes

Follow these guidelines:

- Write clear, concise commit messages
- Add tests for new functionality
- Update documentation as needed
- Follow the code style guide

### 3. Test Your Changes

```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build

# Test locally
pnpm link
cd /path/to/test/project
claude-setup init
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add Python project detection

- Add Python file scanner
- Detect requirements.txt and pyproject.toml
- Generate Python-specific CLAUDE.md"
```

Use conventional commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/add-python-detection
```

Then create a Pull Request on GitHub.

## Project Structure

```
claude-setup-cli/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── commands/                 # Command implementations
│   │   ├── init.ts              # Init command
│   │   ├── add.ts               # Add command
│   │   ├── doctor.ts            # Doctor command
│   │   └── export.ts            # Export command
│   ├── detector/                 # Project detection
│   │   ├── index.ts             # Main detector orchestrator
│   │   ├── package-analyzer.ts  # package.json analysis
│   │   ├── file-analyzer.ts     # File structure analysis
│   │   └── pattern-detector.ts  # Code pattern detection
│   ├── generator/                # Content generation
│   │   ├── claude-md.ts         # CLAUDE.md generator
│   │   ├── agents.ts            # Agent file generator
│   │   ├── commands.ts          # Command file generator
│   │   └── settings.ts          # Settings file generator
│   ├── constants/                # Static definitions
│   │   ├── agents.ts            # Agent definitions
│   │   ├── commands.ts          # Command definitions
│   │   └── patterns.ts          # Detection patterns
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript types
├── tests/                        # Test files
│   ├── unit/                    # Unit tests
│   ├── e2e/                     # End-to-end tests
│   └── utils/                   # Test utilities
├── bin/                         # Executable files
└── docs/                        # Additional documentation
```

## Testing

### Unit Tests

Located in `tests/unit/`, these test individual functions and modules:

```bash
pnpm test:unit
```

### E2E Tests

Located in `tests/e2e/`, these test the full CLI workflow:

```bash
pnpm test:e2e
```

### Quality Tests

Test the quality of generated content:

```bash
pnpm test:e2e:quality
```

### Writing Tests

Example unit test:

```typescript
import { describe, it, expect } from 'vitest';
import { detectFramework } from '../src/detector/package-analyzer.js';

describe('detectFramework', () => {
  it('should detect Next.js from dependencies', () => {
    const packageJson = {
      dependencies: { next: '^14.0.0' }
    };

    const result = detectFramework(packageJson);

    expect(result).toBe('Next.js');
  });
});
```

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Code is formatted (`pnpm format`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for notable changes)
- [ ] Commit messages follow conventional commits
- [ ] PR description explains the changes

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested these changes.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is truly unknown

Example:

```typescript
// Good
interface UserData {
  id: string;
  email: string;
}

export function getUser(id: string): Promise<UserData> {
  // ...
}

// Avoid
export function getUser(id: any): any {
  // ...
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use descriptive variable names
- Keep functions small and focused
- Add JSDoc comments for public APIs

Example:

```typescript
/**
 * Detects the database type used in the project.
 *
 * @param packageJson - The parsed package.json content
 * @param files - List of files in the project
 * @returns The detected database type or null
 */
export function detectDatabase(
  packageJson: PackageJson,
  files: string[]
): Database | null {
  // Implementation
}
```

### File Organization

- One export per file (exceptions for types/constants)
- Group imports: external, internal, types
- Export types and interfaces alongside implementation

Example:

```typescript
// External imports
import fs from 'fs-extra';
import path from 'path';

// Internal imports
import { logger } from '../utils/logger.js';
import { readPackageJson } from '../utils/fs.js';

// Type imports
import type { DetectedProject } from '../types/index.js';
```

## Adding New Features

### Adding a New Framework Detection

1. Add framework pattern to `src/detector/pattern-detector.ts`
2. Update `DetectedProject` type if needed
3. Add framework-specific content to generators
4. Add tests
5. Update documentation

### Adding a New Agent

1. Add agent definition to `src/constants/agents.ts`
2. Implement generator in `src/generator/agents.ts`
3. Add tests in `tests/unit/generator/agents.test.ts`
4. Update README.md with agent description

### Adding a New Command

1. Add command definition to `src/constants/commands.ts`
2. Implement generator in `src/generator/commands.ts`
3. Add tests
4. Update README.md

## Release Process

Releases are managed by maintainers. The process is:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Push to GitHub
5. Publish to npm
6. Create GitHub release

Contributors don't need to worry about this unless they're maintainers.

## Questions?

If you have questions:

- Check existing issues on GitHub
- Ask in discussions
- Reach out to maintainers

Thank you for contributing! 🎉
