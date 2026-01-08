# Quality Assessment Framework

> This document defines how to measure ACTUAL quality of generated agents, commands, and skills.
> Not just "does it exist" but "is it professional-grade".

---

## Table of Contents

1. [Quality Scoring System](#1-quality-scoring-system)
2. [Agent Quality Rubric](#2-agent-quality-rubric)
3. [Command Quality Rubric](#3-command-quality-rubric)
4. [Gold Standard Examples](#4-gold-standard-examples)
5. [LLM-as-Judge Implementation](#5-llm-as-judge-implementation)
6. [Automated Quality Checks](#6-automated-quality-checks)

---

## 1. Quality Scoring System

### Score Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 90-100 | **Excellent** | Production-ready, deeply project-specific |
| 75-89 | **Good** | Usable, mostly specific, minor improvements needed |
| 60-74 | **Acceptable** | Works but generic, needs customization |
| 40-59 | **Poor** | Mostly generic, significant issues |
| 0-39 | **Failing** | Unusable, placeholders, wrong structure |

### Minimum Thresholds

| Component | Minimum Score | Target Score |
|-----------|---------------|--------------|
| CLAUDE.md | 75 | 85 |
| Agents | 80 | 90 |
| Commands | 75 | 85 |
| Settings | 70 | 80 |

---

## 2. Agent Quality Rubric

### Structure (25 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| Valid frontmatter (name, description, model) | 5 | Regex parse |
| Clear role definition | 5 | Has "# Role" or "# Agent Role" section |
| When to activate section | 5 | Has trigger conditions |
| Process/steps section | 5 | Has numbered or bulleted process |
| Output format defined | 5 | Has example output structure |

### Specificity (35 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| References actual project name | 5 | Contains project name from package.json |
| References actual tech stack | 10 | Mentions detected frameworks/libraries |
| References actual file paths | 10 | Contains paths that exist in project |
| References actual patterns found | 10 | Mentions tenant field, API names, etc. |

### Actionability (25 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| Instructions are specific, not vague | 10 | LLM-as-Judge |
| Includes concrete examples | 5 | Has code blocks with examples |
| Defines what "done" looks like | 5 | Has success criteria or checklist |
| Handles edge cases | 5 | Mentions error scenarios |

### Professional Quality (15 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| No placeholders or TODOs | 5 | Regex check |
| Proper markdown formatting | 3 | Valid markdown parse |
| Appropriate length (500-3000 chars) | 3 | Length check |
| No contradictions | 4 | LLM-as-Judge |

---

### Agent Quality Check Implementation

```typescript
// tests/utils/agent-quality.ts

interface AgentQualityResult {
  score: number;
  breakdown: {
    structure: number;
    specificity: number;
    actionability: number;
    professional: number;
  };
  issues: QualityIssue[];
  suggestions: string[];
}

interface QualityIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  message: string;
  line?: number;
}

export async function assessAgentQuality(
  agentContent: string,
  projectContext: ProjectContext
): Promise<AgentQualityResult> {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  
  // === STRUCTURE (25 points) ===
  let structureScore = 0;
  
  // Frontmatter check
  const frontmatterMatch = agentContent.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    if (frontmatter.includes('name:')) structureScore += 2;
    else issues.push({ severity: 'critical', category: 'structure', message: 'Missing name in frontmatter' });
    
    if (frontmatter.includes('description:')) structureScore += 2;
    else issues.push({ severity: 'major', category: 'structure', message: 'Missing description in frontmatter' });
    
    if (frontmatter.includes('model:')) structureScore += 1;
  } else {
    issues.push({ severity: 'critical', category: 'structure', message: 'Missing frontmatter block' });
  }
  
  // Role definition
  if (/^#+ .*(role|agent|purpose)/im.test(agentContent)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'major', category: 'structure', message: 'No clear role definition section' });
  }
  
  // When to activate
  if (/^#+ .*(when|trigger|activate|use this)/im.test(agentContent)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'structure', message: 'No "when to use" section' });
    suggestions.push('Add a section explaining when this agent should be activated');
  }
  
  // Process section
  if (/^#+ .*(process|steps|workflow|procedure)/im.test(agentContent) ||
      /^\d+\.\s+/m.test(agentContent)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'major', category: 'structure', message: 'No clear process/steps section' });
  }
  
  // Output format
  if (/^#+ .*(output|format|result)/im.test(agentContent) ||
      agentContent.includes('```')) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'structure', message: 'No output format defined' });
  }
  
  // === SPECIFICITY (35 points) ===
  let specificityScore = 0;
  
  // Project name
  if (agentContent.toLowerCase().includes(projectContext.name.toLowerCase())) {
    specificityScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'specificity', message: 'Does not mention project name' });
  }
  
  // Tech stack references
  const techMentions = projectContext.techStack.filter(tech => 
    agentContent.toLowerCase().includes(tech.toLowerCase())
  );
  specificityScore += Math.min(10, techMentions.length * 3);
  if (techMentions.length < 2) {
    issues.push({ severity: 'major', category: 'specificity', message: `Only mentions ${techMentions.length} tech stack items` });
    suggestions.push(`Reference more of the detected stack: ${projectContext.techStack.join(', ')}`);
  }
  
  // File path references
  const pathPattern = /(?:\/[\w-]+)+\.\w+|['"`](?:src|app|lib|components)\/[\w\/.-]+['"`]/g;
  const pathMatches = agentContent.match(pathPattern) || [];
  const validPaths = pathMatches.filter(p => projectContext.existingPaths.some(ep => p.includes(ep)));
  specificityScore += Math.min(10, validPaths.length * 2);
  if (validPaths.length === 0) {
    issues.push({ severity: 'major', category: 'specificity', message: 'No references to actual project paths' });
  }
  
  // Pattern references (tenant field, APIs, etc.)
  if (projectContext.tenantField && agentContent.includes(projectContext.tenantField)) {
    specificityScore += 5;
  }
  const apiMentions = projectContext.externalApis.filter(api => 
    agentContent.toLowerCase().includes(api.toLowerCase())
  );
  specificityScore += Math.min(5, apiMentions.length * 2);
  
  // === ACTIONABILITY (25 points) ===
  let actionabilityScore = 0;
  
  // Code examples
  const codeBlocks = (agentContent.match(/```[\s\S]*?```/g) || []).length;
  actionabilityScore += Math.min(5, codeBlocks * 2);
  if (codeBlocks === 0) {
    suggestions.push('Add code examples showing good vs bad patterns');
  }
  
  // Success criteria / checklist
  if (/\[[ x]\]/i.test(agentContent) || /^#+ .*(criteria|checklist|done|complete)/im.test(agentContent)) {
    actionabilityScore += 5;
  } else {
    suggestions.push('Add a checklist or success criteria section');
  }
  
  // Edge cases
  if (/error|edge case|exception|fail|invalid/i.test(agentContent)) {
    actionabilityScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'actionability', message: 'Does not mention error handling or edge cases' });
  }
  
  // Specific instructions (assessed via LLM - placeholder for now)
  // This will be filled by LLM-as-Judge
  actionabilityScore += 10; // Placeholder - adjusted by LLM
  
  // === PROFESSIONAL QUALITY (15 points) ===
  let professionalScore = 0;
  
  // No placeholders
  const placeholders = [
    /\{[A-Z_]+\}/g,
    /\[FILL.*?\]/gi,
    /\[TODO.*?\]/gi,
    /YOUR_.*?_HERE/gi,
    /REPLACE_.*?/gi,
  ];
  const hasPlaceholders = placeholders.some(p => p.test(agentContent));
  if (!hasPlaceholders) {
    professionalScore += 5;
  } else {
    issues.push({ severity: 'critical', category: 'professional', message: 'Contains placeholder text' });
  }
  
  // Valid markdown
  try {
    // Basic markdown validation
    professionalScore += 3;
  } catch {
    issues.push({ severity: 'minor', category: 'professional', message: 'Markdown formatting issues' });
  }
  
  // Length check
  if (agentContent.length >= 500 && agentContent.length <= 5000) {
    professionalScore += 3;
  } else if (agentContent.length < 500) {
    issues.push({ severity: 'major', category: 'professional', message: 'Agent too short - likely missing important details' });
  } else {
    issues.push({ severity: 'minor', category: 'professional', message: 'Agent very long - may need trimming' });
  }
  
  // Consistency (placeholder for LLM check)
  professionalScore += 4;
  
  return {
    score: structureScore + specificityScore + actionabilityScore + professionalScore,
    breakdown: {
      structure: structureScore,
      specificity: specificityScore,
      actionability: actionabilityScore,
      professional: professionalScore,
    },
    issues,
    suggestions,
  };
}
```

---

## 3. Command Quality Rubric

### Structure (20 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| Clear description of what it does | 5 | First paragraph explains purpose |
| Step-by-step process | 5 | Numbered steps or clear sections |
| Actual commands to run | 5 | Has shell/code blocks |
| Output format defined | 5 | Shows expected output |

### Specificity (35 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| Uses correct package manager | 10 | pnpm/npm/yarn matches project |
| References actual scripts from package.json | 10 | Scripts exist |
| References actual file paths | 10 | Paths exist in project |
| Handles project-specific config | 5 | Mentions actual config files |

### Usefulness (30 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| Solves a real problem | 10 | LLM-as-Judge |
| Commands are correct and runnable | 10 | Syntax validation |
| Error handling included | 5 | Mentions what to do if fails |
| Clear success criteria | 5 | Defines "done" |

### Professional Quality (15 points)

| Criterion | Points | Check |
|-----------|--------|-------|
| No placeholders | 5 | Regex check |
| Commands are safe (no destructive ops without warning) | 5 | Safety check |
| Appropriate length | 5 | 200-2000 chars |

---

### Command Quality Check Implementation

```typescript
// tests/utils/command-quality.ts

interface CommandQualityResult {
  score: number;
  breakdown: {
    structure: number;
    specificity: number;
    usefulness: number;
    professional: number;
  };
  issues: QualityIssue[];
  suggestions: string[];
  runnableCommands: CommandValidation[];
}

interface CommandValidation {
  command: string;
  isValid: boolean;
  error?: string;
}

export async function assessCommandQuality(
  commandContent: string,
  projectContext: ProjectContext
): Promise<CommandQualityResult> {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];
  
  // === STRUCTURE (20 points) ===
  let structureScore = 0;
  
  // First paragraph describes purpose
  const firstParagraph = commandContent.split('\n\n')[0];
  if (firstParagraph.length > 50 && !firstParagraph.startsWith('#')) {
    structureScore += 5;
  } else if (commandContent.match(/^#[^#].*\n\n.{50,}/)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'structure', message: 'Missing clear description' });
  }
  
  // Has steps
  if (/^\d+\./m.test(commandContent) || /^#+\s*(step|phase)/im.test(commandContent)) {
    structureScore += 5;
  }
  
  // Has command blocks
  const shellBlocks = commandContent.match(/```(?:bash|sh|shell)?\n[\s\S]*?```/g) || [];
  if (shellBlocks.length > 0) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'major', category: 'structure', message: 'No shell command blocks' });
  }
  
  // Output format
  if (/^#+\s*(output|result|expect)/im.test(commandContent)) {
    structureScore += 5;
  }
  
  // === SPECIFICITY (35 points) ===
  let specificityScore = 0;
  
  // Package manager
  const pm = projectContext.packageManager;
  const pmPattern = new RegExp(`\\b${pm}\\b`, 'g');
  const pmMatches = commandContent.match(pmPattern) || [];
  if (pmMatches.length > 0) {
    specificityScore += 10;
  } else {
    // Check if using wrong package manager
    const wrongPm = ['npm', 'yarn', 'pnpm', 'bun'].filter(p => p !== pm);
    const usesWrongPm = wrongPm.some(p => new RegExp(`\\b${p}\\s+(run|install|add)`, 'g').test(commandContent));
    if (usesWrongPm) {
      issues.push({ severity: 'critical', category: 'specificity', message: `Uses wrong package manager (should be ${pm})` });
    }
  }
  
  // References actual scripts
  const scripts = Object.keys(projectContext.packageJsonScripts || {});
  const scriptMentions = scripts.filter(s => commandContent.includes(s));
  specificityScore += Math.min(10, scriptMentions.length * 3);
  
  // References actual paths
  const pathPattern = /(?:\.\/)?(?:src|app|lib|tests?)\/[\w\/-]+/g;
  const pathMatches = commandContent.match(pathPattern) || [];
  const validPaths = pathMatches.filter(p => 
    projectContext.existingPaths.some(ep => ep.includes(p.replace('./', '')))
  );
  specificityScore += Math.min(10, validPaths.length * 2);
  
  // Config files
  const configFiles = ['tsconfig', 'eslint', 'prettier', 'vitest', 'jest', 'playwright'];
  const configMentions = configFiles.filter(c => commandContent.toLowerCase().includes(c));
  specificityScore += Math.min(5, configMentions.length * 2);
  
  // === USEFULNESS (30 points) ===
  let usefulnessScore = 0;
  
  // Commands are syntactically valid
  const commands = extractCommands(commandContent);
  const validCommands = commands.filter(cmd => isValidCommand(cmd));
  usefulnessScore += Math.min(10, (validCommands.length / Math.max(1, commands.length)) * 10);
  
  // Error handling
  if (/error|fail|if.*exit|catch|\|\||&&/i.test(commandContent)) {
    usefulnessScore += 5;
  } else {
    suggestions.push('Add error handling guidance (what to do if commands fail)');
  }
  
  // Success criteria
  if (/success|complete|done|✓|pass/i.test(commandContent)) {
    usefulnessScore += 5;
  }
  
  // Solves real problem (LLM placeholder)
  usefulnessScore += 10;
  
  // === PROFESSIONAL (15 points) ===
  let professionalScore = 0;
  
  // No placeholders
  const hasPlaceholders = /\{[A-Z_]+\}|\[FILL|\[TODO|YOUR_.*_HERE/.test(commandContent);
  if (!hasPlaceholders) {
    professionalScore += 5;
  } else {
    issues.push({ severity: 'critical', category: 'professional', message: 'Contains placeholders' });
  }
  
  // Safety check
  const dangerousPatterns = [
    /rm\s+-rf\s+[\/~]/,
    /sudo\s+rm/,
    /DROP\s+DATABASE/i,
    /DELETE\s+FROM\s+\w+\s*;?\s*$/i,  // DELETE without WHERE
  ];
  const hasDangerous = dangerousPatterns.some(p => p.test(commandContent));
  if (!hasDangerous) {
    professionalScore += 5;
  } else {
    issues.push({ severity: 'critical', category: 'professional', message: 'Contains potentially dangerous commands without safeguards' });
  }
  
  // Length
  if (commandContent.length >= 200 && commandContent.length <= 3000) {
    professionalScore += 5;
  }
  
  return {
    score: structureScore + specificityScore + usefulnessScore + professionalScore,
    breakdown: {
      structure: structureScore,
      specificity: specificityScore,
      usefulness: usefulnessScore,
      professional: professionalScore,
    },
    issues,
    suggestions,
    runnableCommands: commands.map(cmd => ({
      command: cmd,
      isValid: isValidCommand(cmd),
    })),
  };
}

function extractCommands(content: string): string[] {
  const blocks = content.match(/```(?:bash|sh|shell)?\n([\s\S]*?)```/g) || [];
  return blocks.flatMap(block => {
    const code = block.replace(/```(?:bash|sh|shell)?\n?/g, '').replace(/```/g, '');
    return code.split('\n').filter(line => 
      line.trim() && 
      !line.trim().startsWith('#') &&
      !line.trim().startsWith('//')
    );
  });
}

function isValidCommand(cmd: string): boolean {
  // Basic syntax validation
  const validStarters = [
    'npm', 'pnpm', 'yarn', 'bun', 'npx',
    'node', 'tsx', 'ts-node',
    'git', 'gh',
    'cd', 'mkdir', 'cp', 'mv', 'cat', 'echo', 'ls',
    'curl', 'wget',
    'docker', 'docker-compose',
    'prisma', 'drizzle-kit',
  ];
  
  const firstWord = cmd.trim().split(/\s+/)[0];
  return validStarters.includes(firstWord) || cmd.includes('|') || cmd.startsWith('./');
}
```

---

## 4. Gold Standard Examples

### What a PERFECT Security Reviewer Agent Looks Like

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities with focus on OWASP Top 10 and project-specific risks
model: claude-sonnet-4-20250514
---

# Security Reviewer Agent

You are a security expert reviewing the **Mailflow** application - a multi-tenant email marketing SaaS that handles sensitive user data and integrates with Gmail API.

## Critical Context

This application has HIGH security requirements because:
- Handles PII (email addresses, names) from contact lists
- Sends emails on behalf of users (Gmail API access)
- Multi-tenant: users must NEVER see other users' data
- Stores OAuth tokens for Gmail access

## When to Activate

Use this agent when:
- Reviewing any new code before merge
- After implementing authentication/authorization changes
- When adding new API endpoints
- When modifying database queries
- Periodically for full codebase audit

## Security Review Process

### 1. OWASP Top 10 Check

For each file or change, check:

#### A. Injection (SQL, NoSQL, Command)
```typescript
// ❌ VULNERABLE - String concatenation
const query = `SELECT * FROM contacts WHERE email = '${email}'`;

// ✅ SAFE - Parameterized query
const contacts = await db.contacts.findMany({
  where: { email: email }
});
```

#### B. Broken Authentication
- Check: Are all API routes protected?
- Check: Token expiration implemented?
- Check: Password requirements enforced?

Location to check: `src/app/api/**/route.ts`

#### C. Sensitive Data Exposure
- Check: PII not logged
- Check: Tokens not in URLs
- Check: HTTPS enforced

### 2. Multi-Tenant Isolation (CRITICAL)

**Every database query accessing user data MUST include `user_id` filter.**

```typescript
// ❌ CRITICAL VULNERABILITY - No tenant filter
const contacts = await db.contacts.findMany();

// ❌ STILL VULNERABLE - user_id from request body
const { user_id } = req.body;
const contacts = await db.contacts.findMany({
  where: { user_id }
});

// ✅ SAFE - user_id from authenticated session
const user_id = session.user.id;
const contacts = await db.contacts.findMany({
  where: { user_id }
});
```

Files to check:
- `src/lib/contacts.ts`
- `src/lib/campaigns.ts`
- `src/lib/templates.ts`
- `src/app/api/**/route.ts`

### 3. Gmail API Security

- Check: Tokens stored encrypted
- Check: Refresh token rotation implemented
- Check: Scope creep (only request needed scopes)
- Check: Rate limiting before Gmail calls

Location: `src/lib/gmail/`

### 4. XSS Prevention

Email templates can contain HTML - must be sanitized:

```typescript
// ❌ VULNERABLE - Raw HTML insertion
const html = `<div>${userContent}</div>`;

// ✅ SAFE - Sanitized
import DOMPurify from 'dompurify';
const html = `<div>${DOMPurify.sanitize(userContent)}</div>`;
```

Location: `src/components/email-editor/`

## Output Format

## Security Review: [Scope]

### 🚨 CRITICAL Issues (Block deployment)
| File | Line | Issue | Fix |
|------|------|-------|-----|
| src/lib/contacts.ts | 45 | Missing user_id filter | Add session.user.id to query |

### ⚠️ HIGH Issues (Fix within 24h)
| File | Line | Issue | Fix |
|------|------|-------|-----|

### 📝 MEDIUM Issues (Fix within sprint)
| File | Line | Issue | Fix |
|------|------|-------|-----|

### 💡 LOW Issues (Improvements)
| File | Line | Issue | Fix |
|------|------|-------|-----|

### ✅ Verified Secure
- [x] Authentication on all API routes
- [x] Tenant isolation in contacts queries
- [ ] XSS sanitization in email editor

### Summary
- CRITICAL: X | HIGH: X | MEDIUM: X | LOW: X
- **Deployment:** BLOCKED / APPROVED WITH FIXES / APPROVED

## Success Criteria

Security review is complete when:
- [ ] All CRITICAL issues resolved
- [ ] All HIGH issues have tickets created
- [ ] No new vulnerabilities introduced
- [ ] Tenant isolation verified in ALL queries
```

---

## 5. LLM-as-Judge Implementation

Use Claude to evaluate the quality of generated content:

### tests/utils/llm-judge.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface LLMJudgement {
  overallScore: number;
  categoryScores: {
    clarity: number;
    specificity: number;
    actionability: number;
    completeness: number;
  };
  strengths: string[];
  weaknesses: string[];
  isProductionReady: boolean;
  improvementSuggestions: string[];
}

