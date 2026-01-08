# Claude Setup CLI - Development Plan

## Overview

This plan breaks down the development of `claude-setup-cli` into epics, stories, and tasks. Each task is marked with complexity: **S**(mall), **M**(edium), or **L**(arge).

---

## Epic 1: Project Foundation & Core Infrastructure

**Goal:** Set up the project structure, tooling, and basic CLI skeleton.

### Story 1.1: Project Initialization
*As a developer, I need a properly configured TypeScript project with all necessary tooling.*

- [ ] **Task 1.1.1** [S] - Create project directory structure
- [ ] **Task 1.1.2** [S] - Initialize package.json with dependencies (Commander, Enquirer, Chalk, Ora, globby, Zod)
- [ ] **Task 1.1.3** [S] - Configure TypeScript (tsconfig.json)
- [ ] **Task 1.1.4** [S] - Configure tsup for building (ESM + CJS)
- [ ] **Task 1.1.5** [S] - Configure Vitest for testing
- [ ] **Task 1.1.6** [S] - Create bin entry point (claude-setup.js shebang)
- [ ] **Task 1.1.7** [S] - Set up basic CLI skeleton with Commander

### Story 1.2: Type System Foundation
*As a developer, I need comprehensive TypeScript types for the entire application.*

- [ ] **Task 1.2.1** [M] - Define core types (DetectedProject, ProjectParams, SetupConfig)
- [ ] **Task 1.2.2** [S] - Define generation types (GenerationPrompt, GeneratedFile, GenerationResult)
- [ ] **Task 1.2.3** [S] - Define UI types (screens, prompts, progress)
- [ ] **Task 1.2.4** [S] - Create Zod schemas for runtime validation
- [ ] **Task 1.2.5** [S] - Export all types from central index

### Story 1.3: Utility Layer
*As a developer, I need reusable utilities for file system, logging, and Git operations.*

- [ ] **Task 1.3.1** [S] - Create logger utility with Chalk (info, success, error, warning)
- [ ] **Task 1.3.2** [S] - Create file system helpers (ensureDir, writeFile, readJSON)
- [ ] **Task 1.3.3** [S] - Create Git utilities (hasGitHubRemote, getRemoteUrl)
- [ ] **Task 1.3.4** [S] - Add progress indicator utilities with Ora

---

## Epic 2: Detection Engine

**Goal:** Build the project analysis system that auto-detects tech stack, patterns, and configuration.

### Story 2.1: Package Analysis
*As a user, I want the CLI to detect my framework, dependencies, and package manager from package.json.*

- [ ] **Task 2.1.1** [M] - Implement package.json reader
- [ ] **Task 2.1.2** [M] - Create framework detection logic (Next.js, React, Vue, Express, etc.)
- [ ] **Task 2.1.3** [M] - Create database detection (Supabase, Prisma, PostgreSQL, MongoDB)
- [ ] **Task 2.1.4** [M] - Create auth provider detection (Supabase, Firebase, Clerk, Auth0)
- [ ] **Task 2.1.5** [S] - Create testing framework detection (Vitest, Jest, Playwright, Cypress)
- [ ] **Task 2.1.6** [M] - Create external API detection (Gmail, Stripe, OpenAI, etc.)
- [ ] **Task 2.1.7** [S] - Detect package manager (pnpm, npm, yarn, bun)
- [ ] **Task 2.1.8** [S] - Extract version numbers for key dependencies

### Story 2.2: Structure Analysis
*As a user, I want the CLI to analyze my project structure and file organization.*

- [ ] **Task 2.2.1** [M] - Implement file tree scanner with globby
- [ ] **Task 2.2.2** [S] - Detect monorepo structure (workspaces, turbo.json, nx.json)
- [ ] **Task 2.2.3** [S] - Detect app structure (Next.js app/, pages/, src/)
- [ ] **Task 2.2.4** [S] - Detect test locations (tests/, __tests__/, *.test.ts)
- [ ] **Task 2.2.5** [S] - Detect CI/CD configuration (.github/workflows/, .gitlab-ci.yml)
- [ ] **Task 2.2.6** [S] - Count source files and calculate project size

### Story 2.3: Pattern Analysis
*As a user, I want the CLI to detect code patterns like multi-tenancy and API structure.*

