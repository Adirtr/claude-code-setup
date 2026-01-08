import { execa } from 'execa';
import { readJSON } from '../utils/fs.js';
import { BUILD_COMMANDS, TEST_COMMANDS } from '../constants/detection.js';
import type { BuildStatus, PackageManager } from '../types/index.js';

export interface HealthCheckResult {
  buildStatus: BuildStatus;
  buildErrors: string[];
  testsPassing: boolean | 'unknown';
  hasTypeErrors: boolean;
  typeErrors: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
}

export async function checkHealth(
  cwd: string,
  packageManager: PackageManager | null,
  skipSlowChecks: boolean = false
): Promise<HealthCheckResult> {
  const pkg = await readJSON<PackageJson>(`${cwd}/package.json`);

  // Check if build script exists
  const hasBuildScript = pkg?.scripts?.build !== undefined;
  const hasTestScript = pkg?.scripts?.test !== undefined;

  let buildStatus: BuildStatus = 'unknown';
  let buildErrors: string[] = [];
  let testsPassing: boolean | 'unknown' = 'unknown';
  let hasTypeErrors = false;
  let typeErrors: string[] = [];

  // Skip slow checks if requested (for faster init)
  if (skipSlowChecks) {
    return {
      buildStatus,
      buildErrors,
      testsPassing,
      hasTypeErrors,
      typeErrors,
    };
  }

  // Check TypeScript errors (fast check)
  if (pkg?.scripts?.typecheck || await hasTypeScript(cwd)) {
    const typeCheckResult = await checkTypeScript(cwd);
    hasTypeErrors = typeCheckResult.hasErrors;
    typeErrors = typeCheckResult.errors;
  }

  // Try to run build (with timeout)
  if (hasBuildScript && packageManager) {
    const buildResult = await runBuild(cwd, packageManager);
    buildStatus = buildResult.status;
    buildErrors = buildResult.errors;
  }

  // Try to run tests (with timeout)
  if (hasTestScript && packageManager) {
    testsPassing = await runTests(cwd, packageManager);
  }

  return {
    buildStatus,
    buildErrors,
    testsPassing,
    hasTypeErrors,
    typeErrors,
  };
}

async function hasTypeScript(cwd: string): Promise<boolean> {
  const pkg = await readJSON<PackageJson>(`${cwd}/package.json`);
  return pkg?.scripts?.typecheck !== undefined ||
    Object.keys(pkg || {}).some(k => k.includes('typescript'));
}

async function checkTypeScript(cwd: string): Promise<{
  hasErrors: boolean;
  errors: string[];
}> {
  try {
    const { stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
      cwd,
      timeout: 30000,
      reject: false,
    });

    const output = stdout + stderr;
    const errorLines = output
      .split('\n')
      .filter(line => line.includes('error TS'))
      .slice(0, 10); // Limit to first 10 errors

    return {
      hasErrors: errorLines.length > 0,
      errors: errorLines,
    };
  } catch {
    return { hasErrors: false, errors: [] };
  }
}

async function runBuild(
  cwd: string,
  packageManager: PackageManager
): Promise<{ status: BuildStatus; errors: string[] }> {
  const command = BUILD_COMMANDS[packageManager];
  if (!command) {
    return { status: 'unknown', errors: [] };
  }

  const [cmd, ...args] = command.split(' ');

  try {
    const { stdout, stderr, exitCode } = await execa(cmd, args, {
      cwd,
      timeout: 120000, // 2 minute timeout
      reject: false,
    });

    if (exitCode === 0) {
      return { status: 'passing', errors: [] };
    }

    // Extract error messages
    const output = stdout + '\n' + stderr;
    const errors = extractBuildErrors(output);

    return {
      status: 'failing',
      errors: errors.slice(0, 10), // Limit to 10 errors
    };
  } catch (error) {
    // Timeout or other error
    return {
      status: 'unknown',
      errors: [`Build check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

async function runTests(
  cwd: string,
  packageManager: PackageManager
): Promise<boolean | 'unknown'> {
  const command = TEST_COMMANDS[packageManager];
  if (!command) {
    return 'unknown';
  }

  const [cmd, ...args] = command.split(' ');

  try {
    const { exitCode } = await execa(cmd, args, {
      cwd,
      timeout: 60000, // 1 minute timeout
      reject: false,
    });

    return exitCode === 0;
  } catch {
    return 'unknown';
  }
}

function extractBuildErrors(output: string): string[] {
  const lines = output.split('\n');
  const errors: string[] = [];

  for (const line of lines) {
    // TypeScript errors
    if (line.includes('error TS')) {
      errors.push(line.trim());
    }
    // ESLint errors
    else if (line.includes('✖') || line.match(/\d+:\d+\s+error/)) {
      errors.push(line.trim());
    }
    // Generic "Error:" lines
    else if (line.match(/^Error:/i)) {
      errors.push(line.trim());
    }
    // Webpack/Vite errors
    else if (line.includes('ERROR') && line.length < 200) {
      errors.push(line.trim());
    }
  }

  // Remove duplicates
  return [...new Set(errors)];
}

export async function quickHealthCheck(cwd: string): Promise<{
  canBuild: boolean;
  canTest: boolean;
  hasTypeCheck: boolean;
}> {
  const pkg = await readJSON<PackageJson>(`${cwd}/package.json`);

  return {
    canBuild: pkg?.scripts?.build !== undefined,
    canTest: pkg?.scripts?.test !== undefined,
    hasTypeCheck: pkg?.scripts?.typecheck !== undefined ||
                  await hasTypeScript(cwd),
  };
}
