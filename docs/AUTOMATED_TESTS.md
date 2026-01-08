# Automated Test Suite for Claude Setup CLI

> This document defines automated tests with expected outcomes.
> The test runner should NOT read expected results until AFTER running the CLI.

---

## Test Architecture

```
tests/
├── e2e/
│   ├── runner.ts                 # Test runner
│   ├── scenarios/
│   │   ├── new-project.test.ts
│   │   ├── nextjs-supabase.test.ts
│   │   ├── express-api.test.ts
│   │   └── monorepo.test.ts
│   └── fixtures/
│       ├── expected/             # Expected outputs (read AFTER test)
│       │   ├── new-project/
│       │   ├── nextjs-supabase/
│       │   ├── express-api/
│       │   └── monorepo/
│       └── repos.json            # GitHub repos to test against
├── utils/
│   ├── project-generator.ts      # Creates test projects
│   ├── comparator.ts             # Compares actual vs expected
│   └── reporter.ts               # Test report generator
```

---

## Test Runner Implementation

### tests/e2e/runner.ts

```typescript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { diff } from 'jest-diff';

interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<string>;  // Returns test directory path
  mode: 'light' | 'automatic' | 'custom';
  expectedDir: string;           // Path to expected outputs (read AFTER test)
}

interface TestResult {
  scenario: string;
  passed: boolean;
  duration: number;
  detectionAccuracy: number;
  filesGenerated: string[];
  filesExpected: string[];
  missingFiles: string[];
  extraFiles: string[];
  contentDiffs: ContentDiff[];
  qualityScore: QualityScore;
}

interface ContentDiff {
  file: string;
  expected: string;
  actual: string;
  diff: string;
}

interface QualityScore {
  noPlaceholders: boolean;
  projectSpecific: boolean;
  validYaml: boolean;
  validMarkdown: boolean;
  agentQuality: number;  // 0-100
  commandQuality: number; // 0-100
}

export async function runAllTests(): Promise<TestResult[]> {
  const scenarios = await loadScenarios();
  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scenario.name}`);
    console.log(`${'='.repeat(60)}\n`);

    const result = await runScenario(scenario);
    results.push(result);

    // Print immediate result
    console.log(result.passed ? '✅ PASSED' : '❌ FAILED');
  }

  // Generate report
  await generateReport(results);
  
  return results;
}

async function runScenario(scenario: TestScenario): Promise<TestResult> {
  const startTime = Date.now();
  
  // Step 1: Setup test project
  const testDir = await scenario.setup();
  
  // Step 2: Run CLI (capture output but don't read expected yet)
  const cliOutput = await runCLI(testDir, scenario.mode);
  
  // Step 3: Collect actual results
  const actualFiles = await collectGeneratedFiles(testDir);
  
  // Step 4: NOW read expected results
  const expectedFiles = await collectExpectedFiles(scenario.expectedDir);
  
  // Step 5: Compare
  const comparison = compareResults(actualFiles, expectedFiles);
  
  // Step 6: Quality check
  const qualityScore = await assessQuality(testDir, actualFiles);
  
  return {
    scenario: scenario.name,
    passed: comparison.allMatch && qualityScore.noPlaceholders,
    duration: Date.now() - startTime,
    detectionAccuracy: comparison.detectionAccuracy,
    filesGenerated: Object.keys(actualFiles),
    filesExpected: Object.keys(expectedFiles),
    missingFiles: comparison.missingFiles,
    extraFiles: comparison.extraFiles,
    contentDiffs: comparison.contentDiffs,
    qualityScore,
  };
}

async function runCLI(testDir: string, mode: string): Promise<string> {
  try {
    const output = execSync(
      `claude-setup init --mode ${mode} --yes`,
      { 
        cwd: testDir, 
        encoding: 'utf-8',
        timeout: 180000  // 3 minutes max
      }
    );
    return output;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

async function collectGeneratedFiles(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  
  // CLAUDE.md
  const claudeMd = path.join(dir, 'CLAUDE.md');
  if (await fs.pathExists(claudeMd)) {
    files['CLAUDE.md'] = await fs.readFile(claudeMd, 'utf-8');
  }
  
  // .claude directory
  const claudeDir = path.join(dir, '.claude');
  if (await fs.pathExists(claudeDir)) {
    const walk = async (currentDir: string, prefix: string) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const relativePath = path.join(prefix, entry.name);
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath, relativePath);
        } else {
          files[relativePath] = await fs.readFile(fullPath, 'utf-8');
        }
      }
    };
    await walk(claudeDir, '.claude');
  }
  
  return files;
}