- [ ] **Task 2.3.1** [L] - Implement grep-based pattern search across codebase
- [ ] **Task 2.3.2** [M] - Detect multi-tenant patterns (user_id, org_id, tenant_id filters)
- [ ] **Task 2.3.3** [M] - Identify tenant field from code patterns
- [ ] **Task 2.3.4** [S] - Detect API route structure (REST, GraphQL, tRPC)
- [ ] **Task 2.3.5** [S] - Detect code conventions (file naming, import patterns)

### Story 2.4: Health Checking
*As a user, I want the CLI to detect if my build and tests are passing.*

- [ ] **Task 2.4.1** [M] - Implement build status checker (run build command)
- [ ] **Task 2.4.2** [M] - Parse build errors and extract meaningful info
- [ ] **Task 2.4.3** [S] - Implement test status checker
- [ ] **Task 2.4.4** [S] - Run TypeScript type check (tsc --noEmit)
- [ ] **Task 2.4.5** [S] - Detect if tests exist and are runnable

### Story 2.5: Detection Orchestrator
*As a developer, I need to coordinate all detection modules and aggregate results.*

- [ ] **Task 2.5.1** [M] - Create detection orchestrator that runs all analyzers
- [ ] **Task 2.5.2** [S] - Implement detection result aggregation
- [ ] **Task 2.5.3** [S] - Add detection caching for performance
- [ ] **Task 2.5.4** [S] - Handle detection errors gracefully
- [ ] **Task 2.5.5** [M] - Write unit tests for all detection modules

---

## Epic 3: User Interface & Flow

**Goal:** Build the interactive CLI experience with screens, prompts, and progress indicators.

### Story 3.1: Welcome Screen
*As a user, I want to see a clear welcome screen explaining what will happen.*

- [ ] **Task 3.1.1** [S] - Design welcome screen layout
- [ ] **Task 3.1.2** [S] - Implement welcome screen renderer
- [ ] **Task 3.1.3** [S] - Add "press Enter to continue" prompt

### Story 3.2: Detection Summary Screen
*As a user, I want to see what the CLI detected about my project.*

- [ ] **Task 3.2.1** [M] - Design detection summary layout
- [ ] **Task 3.2.2** [M] - Implement detection summary renderer
- [ ] **Task 3.2.3** [S] - Format tech stack display (framework, language, database)
- [ ] **Task 3.2.4** [S] - Format special patterns display (multi-tenant, APIs)
- [ ] **Task 3.2.5** [S] - Display recommendations preview

### Story 3.3: Mode Selection
*As a user, I want to choose between Light, Automatic, and Custom setup modes.*

- [ ] **Task 3.3.1** [S] - Implement mode selection prompt with Enquirer
- [ ] **Task 3.3.2** [S] - Add descriptions for each mode
- [ ] **Task 3.3.3** [S] - Mark "Automatic" as recommended
- [ ] **Task 3.3.4** [S] - Handle --mode CLI flag to skip prompt

### Story 3.4: Progress Indicators
*As a user, I want to see progress while the CLI works.*

- [ ] **Task 3.4.1** [S] - Implement scanning progress spinner
- [ ] **Task 3.4.2** [S] - Implement generation progress spinner
- [ ] **Task 3.4.3** [S] - Add file creation progress (checkmarks)

### Story 3.5: Completion Screen
*As a user, I want to see what was created and how to verify it.*

- [ ] **Task 3.5.1** [M] - Design completion screen layout
- [ ] **Task 3.5.2** [M] - Implement file tree display
- [ ] **Task 3.5.3** [S] - Add verification instructions
- [ ] **Task 3.5.4** [S] - Add "not quite right?" help section
- [ ] **Task 3.5.5** [S] - Display next steps

---

## Epic 4: Generation System - Light Mode

**Goal:** Implement prompt-based generation for CLAUDE.md (Light mode only).

### Story 4.1: Prompt Builder
*As a developer, I need to build optimal prompts for Claude to generate configuration.*

- [ ] **Task 4.1.1** [M] - Create prompt builder utility
- [ ] **Task 4.1.2** [M] - Build CLAUDE.md generation prompt template
- [ ] **Task 4.1.3** [S] - Add project-specific context injection
- [ ] **Task 4.1.4** [S] - Add constraints and examples to prompts
- [ ] **Task 4.1.5** [S] - Handle multi-tenant specific instructions

### Story 4.2: CLAUDE.md Generator
*As a user, I want a comprehensive, project-specific CLAUDE.md file.*

