import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TestScenario, TestResult, ProjectContext, QualityAssessment } from '../types.js';
import { compareResults } from '../utils/comparator.js';
import { generateReport } from '../utils/reporter.js';
import { assessAgentQuality } from '../utils/agent-quality.js';
import { assessCommandQuality } from '../utils/command-quality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import scenarios
import { newProjectScenario } from './scenarios/new-project.test.js';
import { nextjsSupabaseScenario } from './scenarios/nextjs-supabase.test.js';
import { expressApiScenario } from './scenarios/express-api.test.js';

export async function runAllTests(options: { withQuality?: boolean; scenario?: string } = {}): Promise<TestResult[]> {
  const scenarios: TestScenario[] = [
    newProjectScenario,
    nextjsSupabaseScenario,
    expressApiScenario,
  ];

  let scenariosToRun = scenarios;
  if (options.scenario) {
    scenariosToRun = scenarios.filter(s => s.name === options.scenario);
  }

  const results: TestResult[] = [];

  for (const scenario of scenariosToRun) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`${'='.repeat(60)}\n`);

    const result = await runScenario(scenario, options);
    results.push(result);

    // Print immediate result
    console.log(result.passed ? '✅ PASSED' : '❌ FAILED');
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(e => console.log(`  - ${e}`));
    }
  }

  // Generate report
  await generateReport(results);

  return results;
}

async function runScenario(scenario: TestScenario, options: { withQuality?: boolean } = {}): Promise<TestResult> {
  const result: TestResult = {
    scenario: scenario.name,
    passed: false,
    filesGenerated: [],
    errors: [],
  };

  let testDir: string | null = null;

  try {
    // Step 1: Setup test project
    console.log('Setting up test project...');
    testDir = await scenario.setup();

    // Step 2: Run CLI
    console.log('Running CLI...');
    await runCLI(testDir, scenario.expectedMode);

    // Step 3: Collect actual results
    console.log('Collecting generated files...');
    const actualFiles = await collectGeneratedFiles(testDir);
    result.filesGenerated = Object.keys(actualFiles);

    console.log(`Generated ${result.filesGenerated.length} files`);

    // Step 4: Compare with expected (if exists)
    const expectedDir = path.join(__dirname, 'fixtures', 'expected', scenario.name);
    if (await fs.pathExists(expectedDir)) {
      console.log('Comparing with expected results...');
      const comparison = await compareResults(actualFiles, expectedDir);

      if (comparison.missingFiles.length > 0) {
        result.errors.push(`Missing files: ${comparison.missingFiles.join(', ')}`);
      }
      if (comparison.extraFiles.length > 0) {
        result.errors.push(`Extra files: ${comparison.extraFiles.join(', ')}`);
      }
      if (comparison.contentDiffs.length > 0) {
        comparison.contentDiffs.forEach(diff => {
          result.errors.push(`${diff.file}: ${diff.diff}`);
        });
      }
    }

    // Step 5: Quality assessment
    if (options.withQuality) {
      console.log('Assessing quality...');
      const quality = await assessQuality(testDir, actualFiles, scenario.context);
      result.quality = quality;

      if (!quality.overall.passed) {
        result.errors.push('Quality assessment failed');
      }

      // Log quality results
      console.log(`Quality Score: ${quality.overall.score.toFixed(0)}/100`);
    }

    // Basic check: must have CLAUDE.md
    if (!actualFiles['CLAUDE.md']) {
      result.errors.push('CLAUDE.md not generated');
    } else {
      // Check for placeholders
      const placeholders = [
        /\{[A-Z_]+\}/g,
        /\[FILL.*?\]/gi,
        /\[TODO.*?\]/gi,
      ];
      const hasPlaceholders = placeholders.some(p => p.test(actualFiles['CLAUDE.md']));
      if (hasPlaceholders) {
        result.errors.push('CLAUDE.md contains placeholders');
      }
    }

    result.passed = result.errors.length === 0;

  } catch (error) {
    result.errors.push(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    result.passed = false;
  } finally {
    // Cleanup
    if (scenario.cleanup) {
      try {
        await scenario.cleanup();
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError);
      }
    }
  }

  return result;
}

async function runCLI(testDir: string, mode: string): Promise<void> {
  // Build the CLI path - go up from tests/e2e to project root
  const projectRoot = path.join(__dirname, '..', '..');
  const binPath = path.join(projectRoot, 'bin', 'claude-setup.js');

  const command = `node "${binPath}" init --mode ${mode} --yes --force`;

  try {
    execSync(command, {
      cwd: testDir,
      encoding: 'utf-8',
      timeout: 180000,  // 3 minutes max
      stdio: 'pipe',
    });
  } catch (error: any) {
    throw new Error(`CLI execution failed: ${error.message}`);
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

async function assessQuality(
  dir: string,
  files: Record<string, string>,
  context: ProjectContext
): Promise<QualityAssessment> {
  const result: QualityAssessment = {
    agents: [],
    commands: [],
    overall: {
      score: 0,
      passed: false,
      issues: [],
    },
  };

  // Normalize path separators for matching
  const normalizePath = (p: string) => p.replace(/\\/g, '/');

  // Assess each agent
  for (const [filePath, content] of Object.entries(files)) {
    const normalizedPath = normalizePath(filePath);
    if (normalizedPath.includes('agents/')) {
      const agentName = normalizedPath.split('/').pop()?.replace('.md', '') || '';
      const assessment = await assessAgentQuality(content, context);

      result.agents.push({
        name: agentName,
        path: filePath,
        autoScore: assessment.score,
        finalScore: assessment.score,
        breakdown: assessment.breakdown,
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        isProductionReady: assessment.score >= 80 && !assessment.issues.some(i => i.severity === 'critical'),
      });
    }
  }

  // Assess each command
  for (const [filePath, content] of Object.entries(files)) {
    const normalizedPath = normalizePath(filePath);
    if (normalizedPath.includes('commands/')) {
      const commandName = normalizedPath.split('/').pop()?.replace('.md', '') || '';
      const assessment = await assessCommandQuality(content, context);

      result.commands.push({
        name: commandName,
        path: filePath,
        autoScore: assessment.score,
        finalScore: assessment.score,
        breakdown: assessment.breakdown,
        issues: assessment.issues,
        suggestions: assessment.suggestions,
        runnableCommands: assessment.runnableCommands,
        isProductionReady: assessment.score >= 75,
      });
    }
  }

  // Calculate overall
  const allScores = [
    ...result.agents.map(a => a.finalScore),
    ...result.commands.map(c => c.finalScore),
  ];

  result.overall.score = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0;

  // Collect all issues
  result.overall.issues = [
    ...result.agents.flatMap(a => a.issues),
    ...result.commands.flatMap(c => c.issues),
  ];

  result.overall.passed =
    result.agents.every(a => a.isProductionReady) &&
    result.commands.every(c => c.isProductionReady) &&
    result.overall.score >= 80;

  return result;
}

// CLI interface
const args = process.argv.slice(2);
const withQuality = args.includes('--with-quality');
const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
const scenario = scenarioArg ? scenarioArg.split('=')[1] : undefined;

runAllTests({ withQuality, scenario })
  .then(results => {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`FINAL RESULTS: ${passed}/${total} tests passed`);
    console.log('='.repeat(60));

    process.exit(passed === total ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
