# Claude Setup CLI - Complete Development Handoff

> This document contains all the information required to develop the CLI from scratch to publication.

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Core Principles](#2-core-principles)
3. [User Flow & Experience](#3-user-flow--experience)
4. [Architecture & Structure](#4-architecture--structure)
5. [Detection Engine](#5-detection-engine)
6. [Generation Strategy](#6-generation-strategy)
7. [Setup Modes](#7-setup-modes)
8. [Agent System](#8-agent-system)
9. [Command Templates](#9-command-templates)
10. [MCP Configuration](#10-mcp-configuration)
11. [Guardrails System](#11-guardrails-system)
12. [Technical Implementation](#12-technical-implementation)
13. [Publishing & Distribution](#13-publishing--distribution)
14. [Success Criteria](#14-success-criteria)

---

## 1. Project Vision

### What is Claude Setup CLI?

A CLI tool that **automates Claude Code environment setup**. Instead of manually configuring 50+ YAML fields, the CLI:

1. **Scans** the project automatically
2. **Detects** 90%+ of configuration
3. **Asks** only 1 question (setup level)
4. **Generates** high-quality, context-aware configuration
5. **Enables** iterative refinement through conversation

### The Problem We're Solving

| Current Pain | Our Solution |
|--------------|--------------|
| 50+ fields to configure manually | Auto-detect everything possible |
| Generic templates that don't fit | Deep project understanding |
| Over-engineered setups | Mode-based complexity (Light/Auto/Custom) |
| External skill dependencies | In-line generation, no external pulls |
| No guidance on what to add | Smart recommendations based on project |

### Target Users

- Developers starting with Claude Code
- Teams adopting AI-assisted development
- Enterprise environments needing controlled setups
- Projects of any size (MVP to large-scale)

---

## 2. Core Principles

### 2.1 CLI Prepares, Claude Writes

**Critical Concept:** The CLI does NOT use templates directly. Instead:

```
┌─────────────────────────────────────────────────────────────────┐
│  Traditional Approach (❌ We're NOT doing this)                 │
│                                                                 │
│  CLI → Template Files → String Replace → Output                 │
│  Result: Generic, cookie-cutter configuration                   │
├─────────────────────────────────────────────────────────────────┤
│  Our Approach (✅ What we're building)                          │
│                                                                 │
│  CLI → Deep Project Analysis → Optimal Prompt → Claude Writes   │
│  Result: High-quality, project-specific configuration           │
└─────────────────────────────────────────────────────────────────┘
```

**Why This Matters:**
- Agents/commands deeply understand the actual project
- No generic placeholder text
- Better quality than any template could achieve
- Adapts to project nuances automatically

### 2.2 Minimal Friction

| Principle | Implementation |
|-----------|----------------|
| Maximum 1 question for standard flow | Mode selection only |
| Auto-detect everything possible | Deep project scanning |
| Smart defaults | Based on project analysis |
| No endless wizard loops | Single pass, then iterate |

### 2.3 Quality Over Speed

- Better to generate less but higher quality
- User can iterate via conversation after setup
- Agents/commands must deeply understand the project

### 2.4 No External Dependencies (for Enterprise)

```
Light Mode Requirements:
- No external skill pulls
- No MCPs required
- Works in air-gapped environments
- Zero network calls during generation
```

---

## 3. User Flow & Experience

### 3.1 Visual Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Explain    │────▶│    Scan      │────▶│   Choose     │────▶│   Generate   │
│  What Will   │     │   Project    │     │    Mode      │     │    Files     │
│   Happen     │     │  (Auto)      │     │  (1 question)│     │   (Auto)     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                   │                    │                     │
       ▼                   ▼                    ▼                     ▼
   "Welcome!            "Found:             "Choose:              Creating...
   Here's what       Next.js 14        [L]ight - 2min         ✓ CLAUDE.md
   will happen..."   TypeScript        [A]uto - 3min          ✓ 3 agents
                     Supabase..."      [C]ustom - 5min+"      ✓ 4 commands
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │   Summary    │
                                                               │  + How to    │
                                                               │   Verify     │
                                                               │  + Fix Loop  │
                                                               └──────────────┘
```

### 3.2 Welcome Screen

```
╔═══════════════════════════════════════════════════════════════════╗
║  🚀 Claude Code Setup                                              ║
╚═══════════════════════════════════════════════════════════════════╝

Welcome! I'll help you set up Claude Code for your project.

What will happen:
─────────────────
1. 🔍 Scan - I'll analyze your project (automatic)
2. 📋 Choose - You pick a setup level (1 question)
3. ✨ Generate - I'll create configuration (automatic)
4. 🔄 Refine - You can adjust via chat (optional)

Press Enter to continue...
```

### 3.3 Detection Summary Screen

```
╔═══════════════════════════════════════════════════════════════════╗
║  📊 Project Analysis Complete                                      ║
╚═══════════════════════════════════════════════════════════════════╝

Project: my-saas-app
Type: Existing web application (142 source files)

Detected Stack:
├─ Framework: Next.js 14.2
├─ Language: TypeScript 5.3
├─ Database: Supabase (PostgreSQL)
├─ Auth: Supabase Auth
├─ Testing: Vitest + Playwright
└─ Package Manager: pnpm

Special Patterns:
├─ ✓ Multi-tenant (user_id based)
├─ ✓ External APIs: Gmail, Google Sheets
└─ ⚠ Build issues detected (3 errors)

Recommended agents: security-reviewer, test-quality, tenant-security
Recommended commands: pre-commit, security-scan, fix-build
```

### 3.4 Mode Selection (The ONE Question)

```
How would you like to set up Claude Code?

[L] Light     - Basic CLAUDE.md only (2 minutes)
               Best for: MVPs, simple projects, enterprise restrictions

[A] Automatic - Full setup with recommendations (3 minutes) ⭐ Recommended
               Includes: CLAUDE.md + agents + commands + guardrails

[C] Custom    - Choose each component (5+ minutes)
               For: Advanced users who want full control

Your choice [L/A/C]:
```

### 3.5 Completion & Verification Screen

```
╔═══════════════════════════════════════════════════════════════════╗
║  ✅ Setup Complete!                                                ║
╚═══════════════════════════════════════════════════════════════════╝

Created files:
├─ CLAUDE.md                    (main documentation)
├─ .claude/settings.json        (MCP configuration)
├─ .claude/settings.local.json  (guardrails)
├─ .claude/agents/
│  ├─ security-reviewer.md
│  ├─ test-quality.md
│  └─ tenant-security.md
└─ .claude/commands/
   ├─ pre-commit.md
   ├─ security-scan.md
   └─ fix-build.md

How to Verify:
──────────────
1. Open CLAUDE.md and check if the project description is accurate
2. Review each agent in .claude/agents/ - do they match your needs?
3. Test a command: claude /security-scan
4. Run: claude-setup doctor (to validate configuration)

Not quite right?
────────────────
• Open a chat with Claude Code and say:
  "The security-reviewer agent should focus more on OWASP Top 10"
  
• Or run: claude-setup add-agent <name>

Happy coding! 🎉
```

---

## 4. Architecture & Structure

### 4.1 CLI Project Structure

```
claude-setup-cli/
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── bin/
│   └── claude-setup.js              # Entry point shebang
├── src/
│   ├── index.ts                     # Main exports
│   ├── cli.ts                       # Command registration
│   │
│   ├── commands/                    # CLI Commands
│   │   ├── init.ts                  # Main initialization
│   │   ├── add.ts                   # Add components
│   │   ├── doctor.ts                # Validate setup
│   │   └── export.ts                # Export config
│   │
│   ├── detector/                    # Project Analysis
│   │   ├── index.ts                 # Detection orchestrator
│   │   ├── package-analyzer.ts      # package.json analysis
│   │   ├── structure-analyzer.ts    # File structure
│   │   ├── pattern-analyzer.ts      # Code patterns
│   │   └── health-checker.ts        # Build/test status
│   │
│   ├── generator/                   # Content Generation
│   │   ├── index.ts                 # Generation orchestrator
│   │   ├── claude-md.ts             # CLAUDE.md generator
│   │   ├── agents.ts                # Agent file generator
│   │   ├── commands.ts              # Command file generator
│   │   ├── guardrails.ts            # Settings generator
│   │   └── prompts.ts               # Prompt builder for Claude
│   │
│   ├── ui/                          # User Interface
│   │   ├── screens.ts               # Screen renderers
│   │   ├── prompts.ts               # Interactive prompts
│   │   └── progress.ts              # Progress indicators
│   │
│   ├── utils/                       # Utilities
│   │   ├── logger.ts                # Pretty console output
│   │   ├── fs.ts                    # File system helpers
│   │   └── git.ts                   # Git operations
│   │
│   ├── types/                       # TypeScript Types
│   │   └── index.ts                 # All type definitions
│   │
│   └── constants/                   # Static Data
│       ├── agents.ts                # Agent definitions
│       ├── commands.ts              # Command definitions
│       ├── mcps.ts                  # MCP definitions
│       └── defaults.ts              # Default values
│
├── tests/
│   ├── detector.test.ts
│   ├── generator.test.ts
│   └── cli.test.ts
│
└── scripts/
    └── postinstall.js
```

### 4.2 Output Structure (What Gets Created)

```
project-root/
├── CLAUDE.md                      # Main documentation
└── .claude/
    ├── settings.json              # MCP configuration
    ├── settings.local.json        # Guardrails & permissions
    │
    ├── agents/                    # Sub-agents
    │   ├── security-reviewer.md
    │   ├── test-quality.md
    │   └── [project-specific].md
    │
    ├── commands/                  # Custom commands
    │   ├── pre-commit.md
    │   ├── security-scan.md
    │   └── [project-specific].md
    │
    └── workflows/                 # (For new projects only)
        └── new-feature.md
```

---

## 5. Detection Engine

### 5.1 Detection Sources

```typescript
interface DetectedProject {
  // Basic Info
  name: string;
  type: 'new' | 'existing';
  fileCount: number;
  
  // Tech Stack (from package.json, etc.)
  framework: string | null;           // Next.js, Vue, Express...
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'other';
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | null;
  
  // Database (from dependencies + config files)
  database: {
    type: string;      // postgresql, mysql, mongodb
    provider: string;  // supabase, planetscale, mongodb-atlas
    orm: string;       // prisma, drizzle, mongoose
  } | null;
  
  // Auth (from dependencies + code patterns)
  auth: {
    provider: string;     // supabase, firebase, clerk, auth0
    methods: string[];    // email, oauth, magic-link
  } | null;
  
  // Testing
  testing: {
    unit: string;    // vitest, jest, pytest
    e2e: string;     // playwright, cypress
  } | null;
  
  // Architecture
  isMultiTenant: boolean | 'maybe';
  tenantField: string | null;  // user_id, org_id, workspace_id
  externalApis: string[];      // gmail, stripe, twilio...
  
  // Structure
  monorepo: boolean;
  cicd: string | null;  // github-actions, gitlab-ci
  
  // Health
  buildStatus: 'passing' | 'failing' | 'unknown';
  buildErrors: string[];
  hasTests: boolean;
  testsPassing: boolean | 'unknown';
}
```

### 5.2 Detection Logic by Source

#### From package.json:

```typescript
const FRAMEWORK_DETECTION = {
  'next': 'Next.js',
  'react': 'React',
  'vue': 'Vue',
  'nuxt': 'Nuxt',
  '@angular/core': 'Angular',
  'svelte': 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  'astro': 'Astro',
  '@remix-run/react': 'Remix',
  'express': 'Express',
  'fastify': 'Fastify',
  'hono': 'Hono',
  'koa': 'Koa',
};

const DATABASE_DETECTION = {
  '@supabase/supabase-js': { provider: 'supabase', type: 'postgresql' },
  'prisma': { orm: 'prisma' },
  '@prisma/client': { orm: 'prisma' },
  'drizzle-orm': { orm: 'drizzle' },
  'mongoose': { type: 'mongodb', orm: 'mongoose' },
  'pg': { type: 'postgresql' },
  'mysql2': { type: 'mysql' },
};

const AUTH_DETECTION = {
  '@supabase/auth-helpers-nextjs': 'supabase',
  'firebase': 'firebase',
  '@clerk/nextjs': 'clerk',
  '@auth0/nextjs-auth0': 'auth0',
  'next-auth': 'nextauth',
};

const EXTERNAL_API_DETECTION = {
  'googleapis': ['google-sheets', 'google-drive'],
  '@google-cloud/gmail': ['gmail'],
  'stripe': ['stripe'],
  '@sendgrid/mail': ['sendgrid'],
  'resend': ['resend'],
  'twilio': ['twilio'],
  'openai': ['openai'],
  '@anthropic-ai/sdk': ['anthropic'],
};
```

#### From File Structure:

```typescript
const STRUCTURE_PATTERNS = {
  // Monorepo detection
  monorepo: [
    'pnpm-workspace.yaml',
    'turbo.json',
    'nx.json',
    'lerna.json',
    'packages/',
    'apps/',
  ],
  
  // App structure
  nextApp: ['app/', 'pages/'],
  srcDir: ['src/'],
  
  // Test locations
  tests: [
    'tests/',
    '__tests__/',
    '*.test.ts',
    '*.spec.ts',
    'test/',
  ],
  
  // CI/CD
  cicd: [
    '.github/workflows/',
    '.gitlab-ci.yml',
    'Jenkinsfile',
    '.circleci/',
  ],
};
```

#### From Code Patterns (for existing projects):

```typescript
// Multi-tenant detection - search for these patterns
const TENANT_PATTERNS = [
  /where.*user_id\s*[=:]/i,
  /where.*org_id\s*[=:]/i,
  /where.*organization_id\s*[=:]/i,
  /where.*tenant_id\s*[=:]/i,
  /where.*workspace_id\s*[=:]/i,
  /\.eq\(['"]user_id['"]/,
  /\.eq\(['"]org_id['"]/,
];

// API route detection
const API_PATTERNS = {
  rest: [
    /app\/api\/.*\/route\.ts/,
    /pages\/api\//,
  ],
  graphql: [
    /schema\.graphql/,
    /resolvers\//,
  ],
  trpc: [
    /trpc/,
    /createTRPCRouter/,
  ],
};
```

### 5.3 Health Check Commands

```typescript
const HEALTH_CHECKS = {
  build: {
    pnpm: 'pnpm build',
    npm: 'npm run build',
    yarn: 'yarn build',
    bun: 'bun run build',
  },
  test: {
    pnpm: 'pnpm test',
    npm: 'npm test',
    yarn: 'yarn test',
    bun: 'bun test',
  },
  typecheck: 'npx tsc --noEmit',
  lint: 'npx eslint . --ext .ts,.tsx',
};
```

### 5.4 Cannot Detect (Must Ask If Critical)

```typescript
const MUST_ASK = [
  'compliance',        // GDPR, PCI, HIPAA
  'targetEnvironment', // production vs MVP
];

// Only ask if patterns are ambiguous
const ASK_IF_AMBIGUOUS = [
  'multiTenant',  // if tenant patterns found but unclear
];
```

---

## 6. Generation Strategy

### 6.1 Prompt-Based Generation

Instead of templates, we build optimal prompts for Claude:

```typescript
interface GenerationPrompt {
  context: {
    project: DetectedProject;
    mode: 'light' | 'automatic' | 'custom';
  };
  instruction: string;
  constraints: string[];
  examples?: string[];
}

function buildClaudeMdPrompt(project: DetectedProject): GenerationPrompt {
  return {
    context: { project, mode: 'automatic' },
    instruction: `
      Generate a comprehensive CLAUDE.md file for this project.
      
      Project Details:
      - Name: ${project.name}
      - Framework: ${project.framework}
      - Database: ${project.database?.type} with ${project.database?.orm}
      - Auth: ${project.auth?.provider}
      - Multi-tenant: ${project.isMultiTenant} (field: ${project.tenantField})
      - External APIs: ${project.externalApis.join(', ')}
      
      Current Status:
      - Build: ${project.buildStatus}
      - Issues: ${project.buildErrors.join(', ')}
    `,
    constraints: [
      'Be specific to THIS project - no generic placeholders',
      'Include actual file paths discovered',
      'Reference actual dependencies found',
      'If multi-tenant, emphasize tenant isolation rules',
      'Include actual build errors if any',
    ],
  };
}
```

### 6.2 CLAUDE.md Structure

The generated CLAUDE.md should include:

```markdown
# {PROJECT_NAME}

## Project Overview
{Generated based on detected patterns and purpose}

## Tech Stack
### Frontend
- Framework: {DETECTED} {version}
- Language: {DETECTED}
- UI Library: {DETECTED}

### Backend
- Framework: {DETECTED}
- Language: {DETECTED}

### Database
- Type: {DETECTED}
- Provider: {DETECTED}
- ORM: {DETECTED}

### Authentication
- Provider: {DETECTED}
- Methods: {DETECTED}

### External Integrations
{List each detected API with its purpose}

---

## Architecture

### Directory Structure
```
{ACTUAL discovered structure}
```

### Key Data Flows
{Generated based on detected patterns}

{IF multi-tenant}
### Multi-Tenancy
- Tenant Identifier: {DETECTED FIELD}
- Isolation Strategy: {DETECTED PATTERN}
- **CRITICAL**: All database queries MUST include {FIELD} filter
{ENDIF}

---

## Development Guidelines

### Code Conventions
{Discovered from existing code patterns}

### Database Rules
- Use parameterized queries only
- Never use string concatenation for SQL
{IF multi-tenant}
- **MANDATORY**: Include {FIELD} in ALL queries
- Validate tenant access before any data operation
{ENDIF}

### Security Rules
- Never log sensitive data
- Never commit secrets
- Validate all user input
- Use environment variables

{FOR EACH external API}
### {API_NAME} Integration
{Specific rules and requirements}
{ENDFOR}

### Testing Standards
- Test real behavior, not mocks
- Mock only: external APIs, time, randomness
- Do NOT mock: internal services, database
- Minimum coverage: 80% critical paths

---

## Current Issues

{IF build errors}
### Build Errors
{List each error with location}
{ENDIF}

{IF test failures}
### Test Failures
{List failing tests}
{ENDIF}

---

## Commands

### Development
- `{PM} dev` - Start development server
- `{PM} build` - Build for production
- `{PM} test` - Run tests

### Custom Commands (Claude Code)
- `/security-scan` - Run security analysis
- `/pre-commit` - Pre-commit checks
{Additional based on project}

---

## Environment Variables

### Required
{List all detected env vars with descriptions}

### Optional
{List optional vars}
```

---

## 7. Setup Modes

### 7.1 Light Mode

**Target:** MVPs, simple projects, enterprise restrictions

**Creates:**
- CLAUDE.md only
- Basic guardrails

**Does NOT create:**
- Agents
- Commands
- MCPs
- Workflows

**Time:** ~2 minutes

### 7.2 Automatic Mode (Recommended)

**Target:** Most projects

**Creates:**
- Full CLAUDE.md
- Recommended agents based on project
- Recommended commands based on workflow
- Guardrails
- MCPs if beneficial

**Agent Selection Logic:**

```typescript
function selectAgents(project: DetectedProject): string[] {
  const agents: string[] = [];
  
  // Always include for existing projects
  if (project.type === 'existing') {
    agents.push('security-reviewer');
    
    if (project.hasTests) {
      agents.push('test-quality');
    }
    
    if (project.isMultiTenant) {
      agents.push('tenant-security');
    }
    
    if (project.externalApis.length > 0) {
      agents.push('api-compliance');
    }
    
    if (project.buildStatus === 'failing') {
      agents.push('build-fixer');
    }
  }
  
  // For new projects - team agents
  if (project.type === 'new') {
    agents.push('product-manager');
    agents.push('architect');
    agents.push('developer');
    agents.push('qa-engineer');
  }
  
  return agents;
}
```

**Time:** ~3 minutes

### 7.3 Custom Mode

**Target:** Advanced users

**Flow:**
```
1. Show all available components
2. User selects agents (multi-select)
3. User selects commands (multi-select)
4. User configures MCPs
5. Review and confirm
```

**Time:** 5+ minutes

---

## 8. Agent System

### 8.1 Agent Types by Project State

#### For Existing Projects (Technical Focus)

| Agent | Purpose | When to Include |
|-------|---------|-----------------|
| `security-reviewer` | OWASP, vulnerabilities, auth flaws | Always |
| `test-quality` | Test effectiveness, coverage gaps | If has tests |
| `tenant-security` | Multi-tenant isolation | If multi-tenant |
| `api-compliance` | External API requirements | If external APIs |
| `build-fixer` | Fix build/test failures | If build failing |

#### For New Projects (Team Focus)

| Agent | Purpose | When to Include |
|-------|---------|-----------------|
| `product-manager` | Requirements, user stories | Always for new |
| `architect` | Design, patterns, structure | Always for new |
| `developer` | Implementation focus | Always for new |
| `qa-engineer` | Testing, quality | Always for new |
| `devops` | CI/CD, deployment | Optional |

### 8.2 Agent Template Structure

All agents use Claude Code's official format:

```markdown
---
name: agent-name
description: One line description
model: claude-sonnet-4-20250514
---

# Agent Role

{Detailed description of what this agent does}

# When to Activate

{Conditions for when this agent should be used}

# Analysis Process

{Step-by-step process this agent follows}

# Output Format

{Expected output structure}

# Project Context

{Project-specific context from detection}

# Important Rules

{Critical rules this agent must follow}
```

### 8.3 Agent Definitions

#### Security Reviewer Agent

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities and compliance
model: claude-sonnet-4-20250514
---

# Security Reviewer Agent

You are a security expert reviewing code for vulnerabilities.

# Focus Areas

1. **OWASP Top 10** - SQL injection, XSS, CSRF, etc.
2. **Authentication Flaws** - Session management, token handling
3. **Authorization Issues** - Access control, privilege escalation
4. **Data Exposure** - PII leaks, logging sensitive data
5. **Configuration** - Secrets in code, insecure defaults

{IF multi-tenant}
6. **Tenant Isolation** - Cross-tenant data access
{ENDIF}

{IF external APIs}
7. **API Security** - Rate limiting, key management
{ENDIF}

# Analysis Process

1. Identify the scope (file, directory, or full project)
2. Check for OWASP Top 10 vulnerabilities
3. Review authentication implementation
4. Verify authorization checks on all endpoints
5. Search for hardcoded secrets or credentials
{IF multi-tenant}
6. Verify tenant isolation in ALL database queries
{ENDIF}

# Output Format

## Security Review Results

### CRITICAL Issues
[Issues that must be fixed before production]

### HIGH Issues
[Issues that should be fixed soon]

### MEDIUM Issues
[Issues to address when possible]

### LOW Issues
[Minor improvements]

### Summary
- Total issues: X
- CRITICAL: X | HIGH: X | MEDIUM: X | LOW: X

# Project-Specific Rules

{Generated based on detected project}
```

#### Test Quality Agent

```markdown
---
name: test-quality
description: Analyzes test effectiveness and coverage
model: claude-sonnet-4-20250514
---

# Test Quality Agent

You analyze tests to ensure they actually test behavior, not just mocks.

# Anti-Patterns to Detect

1. **Mock Abuse** - Tests that only verify mock calls
2. **No Assertions** - Tests with missing or trivial assertions
3. **Implementation Testing** - Tests that break on refactoring
4. **Missing Error Cases** - No tests for failure scenarios
5. **Incomplete Coverage** - Critical paths without tests

# What Makes a Good Test

✅ Tests actual output, not implementation
✅ Uses real database for data tests (or test containers)
✅ Mocks ONLY: external APIs, time, randomness
✅ Has meaningful assertions
✅ Tests edge cases and errors

# Analysis Process

For each test file:
1. Count assertions vs mock verifications
2. Check if mocks replace system under test
3. Identify missing error scenario tests
4. Check for hardcoded test data issues
5. Verify coverage of critical paths

# Output Format

## Test Quality Report

### Critical Issues
[Tests that provide false confidence]

### Improvements Needed
[Tests that should be enhanced]

### Missing Tests
[Critical paths without coverage]

### Good Examples
[Tests worth using as reference]

### Metrics
- Files analyzed: X
- Tests reviewed: X
- Issues found: X
```

#### Tenant Security Agent (for multi-tenant projects)

```markdown
---
name: tenant-security
description: Ensures proper multi-tenant data isolation
model: claude-sonnet-4-20250514
---

# Tenant Security Agent

You verify that multi-tenant data isolation is properly implemented.

# Critical Rule

**EVERY database query that accesses tenant data MUST include {TENANT_FIELD} filter.**

# Tenant Field: {DETECTED_FIELD}

# Check Process

1. Find all database queries (Prisma, raw SQL, Supabase, etc.)
2. For each query accessing tenant data:
   - Verify {TENANT_FIELD} filter is present
   - Check filter cannot be bypassed
   - Verify filter comes from authenticated session
3. Check API routes for authorization
4. Verify RLS policies (if using Supabase/PostgreSQL)

# Red Flags

🚨 Query without tenant filter:
```typescript
// WRONG - No tenant filter!
const contacts = await db.contacts.findMany();

// CORRECT - With tenant filter
const contacts = await db.contacts.findMany({
  where: { user_id: session.user.id }
});
```

🚨 Tenant ID from request body (user-controllable):
```typescript
// WRONG - User can send any user_id
const { user_id } = req.body;

// CORRECT - From authenticated session
const user_id = session.user.id;
```

# Output Format

## Tenant Isolation Review

### CRITICAL - Missing Tenant Filters
[Queries that expose cross-tenant data]

### HIGH - Bypassable Filters
[Filters that could be circumvented]

### Verified Queries
[Properly isolated queries]

### Summary
- Total queries checked: X
- Properly isolated: X
- Issues found: X
```

#### API Compliance Agent

```markdown
---
name: api-compliance
description: Ensures external API integrations follow best practices
model: claude-sonnet-4-20250514
---

# API Compliance Agent

You verify external API integrations follow requirements and best practices.

# External APIs in This Project

{LIST_DETECTED_APIS}

{FOR EACH API}
## {API_NAME} Requirements

### Rate Limiting
{Specific limits for this API}

### Authentication
{Auth requirements}

### Data Handling
{Data storage/processing rules}

### Common Issues
{Known pitfalls}
{ENDFOR}

# Example: Gmail API Requirements

## Gmail API Compliance

### Rate Limits
- 250 quota units/user/second
- Batch requests: max 100 messages
- Implement exponential backoff

### Required Scopes
- Use minimum necessary scopes
- Request incrementally

### Data Handling
- Never store email content long-term
- Implement proper deletion
- GDPR compliance for EU users

### Common Issues
- Not handling 429 errors
- Sending too fast (batching required)
- Missing unsubscribe headers (marketing emails)

# Output Format

## API Compliance Review

### {API_NAME}
#### Status: ✅ Compliant / ⚠️ Issues Found / 🚨 Critical Issues

#### Issues
[List specific issues]

#### Recommendations
[How to fix]
```

#### Product Manager Agent (for new projects)

```markdown
---
name: product-manager
description: Defines requirements, user stories, and priorities
model: claude-sonnet-4-20250514
---

# Product Manager Agent

You help define what to build and why.

# Responsibilities

1. **Requirements Definition** - Clear, testable requirements
2. **User Stories** - From user perspective
3. **Prioritization** - What to build first
4. **Acceptance Criteria** - How to verify completion
5. **Scope Management** - What's in/out of MVP

# Output Format for Features

## Feature: {NAME}

### User Story
As a {user type}, I want to {action} so that {benefit}.

### Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

### Priority
{P0/P1/P2/P3}

### Dependencies
{List any dependencies}

### Out of Scope
{What this feature does NOT include}
```

#### Architect Agent (for new projects)

```markdown
---
name: architect
description: Designs system structure and chooses patterns
model: claude-sonnet-4-20250514
---

# Architect Agent

You design system architecture and make structural decisions.

# Responsibilities

1. **System Design** - Overall architecture
2. **Pattern Selection** - Which patterns to use
3. **Technology Decisions** - Library/framework choices
4. **API Design** - Endpoint structure
5. **Data Modeling** - Database schema
6. **Code Review** - Structural concerns

# Design Document Format

## {FEATURE} Architecture

### Overview
{High-level description}

### Components
{Component diagram in text}

### Data Model
{Entity relationships}

### API Design
{Endpoint specifications}

### Dependencies
{External services needed}

### Alternatives Considered
{Why this approach over others}
```

### 8.4 Workflow Orchestration (New Projects)

For new projects, create workflow that coordinates agents:

```markdown
# Workflow: New Feature

## Trigger
When user asks to build a new feature

## Flow

### Step 1: Requirements (PM)
Activate product-manager agent:
"Define requirements for: {feature}"

Wait for user approval of requirements.

### Step 2: Design (Architect)
Activate architect agent:
"Design implementation for: {feature}"

Wait for user approval of design.

### Step 3: Implementation (Developer)
Continue as developer, implementing the design:
- Follow the approved architecture
- Write tests alongside code
- Update documentation

### Step 4: Quality Check (QA)
Activate qa-engineer agent:
"Test the implementation of: {feature}"

### Step 5: Complete
Report status and any remaining issues.
```

---

## 9. Command Templates

### 9.1 Essential Commands (Always Created)

#### pre-commit.md

```markdown
Run pre-commit checks on staged files or specified path.

## What This Does
1. Run TypeScript type check
2. Run ESLint
3. Run Prettier (check mode)
4. Run tests for changed files

## Process

```bash
# Type check
{PM} tsc --noEmit

# Lint
{PM} lint

# Format check
{PM} prettier --check .

# Run related tests
{PM} test --changed
```

## Output

✅ All checks passed - safe to commit

OR

❌ Issues found:
- {List of issues with file:line}
- Run `{PM} lint --fix` to auto-fix some issues
```

#### security-scan.md

```markdown
Quick security vulnerability scan.

## What This Does
1. Check for known vulnerabilities in dependencies
2. Search for hardcoded secrets
3. Verify environment variables aren't exposed
4. Check for common security anti-patterns

## Process

```bash
# Dependency audit
{PM} audit

# Secret detection (using git-secrets or truffleHog if available)
# Otherwise, search for patterns manually
```

## Manual Checks
- API keys in code
- Passwords in config files
- Private keys committed
- Debug flags in production code

## Output Format

## Security Scan Results

### Dependency Vulnerabilities
{From npm audit}

### Hardcoded Secrets
{Any found}

### Configuration Issues
{Any found}

### Summary
{Overall status}
```

### 9.2 Project-Specific Commands

#### fix-build.md (if build failing)

```markdown
Diagnose and fix build failures.

## Known Issues
{Pre-populated with detected build errors}

## Process

1. Run build and capture errors:
   ```bash
   {PM} build 2>&1
   ```

2. For each error:
   - Identify root cause
   - Check if related to recent changes
   - Propose fix

3. Apply fixes one at a time
4. Re-run build after each fix
5. Report final status

## Output Format

## Build Fix Report

### Errors Found
| Error | File | Cause | Fix |
|-------|------|-------|-----|

### Applied Fixes
{List fixes applied}

### Build Status
{Final status}
```

#### tenant-check.md (if multi-tenant)

```markdown
Verify tenant isolation in database queries.

## Tenant Field: {DETECTED_FIELD}

## Process

1. Find all files with database queries
2. For each query:
   - Check if it accesses tenant data
   - Verify {DETECTED_FIELD} filter present
   - Check filter source (must be from session)

## Known Locations
{Pre-populated with detected query locations}

## Output Format

## Tenant Isolation Check

### Queries Missing Tenant Filter
| File | Line | Query | Risk |
|------|------|-------|------|

### Properly Isolated Queries
{Count and summary}

### Recommendations
{How to fix issues}
```

---

## 10. MCP Configuration

### 10.1 MCP Recommendation Logic

```typescript
function recommendMCPs(project: DetectedProject): MCPConfig[] {
  const mcps: MCPConfig[] = [];
  
  // GitHub MCP
  if (project.cicd?.includes('github') || hasGitHubRemote(project)) {
    mcps.push({
      name: 'github',
      package: '@modelcontextprotocol/server-github',
      reason: 'GitHub integration detected',
    });
  }
  
  // Supabase MCP
  if (project.database?.provider === 'supabase') {
    mcps.push({
      name: 'supabase',
      package: 'mcp-server-supabase',
      reason: 'Supabase database detected',
    });
  }
  
  // PostgreSQL MCP (if complex queries needed)
  if (project.database?.type === 'postgresql' && 
      project.database?.provider !== 'supabase') {
    mcps.push({
      name: 'postgres',
      package: '@modelcontextprotocol/server-postgres',
      reason: 'PostgreSQL without Supabase',
    });
  }
  
  // Memory MCP (for large projects)
  if (project.fileCount > 100) {
    mcps.push({
      name: 'memory',
      package: '@modelcontextprotocol/server-memory',
      reason: 'Large project - memory helps track context',
    });
  }
  
  return mcps;
}
```

### 10.2 settings.json Template

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-supabase",
        "--supabase-url", "${SUPABASE_URL}",
        "--service-role-key", "${SUPABASE_SERVICE_ROLE_KEY}"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

---

## 11. Guardrails System

### 11.1 settings.local.json

```json
{
  "permissions": {
    "allow": [
      "read:**",
      "write:src/**",
      "write:tests/**",
      "write:docs/**",
      "write:.claude/**",
      "write:CLAUDE.md"
    ],
    "deny": [
      "write:.env*",
      "write:**/*.key",
      "write:**/*.pem",
      "write:secrets/**"
    ]
  },
  "commands": {
    "allow": [
      "{PM}:*",
      "git:status,diff,log,add,commit",
      "npx:*"
    ],
    "deny": [
      "rm:-rf",
      "sudo:*",
      "chmod:777"
    ],
    "requireConfirmation": [
      "git:push",
      "git:reset --hard",
      "{PM}:publish",
      "db:migrate"
    ]
  }
}
```

### 11.2 Guardrail Categories

| Category | Allow | Deny | Confirm |
|----------|-------|------|---------|
| File Write | src/**, tests/** | .env*, *.key | - |
| Git | status, diff, log | - | push, reset --hard |
| Package Manager | install, test, build | - | publish |
| Database | query, migrate:dev | - | migrate:prod |
| Destructive | - | rm -rf, sudo | reset, drop |

---

## 12. Technical Implementation

### 12.1 Tech Stack

```json
{
  "dependencies": {
    "chalk": "^5.3.0",         // Pretty console colors
    "commander": "^12.0.0",    // CLI framework
    "enquirer": "^2.4.1",      // Interactive prompts
    "execa": "^8.0.1",         // Command execution
    "fs-extra": "^11.2.0",     // File system helpers
    "globby": "^14.0.0",       // File matching
    "ora": "^8.0.1",           // Spinners
    "yaml": "^2.3.4",          // YAML parsing
    "zod": "^3.22.4"           // Validation
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^20.11.0",
    "tsup": "^8.0.1",          // Build tool
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"         // Testing
  }
}
```

### 12.2 Key TypeScript Interfaces

```typescript
// src/types/index.ts

export interface ProjectParams {
  projectName: string;
  projectDescription: string;
  projectState: 'new' | 'existing';
  projectType: ProjectType;
  frontendFramework: FrontendFramework;
  backendFramework: BackendFramework;
  database: DatabaseConfig | null;
  auth: AuthConfig | null;
  isMultiTenant: boolean;
  tenantField: string | null;
  externalApis: string[];
  testFramework: string | null;
  e2eFramework: string | null;
}

export interface DetectedProject extends ProjectParams {
  fileCount: number;
  hasTests: boolean;
  buildStatus: 'passing' | 'failing' | 'unknown';
  buildErrors: string[];
  packageManager: PackageManager;
  monorepo: boolean;
  cicd: string | null;
}

export interface SetupConfig {
  mode: 'light' | 'automatic' | 'custom';
  components: {
    agents: string[];
    commands: string[];
    mcps: MCPConfig[];
  };
  guardrails: GuardrailConfig;
}

export interface GenerationResult {
  files: GeneratedFile[];
  summary: string;
  warnings: string[];
  nextSteps: string[];
}
```

### 12.3 CLI Commands

```typescript
// src/cli.ts

import { Command } from 'commander';

const program = new Command();

program
  .name('claude-setup')
  .description('CLI tool to set up Claude Code environment')
  .version('1.0.0');

// Main init command
program
  .command('init')
  .description('Initialize Claude Code configuration')
  .option('-y, --yes', 'Skip prompts, use auto-detected values')
  .option('-m, --mode <mode>', 'Setup mode: light, automatic, custom')
  .option('--dry-run', 'Show what would be created')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

// Add components
program
  .command('add <type> [name]')
  .description('Add agent, command, or MCP')
  .option('-l, --list', 'List available options')
  .action(addCommand);

// Validate setup
program
  .command('doctor')
  .description('Validate Claude Code setup')
  .action(doctorCommand);

// Export config
program
  .command('export')
  .description('Export configuration')
  .option('-f, --format <format>', 'Output format: json, yaml')
  .option('-o, --output <file>', 'Output file')
  .action(exportCommand);

program.parse();
```

### 12.4 Init Command Flow

```typescript
// src/commands/init.ts

export async function initCommand(options: InitOptions): Promise<void> {
  const ui = new UIRenderer();
  
  // Step 1: Welcome
  ui.showWelcome();
  await ui.pressEnterToContinue();
  
  // Step 2: Detect
  ui.showProgress('Analyzing project...');
  const detected = await detectProject(process.cwd());
  ui.showDetectionSummary(detected);
  
  // Step 3: Mode selection (if not provided)
  const mode = options.mode || await ui.askMode(detected);
  
  // Step 4: Select components based on mode
  const config = await selectComponents(detected, mode, options);
  
  // Step 5: Show preview (if --dry-run)
  if (options.dryRun) {
    ui.showDryRunPreview(config);
    return;
  }
  
  // Step 6: Generate
  ui.showProgress('Generating configuration...');
  const result = await generateAll(detected, config);
  
  // Step 7: Write files
  await writeFiles(result.files, options.force);
  
  // Step 8: Show completion
  ui.showCompletion(result);
}
```

---

## 13. Publishing & Distribution

### 13.1 npm Publishing

```bash
# 1. Create npm account at npmjs.com

# 2. Login
npm login

# 3. Build
npm run build

# 4. Test locally
npm link
claude-setup --help

# 5. Publish
npm publish

# Users install:
npm install -g claude-setup-cli

# Or run directly:
npx claude-setup-cli init
```

### 13.2 package.json for Publishing

```json
{
  "name": "claude-setup-cli",
  "version": "1.0.0",
  "description": "CLI tool to set up Claude Code environment with best practices",
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/claude-setup-cli"
  },
  "keywords": [
    "claude",
    "claude-code",
    "ai",
    "cli",
    "developer-tools",
    "anthropic"
  ],
  "bin": {
    "claude-setup": "./bin/claude-setup.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "bin",
    "dist"
  ],
  "scripts": {
    "build": "tsup src/index.ts src/cli.ts --format cjs,esm --dts --clean",
    "dev": "tsup --watch",
    "test": "vitest",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 13.3 GitHub Actions for Auto-Publish

```yaml
# .github/workflows/publish.yml

name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 14. Success Criteria

### 14.1 Performance Goals

| Metric | Target |
|--------|--------|
| Full setup time | Under 3 minutes |
| Detection accuracy | 90%+ auto-detection |
| User questions | Maximum 1 question (mode) |
| Generated quality | Deep project understanding |

### 14.2 Quality Goals

- Generated content is specific to THIS project (no generic placeholders)
- Agents understand actual project structure
- Commands reference real file paths
- Multi-tenant rules use actual tenant field
- Build errors are documented if present

### 14.3 User Experience Goals

- Clear explanation at start
- Visual progress indicators
- Helpful completion summary
- Clear verification steps
- Easy iteration path ("not quite right? here's how to fix")

---

## Appendix A: Usage Examples

```bash
# Interactive initialization
claude-setup init

# Auto mode, no prompts
claude-setup init --yes --mode automatic

# Dry run to preview
claude-setup init --dry-run

# Add specific agent
claude-setup add agent security-reviewer

# List available agents
claude-setup add agent --list

# Add MCP
claude-setup add mcp github

# Validate setup
claude-setup doctor

# Export as YAML
claude-setup export --format yaml --output config.yml
```

---

## Appendix B: Migration from Manual Setup

If a project already has partial Claude Code setup:

```bash
# Check existing setup
claude-setup doctor

# Add missing components
claude-setup add agent security-reviewer
claude-setup add command pre-commit

# Regenerate CLAUDE.md (preserves existing content)
claude-setup init --update
```

---

## Next Steps for Development

1. **Start with core detection** - package.json, file structure
2. **Build basic init command** - Light mode first
3. **Add UI screens** - Welcome, detection summary
4. **Implement generation** - CLAUDE.md first
5. **Add automatic mode** - Agent/command selection
6. **Add custom mode** - Interactive component selection
7. **Build agents** - Start with security-reviewer
8. **Add MCPs** - GitHub, Supabase
9. **Testing** - Unit tests, integration tests
10. **Documentation** - README, examples
11. **Publish** - npm, GitHub

---

**End of Handoff Document**