- [ ] **Task 4.2.1** [L] - Implement CLAUDE.md generator
- [ ] **Task 4.2.2** [M] - Generate project overview section
- [ ] **Task 4.2.3** [M] - Generate tech stack section with detected info
- [ ] **Task 4.2.4** [M] - Generate architecture section (structure, patterns)
- [ ] **Task 4.2.5** [M] - Generate development guidelines (conventions, rules)
- [ ] **Task 4.2.6** [S] - Generate multi-tenancy section (if applicable)
- [ ] **Task 4.2.7** [S] - Generate current issues section (build errors)
- [ ] **Task 4.2.8** [S] - Generate commands section
- [ ] **Task 4.2.9** [S] - Generate environment variables section
- [ ] **Task 4.2.10** [M] - Write unit tests for CLAUDE.md generation

### Story 4.3: Basic Guardrails
*As a user, I want basic permission guardrails for safety.*

- [ ] **Task 4.3.1** [M] - Implement settings.local.json generator
- [ ] **Task 4.3.2** [S] - Define file write permissions (allow/deny)
- [ ] **Task 4.3.3** [S] - Define command permissions (allow/deny/confirm)
- [ ] **Task 4.3.4** [S] - Add project-specific guardrails

### Story 4.4: File Writing
*As a developer, I need to write generated content to the file system.*

- [ ] **Task 4.4.1** [M] - Implement file writer with validation
- [ ] **Task 4.4.2** [S] - Add overwrite protection (--force flag)
- [ ] **Task 4.4.3** [S] - Create .claude directory structure
- [ ] **Task 4.4.4** [S] - Handle file write errors gracefully
- [ ] **Task 4.4.5** [S] - Add dry-run mode (preview only)

---

## Epic 5: Generation System - Automatic Mode

**Goal:** Extend generation to include agents, commands, and MCPs.

### Story 5.1: Agent Selection Logic
*As a user, I want agents that are relevant to my project type.*

- [ ] **Task 5.1.1** [M] - Implement agent recommendation engine
- [ ] **Task 5.1.2** [S] - Select agents for existing projects (security-reviewer, test-quality)
- [ ] **Task 5.1.3** [S] - Select agents for multi-tenant projects (tenant-security)
- [ ] **Task 5.1.4** [S] - Select agents for API integrations (api-compliance)
- [ ] **Task 5.1.5** [S] - Select agents for failing builds (build-fixer)
- [ ] **Task 5.1.6** [S] - Select agents for new projects (PM, architect, developer, QA)

### Story 5.2: Agent File Generation
*As a user, I want agent files tailored to my project.*

- [ ] **Task 5.2.1** [L] - Create agent file generator
- [ ] **Task 5.2.2** [M] - Implement security-reviewer agent template
- [ ] **Task 5.2.3** [M] - Implement test-quality agent template
- [ ] **Task 5.2.4** [M] - Implement tenant-security agent template (with actual tenant field)
- [ ] **Task 5.2.5** [M] - Implement api-compliance agent template (with detected APIs)
- [ ] **Task 5.2.6** [S] - Implement build-fixer agent template
- [ ] **Task 5.2.7** [M] - Implement product-manager agent template (new projects)
- [ ] **Task 5.2.8** [M] - Implement architect agent template (new projects)
- [ ] **Task 5.2.9** [S] - Add project-specific context to each agent
- [ ] **Task 5.2.10** [M] - Write unit tests for agent generation

### Story 5.3: Command Selection Logic
*As a user, I want commands that match my workflow.*

- [ ] **Task 5.3.1** [M] - Implement command recommendation engine
- [ ] **Task 5.3.2** [S] - Always include pre-commit command
- [ ] **Task 5.3.3** [S] - Always include security-scan command
- [ ] **Task 5.3.4** [S] - Include fix-build if build failing
- [ ] **Task 5.3.5** [S] - Include tenant-check if multi-tenant
- [ ] **Task 5.3.6** [S] - Include API-specific commands based on integrations

### Story 5.4: Command File Generation
*As a user, I want command files tailored to my project.*