async function assessQuality(dir: string, files: Record<string, string>): Promise<QualityScore> {
  const claudeMd = files['CLAUDE.md'] || '';
  
  // Check for placeholders
  const placeholderPatterns = [
    /\{PROJECT_NAME\}/,
    /\{DESCRIPTION\}/,
    /\[FILL.*?\]/i,
    /\[TODO.*?\]/i,
    /\{.*?_FRAMEWORK\}/,
    /YOUR_.*_HERE/,
  ];
  const hasPlaceholders = placeholderPatterns.some(p => p.test(claudeMd));
  
  // Check if project-specific
  const packageJsonPath = path.join(dir, 'package.json');
  let isProjectSpecific = false;
  if (await fs.pathExists(packageJsonPath)) {
    const pkg = await fs.readJson(packageJsonPath);
    isProjectSpecific = claudeMd.includes(pkg.name) || 
                        Object.keys(pkg.dependencies || {}).some(dep => claudeMd.includes(dep));
  }
  
  // Validate YAML in settings files
  let validYaml = true;
  try {
    const settingsPath = path.join(dir, '.claude', 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
    }
  } catch {
    validYaml = false;
  }
  
  // Agent quality (check for specific instructions, not generic)
  const agentFiles = Object.entries(files).filter(([k]) => k.includes('agents/'));
  let agentQuality = 100;
  for (const [, content] of agentFiles) {
    if (content.length < 500) agentQuality -= 20;  // Too short
    if (!content.includes('# ')) agentQuality -= 10;  // No headers
    if (placeholderPatterns.some(p => p.test(content))) agentQuality -= 30;
  }
  
  // Command quality
  const commandFiles = Object.entries(files).filter(([k]) => k.includes('commands/'));
  let commandQuality = 100;
  for (const [, content] of commandFiles) {
    if (content.length < 200) commandQuality -= 20;
    if (!content.includes('```')) commandQuality -= 10;  // No code blocks
    if (placeholderPatterns.some(p => p.test(content))) commandQuality -= 30;
  }
  
  return {
    noPlaceholders: !hasPlaceholders,
    projectSpecific: isProjectSpecific,
    validYaml,
    validMarkdown: true,  // Basic check
    agentQuality: Math.max(0, agentQuality),
    commandQuality: Math.max(0, commandQuality),
  };
}
```

---

## Test Scenarios

### Scenario 1: New Empty Project

**Setup:**
```typescript
// tests/e2e/scenarios/new-project.test.ts

export const newProjectScenario: TestScenario = {
  name: 'new-empty-project',
  description: 'Empty directory, new project flow',
  mode: 'automatic',
  expectedDir: 'tests/e2e/fixtures/expected/new-project',
  
  setup: async () => {
    const testDir = path.join(os.tmpdir(), `claude-test-new-${Date.now()}`);
    await fs.ensureDir(testDir);
    // Empty directory - nothing to add
    return testDir;
  }
};
```

**Expected Output:** `tests/e2e/fixtures/expected/new-project/`

```
expected/new-project/
├── files.json              # List of expected files
├── CLAUDE.md.template      # Pattern to match (not exact)
└── detection.json          # Expected detection results
```

**files.json:**
```json
{
  "required": [
    "CLAUDE.md"
  ],
  "optional": [
    ".claude/settings.local.json"
  ],
  "forbidden": [
    ".claude/agents/",
    ".claude/commands/"
  ],
  "notes": "New empty project should only get basic CLAUDE.md in light mode"
}
```

**detection.json:**
```json
{
  "expectedDetection": {
    "type": "new",
    "framework": null,
    "language": null,
    "packageManager": null,
    "isMultiTenant": false,
    "externalApis": []
  }
}
```

---

### Scenario 2: Next.js + Supabase (GitHub Clone)

**Setup:**
```typescript
// tests/e2e/scenarios/nextjs-supabase.test.ts