export async function judgeAgentQuality(
  agentContent: string,
  projectContext: ProjectContext,
  goldStandard: string
): Promise<LLMJudgement> {
  
  const prompt = `You are evaluating the quality of a Claude Code agent file.

## Project Context
- Name: ${projectContext.name}
- Framework: ${projectContext.framework}
- Database: ${projectContext.database}
- Multi-tenant: ${projectContext.isMultiTenant} (field: ${projectContext.tenantField})
- External APIs: ${projectContext.externalApis.join(', ')}

## Gold Standard Example
This is what an excellent agent looks like:

\`\`\`markdown
${goldStandard}
\`\`\`

## Agent to Evaluate

\`\`\`markdown
${agentContent}
\`\`\`

## Evaluation Criteria

Rate each category from 0-100:

1. **Clarity** (0-100): Are the instructions clear and unambiguous?
2. **Specificity** (0-100): Does it reference THIS project's actual tech stack, files, and patterns?
3. **Actionability** (0-100): Can someone follow these instructions and produce consistent results?
4. **Completeness** (0-100): Does it cover all necessary aspects without obvious gaps?

## Response Format

Respond with JSON only:
{
  "overallScore": <0-100>,
  "categoryScores": {
    "clarity": <0-100>,
    "specificity": <0-100>,
    "actionability": <0-100>,
    "completeness": <0-100>
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "isProductionReady": <true/false>,
  "improvementSuggestions": ["suggestion1", "suggestion2"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  try {
    return JSON.parse(text);
  } catch {
    // Extract JSON from response if wrapped in other text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse LLM judgement');
  }
}

export async function judgeCommandQuality(
  commandContent: string,
  projectContext: ProjectContext
): Promise<LLMJudgement> {
  
  const prompt = `You are evaluating the quality of a Claude Code command file.

## Project Context
- Name: ${projectContext.name}
- Package Manager: ${projectContext.packageManager}
- Available Scripts: ${Object.keys(projectContext.packageJsonScripts || {}).join(', ')}
- Framework: ${projectContext.framework}

## Command to Evaluate

\`\`\`markdown
${commandContent}
\`\`\`

## Evaluation Questions

1. **Does it use the correct package manager?** (${projectContext.packageManager})
2. **Are the commands actually runnable?** (valid syntax, available tools)
3. **Is it specific to this project?** (references actual files/scripts)
4. **Would a developer find this useful?** (solves real problem)
5. **Is it safe?** (no destructive commands without warning)

## Response Format

Respond with JSON only:
{
  "overallScore": <0-100>,
  "categoryScores": {
    "clarity": <0-100>,
    "specificity": <0-100>,
    "actionability": <0-100>,
    "completeness": <0-100>
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "isProductionReady": <true/false>,
  "improvementSuggestions": ["suggestion1", "suggestion2"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
}
```

---

## 6. Automated Quality Checks

### Integration with Test Runner

```typescript
// tests/e2e/runner.ts - Updated quality assessment

import { assessAgentQuality } from '../utils/agent-quality';
import { assessCommandQuality } from '../utils/command-quality';
import { judgeAgentQuality, judgeCommandQuality } from '../utils/llm-judge';
import { GOLD_STANDARD_AGENTS } from '../fixtures/gold-standards';

async function runQualityAssessment(
  testDir: string,
  files: Record<string, string>,
  projectContext: ProjectContext
): Promise<QualityAssessment> {
  
  const results: QualityAssessment = {
    agents: [],
    commands: [],
    overall: {
      score: 0,
      passed: false,
      issues: [],
    },
  };
  
  // Assess each agent
  for (const [path, content] of Object.entries(files)) {
    if (path.includes('agents/')) {
      const agentName = path.split('/').pop()?.replace('.md', '') || '';
      
      // Automated checks
      const autoResult = await assessAgentQuality(content, projectContext);
      
      // LLM judgement (if automated score is borderline or for sampling)
      let llmResult: LLMJudgement | null = null;
      if (autoResult.score >= 60 && autoResult.score <= 85) {
        const goldStandard = GOLD_STANDARD_AGENTS[agentName] || GOLD_STANDARD_AGENTS['default'];
        llmResult = await judgeAgentQuality(content, projectContext, goldStandard);
      }
      
      const finalScore = llmResult 
        ? (autoResult.score * 0.4 + llmResult.overallScore * 0.6)
        : autoResult.score;
      
      results.agents.push({
        name: agentName,
        path,
        autoScore: autoResult.score,
        llmScore: llmResult?.overallScore,
        finalScore,
        breakdown: autoResult.breakdown,
        issues: autoResult.issues,
        suggestions: [...autoResult.suggestions, ...(llmResult?.improvementSuggestions || [])],
        isProductionReady: finalScore >= 80 && !autoResult.issues.some(i => i.severity === 'critical'),
      });
    }
  }
  
  // Assess each command
  for (const [path, content] of Object.entries(files)) {
    if (path.includes('commands/')) {
      const commandName = path.split('/').pop()?.replace('.md', '') || '';
      
      const autoResult = await assessCommandQuality(content, projectContext);
      
      let llmResult: LLMJudgement | null = null;
      if (autoResult.score >= 60 && autoResult.score <= 85) {
        llmResult = await judgeCommandQuality(content, projectContext);
      }
      
      const finalScore = llmResult
        ? (autoResult.score * 0.4 + llmResult.overallScore * 0.6)
        : autoResult.score;
      
      results.commands.push({
        name: commandName,
        path,
        autoScore: autoResult.score,
        llmScore: llmResult?.overallScore,
        finalScore,
        breakdown: autoResult.breakdown,
        issues: autoResult.issues,
        suggestions: autoResult.suggestions,
        runnableCommands: autoResult.runnableCommands,
        isProductionReady: finalScore >= 75,
      });
    }
  }
  
  // Calculate overall
  const allScores = [
    ...results.agents.map(a => a.finalScore),
    ...results.commands.map(c => c.finalScore),
  ];
  
  results.overall.score = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0;
  
  results.overall.passed = 
    results.agents.every(a => a.isProductionReady) &&
    results.commands.every(c => c.isProductionReady) &&
    results.overall.score >= 80;
  
  return results;
}
```

---

## Summary: Quality Check Layers

| Layer | What it Checks | When |
|-------|---------------|------|
| **Automated Structural** | Frontmatter, sections, length | Always |
| **Automated Specificity** | Project references, tech stack mentions | Always |
| **Automated Safety** | Placeholders, dangerous commands | Always |
| **LLM-as-Judge** | Clarity, actionability, completeness | Borderline scores (60-85) |
| **Gold Standard Comparison** | How close to ideal example | For critical agents |

---

## Instructions for Claude Code

Add this to the test prompt:

```
After implementing basic tests, add quality assessment:

1. Implement the quality rubrics from QUALITY_ASSESSMENT.md
2. Add gold standard examples for each agent type
3. Integrate LLM-as-Judge for borderline cases (optional - requires API key)
4. Quality thresholds:
   - Agents: minimum 80, target 90
   - Commands: minimum 75, target 85
   - No CRITICAL issues allowed
   - No placeholders allowed

Run: pnpm test:e2e --with-quality

The test should FAIL if quality scores are below thresholds.
```