- [ ] **Task 5.4.1** [M] - Create command file generator
- [ ] **Task 5.4.2** [M] - Implement pre-commit command template
- [ ] **Task 5.4.3** [M] - Implement security-scan command template
- [ ] **Task 5.4.4** [M] - Implement fix-build command template (with actual errors)
- [ ] **Task 5.4.5** [M] - Implement tenant-check command template (with tenant field)
- [ ] **Task 5.4.6** [S] - Use correct package manager in commands
- [ ] **Task 5.4.7** [M] - Write unit tests for command generation

### Story 5.5: MCP Configuration
*As a user, I want MCP recommendations based on my project.*

- [ ] **Task 5.5.1** [M] - Implement MCP recommendation engine
- [ ] **Task 5.5.2** [S] - Recommend GitHub MCP if GitHub detected
- [ ] **Task 5.5.3** [S] - Recommend Supabase MCP if Supabase detected
- [ ] **Task 5.5.4** [S] - Recommend PostgreSQL MCP if PostgreSQL detected
- [ ] **Task 5.5.5** [S] - Recommend Memory MCP for large projects
- [ ] **Task 5.5.6** [M] - Generate settings.json with MCP configuration
- [ ] **Task 5.5.7** [S] - Handle environment variable placeholders

### Story 5.6: Generation Orchestrator
*As a developer, I need to coordinate all generation modules.*

- [ ] **Task 5.6.1** [M] - Create generation orchestrator
- [ ] **Task 5.6.2** [S] - Coordinate CLAUDE.md + agents + commands generation
- [ ] **Task 5.6.3** [S] - Handle generation errors gracefully
- [ ] **Task 5.6.4** [S] - Aggregate warnings and next steps
- [ ] **Task 5.6.5** [M] - Write integration tests for full generation flow

---

## Epic 6: Custom Mode & Interactive Selection

**Goal:** Allow advanced users to manually select components.

### Story 6.1: Component Selection UI
*As a user, I want to manually choose which agents and commands to include.*

- [ ] **Task 6.1.1** [M] - Implement multi-select prompt for agents
- [ ] **Task 6.1.2** [M] - Implement multi-select prompt for commands
- [ ] **Task 6.1.3** [S] - Show descriptions for each option
- [ ] **Task 6.1.4** [S] - Pre-select recommended items
- [ ] **Task 6.1.5** [S] - Allow deselecting all

### Story 6.2: MCP Configuration UI
*As a user, I want to configure MCPs interactively.*

- [ ] **Task 6.2.1** [M] - Implement MCP selection prompt
- [ ] **Task 6.2.2** [S] - Ask for environment variable values (optional)
- [ ] **Task 6.2.3** [S] - Show configuration preview

### Story 6.3: Review & Confirm
*As a user, I want to review my selections before generation.*

- [ ] **Task 6.3.1** [M] - Implement review screen
- [ ] **Task 6.3.2** [S] - Show selected components summary
- [ ] **Task 6.3.3** [S] - Allow going back to edit
- [ ] **Task 6.3.4** [S] - Confirm before proceeding

---

## Epic 7: Additional CLI Commands

**Goal:** Implement supporting commands (add, doctor, export).

### Story 7.1: Add Command
*As a user, I want to add individual components after initial setup.*

- [ ] **Task 7.1.1** [M] - Implement `claude-setup add agent <name>` command
- [ ] **Task 7.1.2** [M] - Implement `claude-setup add command <name>` command
- [ ] **Task 7.1.3** [M] - Implement `claude-setup add mcp <name>` command
- [ ] **Task 7.1.4** [S] - Implement `claude-setup add --list` to show available options
- [ ] **Task 7.1.5** [S] - Check for duplicates before adding
- [ ] **Task 7.1.6** [S] - Update existing configuration files

### Story 7.2: Doctor Command
*As a user, I want to validate my Claude Code setup.*

- [ ] **Task 7.2.1** [M] - Implement `claude-setup doctor` command
- [ ] **Task 7.2.2** [S] - Check if CLAUDE.md exists and is valid
- [ ] **Task 7.2.3** [S] - Check if .claude directory structure is correct
- [ ] **Task 7.2.4** [S] - Validate agent files (YAML frontmatter)
- [ ] **Task 7.2.5** [S] - Validate command files
- [ ] **Task 7.2.6** [S] - Validate settings.json and settings.local.json
- [ ] **Task 7.2.7** [S] - Display validation results with recommendations

### Story 7.3: Export Command
*As a user, I want to export my configuration.*