export const nextjsSupabaseScenario: TestScenario = {
  name: 'nextjs-supabase-app',
  description: 'Full Next.js app with Supabase auth and database',
  mode: 'automatic',
  expectedDir: 'tests/e2e/fixtures/expected/nextjs-supabase',
  
  setup: async () => {
    const testDir = path.join(os.tmpdir(), `claude-test-nextjs-${Date.now()}`);
    
    // Clone a known public repo
    execSync(
      `git clone --depth 1 https://github.com/vercel/nextjs-subscription-payments.git ${testDir}`,
      { encoding: 'utf-8' }
    );
    
    // Remove .git to simulate fresh project
    await fs.remove(path.join(testDir, '.git'));
    
    return testDir;
  }
};
```

**Expected Output:** `tests/e2e/fixtures/expected/nextjs-supabase/`

**detection.json:**
```json
{
  "expectedDetection": {
    "type": "existing",
    "framework": "Next.js",
    "language": "typescript",
    "packageManager": "pnpm|npm|yarn",
    "database": {
      "type": "postgresql",
      "provider": "supabase"
    },
    "auth": {
      "provider": "supabase"
    },
    "isMultiTenant": true,
    "tenantField": "user_id|id",
    "externalApis": ["stripe"]
  },
  "tolerances": {
    "tenantField": ["user_id", "id", "customer_id"]
  }
}
```

**files.json:**
```json
{
  "required": [
    "CLAUDE.md",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".claude/agents/security-reviewer.md",
    ".claude/agents/tenant-security.md",
    ".claude/commands/pre-commit.md"
  ],
  "optional": [
    ".claude/agents/test-quality.md",
    ".claude/agents/api-compliance.md",
    ".claude/commands/security-scan.md"
  ]
}
```

**content-rules.json:**
```json
{
  "CLAUDE.md": {
    "mustContain": [
      "Next.js",
      "Supabase",
      "Stripe",
      "TypeScript",
      "user_id"
    ],
    "mustNotContain": [
      "{PROJECT_NAME}",
      "{FRAMEWORK}",
      "[TODO]",
      "[FILL IN]"
    ],
    "minLength": 2000,
    "maxLength": 15000
  },
  ".claude/agents/security-reviewer.md": {
    "mustContain": [
      "OWASP",
      "authentication",
      "Supabase"
    ],
    "minLength": 500
  },
  ".claude/agents/tenant-security.md": {
    "mustContain": [
      "user_id",
      "tenant",
      "isolation",
      "RLS"
    ],
    "minLength": 400
  }
}
```

---

### Scenario 3: Express API Only

**Setup:**
```typescript
// tests/e2e/scenarios/express-api.test.ts

export const expressApiScenario: TestScenario = {
  name: 'express-api',
  description: 'Backend-only Express API with PostgreSQL',
  mode: 'automatic',
  expectedDir: 'tests/e2e/fixtures/expected/express-api',
  
  setup: async () => {
    const testDir = path.join(os.tmpdir(), `claude-test-express-${Date.now()}`);
    await fs.ensureDir(testDir);
    
    // Create minimal Express project
    const packageJson = {
      name: 'test-express-api',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        test: 'vitest'
      },
      dependencies: {
        'express': '^4.18.2',
        'pg': '^8.11.3',
        'drizzle-orm': '^0.29.0',
        'zod': '^3.22.4'
      },
      devDependencies: {
        'typescript': '^5.3.3',
        'tsx': '^4.7.0',
        '@types/express': '^4.17.21',
        '@types/node': '^20.11.0',
        'vitest': '^1.2.0',
        'drizzle-kit': '^0.20.0'
      }
    };
    
    await fs.writeJson(path.join(testDir, 'package.json'), packageJson, { spaces: 2 });
    
    // Create src structure
    await fs.ensureDir(path.join(testDir, 'src'));
    await fs.ensureDir(path.join(testDir, 'src/routes'));
    await fs.ensureDir(path.join(testDir, 'src/db'));
    
    // Create basic files
    await fs.writeFile(path.join(testDir, 'src/index.ts'), `
import express from 'express';
import { userRoutes } from './routes/users';

const app = express();
app.use('/api/users', userRoutes);
app.listen(3000);
`);
    
    await fs.writeFile(path.join(testDir, 'src/routes/users.ts'), `
import { Router } from 'express';
import { db } from '../db';

export const userRoutes = Router();

userRoutes.get('/', async (req, res) => {
  const users = await db.query.users.findMany();
  res.json(users);
});
`);
    
    await fs.writeFile(path.join(testDir, 'src/db/index.ts'), `
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);
`);
    
    // Create lock file to indicate package manager
    await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), '');
    
    return testDir;
  }
};
```

**detection.json:**
```json
{
  "expectedDetection": {
    "type": "existing",
    "framework": "Express",
    "language": "typescript",
    "packageManager": "pnpm",
    "database": {
      "type": "postgresql",
      "orm": "drizzle"
    },
    "auth": null,
    "isMultiTenant": false,
    "externalApis": []
  }
}
```

---

### Scenario 4: Monorepo (Turborepo)

**Setup:**
```typescript
// tests/e2e/scenarios/monorepo.test.ts

