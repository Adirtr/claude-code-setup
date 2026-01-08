# Claude Code Setup

> Automatically configure Claude Code for your project with intelligent agent recommendations, slash commands, and guardrails.

[![npm version](https://badge.fury.io/js/claude-code-setup.svg)](https://www.npmjs.com/package/claude-code-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Claude Code Setup?

Claude Code Setup is an intelligent code generator that analyzes your project and creates a production-ready Claude Code configuration. It automatically generates:

- **CLAUDE.md** - Your project's context and guidelines
- **Custom Agents** - Specialized AI assistants for security, testing, tenant isolation, API compliance, and build fixes
- **Slash Commands** - Pre-configured commands for pre-commit checks, security scans, and more
- **Guardrails** - Safety rules to prevent risky operations
- **MCP Servers** - Tool integrations for GitHub, databases, and more

**The CLI adapts to YOUR stack** - Next.js, Express, Supabase, PostgreSQL, Stripe, and more.

## Quick Start

```bash
# Using npx (recommended)
npx claude-code-setup init

# Or install globally
npm install -g claude-code-setup
claude-setup init
```

The CLI will:
1. 🔍 Detect your framework, database, auth, and external APIs
2. 🤖 Generate project-specific agents and commands
3. 🛡️ Configure security guardrails
4. ✨ Create a complete Claude Code setup in seconds

## Features

### 🚀 Intelligent Detection

The CLI automatically detects:
- **Frameworks**: Next.js, Express, Fastify, NestJS, and more
- **Languages**: TypeScript, JavaScript
- **Databases**: PostgreSQL, MySQL, Supabase, PlanetScale, Drizzle, Prisma
- **Authentication**: NextAuth, Clerk, Supabase Auth, Auth0
- **External APIs**: Stripe, OpenAI, GitHub, Supabase
- **Multi-Tenancy**: Automatically detects tenant isolation patterns

### 🤖 Pre-Built Agents

Generate specialized agents for:

- **security-reviewer** - Finds OWASP Top 10 vulnerabilities, SQL injection, XSS, auth bypasses
- **test-quality** - Reviews test quality, identifies mock abuse and brittle tests
- **tenant-security** - Ensures proper multi-tenant data isolation (critical for SaaS)
- **api-compliance** - Validates external API usage (rate limits, error handling)
- **build-fixer** - Diagnoses and fixes build failures

Each agent is **customized for your project** with:
- Your project name and tech stack
- Actual file paths from your codebase
- Framework-specific checks (e.g., Next.js server/client components)
- Code examples using your ORM (Prisma, Drizzle, etc.)

### ⚡ Slash Commands

Pre-configured commands:

- **/pre-commit** - Run type checks, linting, formatting, and tests before committing
- **/security-scan** - Scan for vulnerabilities, hardcoded secrets, and security anti-patterns
- **/fix-build** - Diagnose and fix build failures step-by-step
- **/tenant-check** - Verify tenant isolation in database queries (for multi-tenant apps)
- **/test-review** - Analyze test quality and identify false confidence

### 🛡️ Guardrails

Automatic safety rules:
- Prevent deletion of critical files (package.json, .env, etc.)
- Block risky operations (rm -rf, force push to main, etc.)
- Protect your codebase from accidental damage

### 🔧 MCP Server Integration

Easy setup for:
- **GitHub MCP** - Issue and PR management
- **Supabase MCP** - Database management
- **Postgres MCP** - Direct database access
- **Memory MCP** - Long-term context storage

## Usage

### Initialize a New Project

```bash
claude-setup init
```

The CLI will analyze your project and generate all files automatically.

### Add Components Later

```bash
# Add a new agent
claude-setup add agent security-reviewer

# Add a new command
claude-setup add command pre-commit

# Add an MCP server
claude-setup add mcp github

# List available components
claude-setup add agent --list
claude-setup add command --list
claude-setup add mcp --list
```

### Validate Your Setup

```bash
# Check if setup is valid
claude-setup doctor

# Export your configuration
claude-setup export --format json > config.json
claude-setup export --format yaml > config.yaml
```

## Command Reference

### `claude-setup init`

Initialize Claude Code configuration for your project.

**Options:**
- `--force` - Overwrite existing configuration
- `--skip-detection` - Skip automatic project detection
- `--mode <mode>` - Set mode: automatic (default), light, manual

**Examples:**
```bash
# Standard initialization
claude-setup init

# Force overwrite existing config
claude-setup init --force

# Light mode (only CLAUDE.md + guardrails)
claude-setup init --mode light
```

### `claude-setup add <type> [name]`

Add agents, commands, or MCP servers to existing setup.

**Arguments:**
- `type` - Component type: agent, command, or mcp
- `name` - Component name (optional, will prompt if not provided)

**Options:**
- `--list` - List available components
- `--force` - Overwrite if already exists

**Examples:**
```bash
# Add security reviewer agent
claude-setup add agent security-reviewer

# List all available agents
claude-setup add agent --list

# Add pre-commit command
claude-setup add command pre-commit

# Add GitHub MCP server
claude-setup add mcp github --force
```

### `claude-setup doctor`

Validate your Claude Code setup.

**What it checks:**
- CLAUDE.md exists and is valid
- .claude directory structure
- Settings files (settings.json, settings.local.json)
- Agent files (proper frontmatter, structure)
- Command files (runnable commands)

**Example:**
```bash
claude-setup doctor
```

### `claude-setup export`

Export your configuration to JSON or YAML.

**Options:**
- `--format <format>` - Output format: json (default) or yaml
- `--output <file>` - Write to file instead of stdout

**Examples:**
```bash
# Export to stdout
claude-setup export

# Export to file
claude-setup export --output config.json

# Export as YAML
claude-setup export --format yaml --output config.yaml
```

## Project Structure

After running `claude-setup init`, you'll have:

```
your-project/
├── CLAUDE.md                          # Project context & guidelines
├── .claude/
│   ├── settings.json                  # MCP servers & tools
│   ├── settings.local.json            # Guardrails & safety rules
│   ├── agents/
│   │   ├── security-reviewer.md       # Security vulnerability scanner
│   │   ├── test-quality.md            # Test quality analyzer
│   │   ├── tenant-security.md         # Multi-tenant isolation checker
│   │   ├── api-compliance.md          # External API usage validator
│   │   └── build-fixer.md             # Build error diagnostic tool
│   └── commands/
│       ├── pre-commit.md              # Pre-commit quality checks
│       ├── security-scan.md           # Security vulnerability scan
│       ├── fix-build.md               # Build failure diagnostics
│       ├── tenant-check.md            # Tenant isolation verification
│       └── test-review.md             # Test quality review
```

## Examples

### Next.js + Supabase + Stripe

```bash
# In your Next.js project with Supabase and Stripe
npx claude-code-setup init
```

**Generated setup includes:**
- Tenant isolation checks (for `user_id` field)
- Next.js-specific security checks (server/client components)
- Supabase RLS verification
- Stripe API compliance checks
- Pre-commit hooks for Next.js builds

### Express API + PostgreSQL

```bash
# In your Express API project
npx claude-code-setup init
```

**Generated setup includes:**
- SQL injection detection
- PostgreSQL query security checks
- API endpoint authentication validation
- Database migration safety

### Python / Non-Node Projects

```bash
# CLI works with any project type
npx claude-code-setup init
```

Even for Python, Ruby, Go, or other languages, you'll get:
- Language-appropriate CLAUDE.md
- Security scanning
- Generic commands (adapted to your project)
- Guardrails for safe operations

## Configuration

### Modes

**Automatic Mode (Default)**
- Full setup with agents, commands, and MCP servers
- Best for most projects

**Light Mode**
- Just CLAUDE.md and guardrails
- For simpler projects or quick setup

**Manual Mode**
- Step-by-step interactive setup
- Choose exactly what you want

### Customization

All generated files are Markdown and JSON - easy to customize:

1. **CLAUDE.md** - Edit project context, add custom guidelines
2. **Agents** - Modify agent behavior, add project-specific rules
3. **Commands** - Adjust commands for your workflow
4. **Guardrails** - Add or remove safety rules

## Troubleshooting

### "No Claude Code setup found"

You need to run `claude-setup init` first:
```bash
claude-setup init
```

### "Command already exists"

Use `--force` to overwrite:
```bash
claude-setup add agent security-reviewer --force
```

### Detection Issues

If project detection fails, check:
1. You're in the project root directory
2. `package.json` exists (for Node.js projects)
3. Required files are present (e.g., `prisma/schema.prisma` for Prisma)

Run with debug output:
```bash
DEBUG=* claude-setup init
```

### Build Errors

If you encounter build errors after setup:
1. Check Node.js version (requires Node 18+)
2. Clear cache: `rm -rf node_modules && npm install`
3. Report issue: https://github.com/Adirtr/claude-code-setup/issues

## Development

```bash
# Clone the repository
git clone https://github.com/Adirtr/claude-code-setup.git
cd claude-code-setup

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Test locally
pnpm link
claude-setup init
```

## Tech Stack

- **TypeScript** - Type safety
- **Commander** - CLI framework
- **Enquirer** - Interactive prompts
- **tsup** - Build tool
- **Vitest** - Testing framework

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [Adir Traitel](https://github.com/Adirtr)

## Support

- **Documentation**: [Full docs](https://docs.anthropic.com/claude/claude-code)
- **Issues**: [GitHub Issues](https://github.com/Adirtr/claude-code-setup/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Adirtr/claude-code-setup/discussions)

## Acknowledgments

Built with ❤️ for the Claude Code community.

Special thanks to all contributors who have helped shape this tool!