- [ ] **Task 7.3.1** [M] - Implement `claude-setup export` command
- [ ] **Task 7.3.2** [S] - Support JSON export format
- [ ] **Task 7.3.3** [S] - Support YAML export format
- [ ] **Task 7.3.4** [S] - Write to file with --output flag
- [ ] **Task 7.3.5** [S] - Print to stdout by default

---

## Epic 8: Testing & Quality

**Goal:** Ensure reliability through comprehensive testing.

### Story 8.1: Unit Tests
*As a developer, I need unit tests for all core modules.*

- [ ] **Task 8.1.1** [M] - Write tests for package analyzer
- [ ] **Task 8.1.2** [M] - Write tests for structure analyzer
- [ ] **Task 8.1.3** [M] - Write tests for pattern analyzer
- [ ] **Task 8.1.4** [M] - Write tests for CLAUDE.md generator
- [ ] **Task 8.1.5** [M] - Write tests for agent generator
- [ ] **Task 8.1.6** [M] - Write tests for command generator
- [ ] **Task 8.1.7** [S] - Write tests for utilities (logger, fs, git)
- [ ] **Task 8.1.8** [S] - Achieve 80%+ code coverage

### Story 8.2: Integration Tests
*As a developer, I need end-to-end tests for the full CLI flow.*

- [ ] **Task 8.2.1** [L] - Create test fixtures (sample projects)
- [ ] **Task 8.2.2** [M] - Test Light mode flow on Next.js project
- [ ] **Task 8.2.3** [M] - Test Automatic mode flow on multi-tenant project
- [ ] **Task 8.2.4** [M] - Test Custom mode flow
- [ ] **Task 8.2.5** [M] - Test add command
- [ ] **Task 8.2.6** [M] - Test doctor command
- [ ] **Task 8.2.7** [S] - Test error scenarios

### Story 8.3: Manual Testing
*As a QA, I need to test the CLI on real projects.*

- [ ] **Task 8.3.1** [L] - Test on brand new project (empty directory)
- [ ] **Task 8.3.2** [L] - Test on Next.js + Supabase project
- [ ] **Task 8.3.3** [L] - Test on Express + PostgreSQL project
- [ ] **Task 8.3.4** [L] - Test on monorepo
- [ ] **Task 8.3.5** [M] - Test with failing build
- [ ] **Task 8.3.6** [M] - Document any issues found

---

## Epic 9: Documentation & Publishing

**Goal:** Document the project and publish to npm.

### Story 9.1: Documentation
*As a user, I need clear documentation on how to use the CLI.*

- [ ] **Task 9.1.1** [M] - Write comprehensive README.md
- [ ] **Task 9.1.2** [S] - Add installation instructions
- [ ] **Task 9.1.3** [S] - Add usage examples
- [ ] **Task 9.1.4** [S] - Document all commands and flags
- [ ] **Task 9.1.5** [S] - Add troubleshooting section
- [ ] **Task 9.1.6** [S] - Create CHANGELOG.md
- [ ] **Task 9.1.7** [S] - Add contributing guidelines (CONTRIBUTING.md)
- [ ] **Task 9.1.8** [S] - Add LICENSE (MIT)

### Story 9.2: Package Preparation
*As a developer, I need to prepare the package for npm publication.*

- [ ] **Task 9.2.1** [S] - Finalize package.json (name, version, keywords)
- [ ] **Task 9.2.2** [S] - Configure bin entry point
- [ ] **Task 9.2.3** [S] - Set up build scripts (tsup)
- [ ] **Task 9.2.4** [S] - Configure files to include in package
- [ ] **Task 9.2.5** [S] - Test local installation with `npm link`
- [ ] **Task 9.2.6** [S] - Test npx execution

### Story 9.3: Publishing
*As a maintainer, I want to publish the package to npm.*

- [ ] **Task 9.3.1** [S] - Create npm account
- [ ] **Task 9.3.2** [S] - Set up GitHub repository
- [ ] **Task 9.3.3** [S] - Create GitHub release workflow
- [ ] **Task 9.3.4** [S] - Publish v1.0.0 to npm
- [ ] **Task 9.3.5** [S] - Verify installation and basic usage
- [ ] **Task 9.3.6** [S] - Announce on relevant channels

---

## Epic 10: Polish & Enhancements

**Goal:** Add nice-to-have features and improvements.

### Story 10.1: Enhanced Error Handling
*As a user, I want helpful error messages when things go wrong.*