export const monorepoScenario: TestScenario = {
  name: 'turborepo-monorepo',
  description: 'Turborepo with Next.js frontend and Express backend',
  mode: 'automatic',
  expectedDir: 'tests/e2e/fixtures/expected/monorepo',
  
  setup: async () => {
    const testDir = path.join(os.tmpdir(), `claude-test-monorepo-${Date.now()}`);
    
    // Clone Turborepo example
    execSync(
      `git clone --depth 1 https://github.com/vercel/turbo.git ${testDir}/temp`,
      { encoding: 'utf-8' }
    );
    
    // Copy just the basic example
    await fs.copy(
      path.join(testDir, 'temp/examples/basic'),
      testDir
    );
    await fs.remove(path.join(testDir, 'temp'));
    await fs.remove(path.join(testDir, '.git'));
    
    return testDir;
  }
};
```

---

## Test Comparator

### tests/utils/comparator.ts

```typescript
interface ComparisonResult {
  allMatch: boolean;
  detectionAccuracy: number;
  missingFiles: string[];
  extraFiles: string[];
  contentDiffs: ContentDiff[];
}

export async function compareResults(
  actual: Record<string, string>,
  expectedDir: string
): Promise<ComparisonResult> {
  
  // Load expected configuration
  const filesConfig = await fs.readJson(path.join(expectedDir, 'files.json'));
  const contentRules = await fs.readJson(path.join(expectedDir, 'content-rules.json')).catch(() => ({}));
  const detectionExpected = await fs.readJson(path.join(expectedDir, 'detection.json'));
  
  const result: ComparisonResult = {
    allMatch: true,
    detectionAccuracy: 100,
    missingFiles: [],
    extraFiles: [],
    contentDiffs: [],
  };
  
  // Check required files
  for (const file of filesConfig.required) {
    if (!actual[file]) {
      result.missingFiles.push(file);
      result.allMatch = false;
    }
  }
  
  // Check forbidden files
  for (const pattern of filesConfig.forbidden || []) {
    const matches = Object.keys(actual).filter(f => f.startsWith(pattern.replace('/', '')));
    if (matches.length > 0) {
      result.extraFiles.push(...matches);
      result.allMatch = false;
    }
  }
  
  // Check content rules
  for (const [file, rules] of Object.entries(contentRules)) {
    const content = actual[file];
    if (!content) continue;
    
    const r = rules as any;
    
    // Must contain
    for (const phrase of r.mustContain || []) {
      if (!content.includes(phrase)) {
        result.contentDiffs.push({
          file,
          expected: `Must contain: "${phrase}"`,
          actual: 'Not found',
          diff: `Missing required content: ${phrase}`,
        });
        result.allMatch = false;
      }
    }
    
    // Must not contain
    for (const phrase of r.mustNotContain || []) {
      if (content.includes(phrase)) {
        result.contentDiffs.push({
          file,
          expected: `Must NOT contain: "${phrase}"`,
          actual: 'Found',
          diff: `Found forbidden content: ${phrase}`,
        });
        result.allMatch = false;
      }
    }
    
    // Length checks
    if (r.minLength && content.length < r.minLength) {
      result.contentDiffs.push({
        file,
        expected: `Min length: ${r.minLength}`,
        actual: `Actual length: ${content.length}`,
        diff: `Content too short`,
      });
      result.allMatch = false;
    }
  }
  
  return result;
}
```

---

## Test Reporter

### tests/utils/reporter.ts

```typescript
export async function generateReport(results: TestResult[]): Promise<void> {
  const reportDir = 'test-reports';
  await fs.ensureDir(reportDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `test-report-${timestamp}.md`);
  
  let report = `# Claude Setup CLI - Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${results.length} |\n`;
  report += `| Passed | ${passed} ✅ |\n`;
  report += `| Failed | ${failed} ${failed > 0 ? '❌' : ''} |\n`;
  report += `| Pass Rate | ${((passed / results.length) * 100).toFixed(1)}% |\n\n`;
  
  // Quality Metrics
  const avgAgentQuality = results.reduce((sum, r) => sum + r.qualityScore.agentQuality, 0) / results.length;
  const avgCommandQuality = results.reduce((sum, r) => sum + r.qualityScore.commandQuality, 0) / results.length;
  
  report += `## Quality Metrics\n\n`;
  report += `| Metric | Score |\n`;
  report += `|--------|-------|\n`;
  report += `| Agent Quality | ${avgAgentQuality.toFixed(0)}/100 |\n`;
  report += `| Command Quality | ${avgCommandQuality.toFixed(0)}/100 |\n`;
  report += `| No Placeholders | ${results.filter(r => r.qualityScore.noPlaceholders).length}/${results.length} |\n`;
  report += `| Project Specific | ${results.filter(r => r.qualityScore.projectSpecific).length}/${results.length} |\n\n`;
  
  // Detailed Results
  report += `## Detailed Results\n\n`;
  
  for (const result of results) {
    report += `### ${result.scenario} ${result.passed ? '✅' : '❌'}\n\n`;
    report += `- Duration: ${(result.duration / 1000).toFixed(1)}s\n`;
    report += `- Files Generated: ${result.filesGenerated.length}\n`;
    report += `- Detection Accuracy: ${result.detectionAccuracy}%\n\n`;
    
    if (result.missingFiles.length > 0) {
      report += `**Missing Files:**\n`;
      result.missingFiles.forEach(f => report += `- ${f}\n`);
      report += `\n`;
    }
    
    if (result.contentDiffs.length > 0) {
      report += `**Content Issues:**\n`;
      result.contentDiffs.forEach(d => {
        report += `- ${d.file}: ${d.diff}\n`;
      });
      report += `\n`;
    }
    
    report += `**Quality Score:**\n`;
    report += `- No Placeholders: ${result.qualityScore.noPlaceholders ? '✅' : '❌'}\n`;
    report += `- Project Specific: ${result.qualityScore.projectSpecific ? '✅' : '❌'}\n`;
    report += `- Agent Quality: ${result.qualityScore.agentQuality}/100\n`;
    report += `- Command Quality: ${result.qualityScore.commandQuality}/100\n\n`;
    
    report += `---\n\n`;
  }
  
  await fs.writeFile(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);
  
  // Also print to console
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nPassed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log(`\nAverage Quality Scores:`);
  console.log(`  Agent Quality: ${avgAgentQuality.toFixed(0)}/100`);
  console.log(`  Command Quality: ${avgCommandQuality.toFixed(0)}/100`);
}
```

---

## Running Tests

### Package.json scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:e2e": "tsx tests/e2e/runner.ts",
    "test:e2e:new": "tsx tests/e2e/runner.ts --scenario new-project",
    "test:e2e:nextjs": "tsx tests/e2e/runner.ts --scenario nextjs-supabase",
    "test:e2e:express": "tsx tests/e2e/runner.ts --scenario express-api",
    "test:e2e:monorepo": "tsx tests/e2e/runner.ts --scenario monorepo"
  }
}
```

### CLI Command:

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific scenario
pnpm test:e2e:nextjs

# Run with verbose output
pnpm test:e2e -- --verbose
```

---

## Instructions for Claude Code

Add this to your prompt when development is complete:

```
The CLI development is complete. Now run the automated test suite:

1. Create the test infrastructure as defined in AUTOMATED_TESTS.md
2. Implement all test scenarios
3. Create the expected output fixtures based on what the CLI SHOULD produce
4. Run: pnpm test:e2e
5. Fix any failures
6. Re-run until all tests pass with quality scores > 80

Important:
- Do NOT read expected results before running the CLI
- The test validates both file generation AND content quality
- Placeholders like {PROJECT_NAME} should NEVER appear in output
- Generated content must reference actual project details
```

---

## Expected Test Report Output

```
============================================================
TEST RESULTS SUMMARY
============================================================

Passed: 4/4
Failed: 0/4

Average Quality Scores:
  Agent Quality: 92/100
  Command Quality: 88/100

Detailed Results:
  ✅ new-empty-project (2.1s)
  ✅ nextjs-supabase-app (45.3s)
  ✅ express-api (12.7s)
  ✅ monorepo (38.2s)

Report saved to: test-reports/test-report-2026-01-07T22-30-00.md
```
