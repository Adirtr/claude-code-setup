# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-08

### Added
- Initial release of Claude Setup CLI
- **Intelligent Project Detection**
  - Automatic framework detection (Next.js, Express, Fastify, NestJS, etc.)
  - Database detection (PostgreSQL, MySQL, Supabase, Prisma, Drizzle)
  - Authentication system detection (NextAuth, Clerk, Supabase Auth, Auth0)
  - External API detection (Stripe, OpenAI, GitHub, Supabase)
  - Multi-tenancy pattern detection
- **Core Commands**
  - `init` - Initialize Claude Code configuration
  - `add` - Add agents, commands, or MCP servers
  - `doctor` - Validate setup
  - `export` - Export configuration to JSON/YAML
- **Content Generation**
  - Dynamic CLAUDE.md generation with project context
  - 5 specialized agents (security-reviewer, test-quality, tenant-security, api-compliance, build-fixer)
  - 5 slash commands (pre-commit, security-scan, fix-build, tenant-check, test-review)
  - Project-specific guardrails
  - MCP server configuration
- **Quality Features**
  - Project-specific agent content (mentions project name, tech stack)
  - Framework-specific checks and examples
  - ORM-specific code examples
  - Actual file path references
- **Testing Infrastructure**
  - E2E test framework
  - Quality assessment system
  - Test scenarios for multiple project types

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Guardrails prevent deletion of critical files
- Guardrails block risky git operations (force push to main, etc.)
- Security scanning for hardcoded secrets
- Tenant isolation verification for multi-tenant apps

## [0.1.0] - 2026-01-01

### Added
- Project foundation and basic structure
- CLI framework with Commander
- TypeScript configuration
- Basic utilities (logger, file system helpers)

[Unreleased]: https://github.com/Adirtr/claude-code-setup/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Adirtr/claude-code-setup/releases/tag/v1.0.0
[0.1.0]: https://github.com/Adirtr/claude-code-setup/releases/tag/v0.1.0