- [ ] **Task 10.1.1** [M] - Add user-friendly error messages
- [ ] **Task 10.1.2** [S] - Suggest fixes for common errors
- [ ] **Task 10.1.3** [S] - Add debug mode (--debug flag)
- [ ] **Task 10.1.4** [S] - Log errors to file for reporting

### Story 10.2: Performance Optimization
*As a user, I want the CLI to run quickly.*

- [ ] **Task 10.2.1** [M] - Optimize file scanning (parallel processing)
- [ ] **Task 10.2.2** [S] - Cache detection results
- [ ] **Task 10.2.3** [S] - Reduce unnecessary file reads
- [ ] **Task 10.2.4** [S] - Profile and optimize slow operations

### Story 10.3: Configuration Updates
*As a user, I want to update existing configuration without starting over.*

- [ ] **Task 10.3.1** [M] - Implement `claude-setup init --update` mode
- [ ] **Task 10.3.2** [S] - Preserve user customizations
- [ ] **Task 10.3.3** [S] - Merge new recommendations with existing setup
- [ ] **Task 10.3.4** [S] - Show diff before applying changes

### Story 10.4: Analytics & Telemetry (Optional)
*As a maintainer, I want to understand how the CLI is used (with user consent).*

- [ ] **Task 10.4.1** [M] - Implement optional anonymous telemetry
- [ ] **Task 10.4.2** [S] - Ask for consent on first run
- [ ] **Task 10.4.3** [S] - Track mode usage, project types
- [ ] **Task 10.4.4** [S] - Respect user privacy (opt-out anytime)

---

## Development Priorities

### Phase 1: MVP (Epics 1-4)
**Goal:** Get Light mode working end-to-end
- Project foundation
- Detection engine
- UI/UX
- Light mode generation (CLAUDE.md only)

**Estimated Tasks:** ~60 tasks (mostly S/M complexity)

### Phase 2: Full Features (Epics 5-6)
**Goal:** Add Automatic and Custom modes
- Agent generation
- Command generation
- MCP configuration
- Custom mode

**Estimated Tasks:** ~45 tasks (mix of M/L complexity)

### Phase 3: Polish (Epics 7-9)
**Goal:** Make it production-ready
- Additional commands (add, doctor, export)
- Comprehensive testing
- Documentation
- Publishing

**Estimated Tasks:** ~40 tasks (mostly M complexity)

### Phase 4: Enhancements (Epic 10)
**Goal:** Nice-to-have improvements
- Better error handling
- Performance optimization
- Update mode
- Analytics (optional)

**Estimated Tasks:** ~15 tasks (mostly M complexity)

---

## Success Metrics

### Performance
- [ ] Full setup completes in under 3 minutes
- [ ] Detection accuracy: 90%+ auto-detection
- [ ] User questions: Maximum 1 (mode selection)

### Quality
- [ ] Generated CLAUDE.md has zero generic placeholders
- [ ] All agent files reference actual project patterns
- [ ] Commands use correct package manager and paths
- [ ] Multi-tenant rules use actual detected tenant field

### User Experience
- [ ] Clear progress indicators throughout
- [ ] Helpful completion summary with verification steps
- [ ] Easy iteration path explained
- [ ] No confusing error messages

### Testing
- [ ] 80%+ code coverage
- [ ] All integration tests passing
- [ ] Manual testing on 5+ real projects
- [ ] Zero critical bugs before v1.0.0

---

## Notes for Implementation

1. **Start Small:** Begin with Epic 1 (Foundation) and get the basic CLI working
2. **Iterate:** Build Light mode first (Epic 4), validate with real projects, then add Automatic mode
3. **Test Early:** Write tests alongside code, not after
4. **Real Projects:** Test on actual Next.js, Express, and multi-tenant projects frequently
5. **User Feedback:** Get feedback from 3-5 users before each phase
6. **Documentation:** Keep README updated as features are added

---

## Total Estimated Tasks: ~160 tasks
- Small (S): ~80 tasks
- Medium (M): ~65 tasks
- Large (L): ~15 tasks

**Estimated Timeline:**
- Phase 1 (MVP): 2-3 weeks
- Phase 2 (Full Features): 2-3 weeks
- Phase 3 (Polish): 1-2 weeks
- Phase 4 (Enhancements): 1 week

**Total: 6-9 weeks** for full v1.0.0 release
