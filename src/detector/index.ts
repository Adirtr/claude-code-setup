import { analyzePackage } from './package-analyzer.js';
import { analyzeStructure } from './structure-analyzer.js';
import { analyzePatterns } from './pattern-analyzer.js';
import { checkHealth, quickHealthCheck } from './health-checker.js';
import { hasGitHubActions } from '../utils/git.js';
import type { DetectedProject } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface DetectionOptions {
  skipHealthCheck?: boolean;
  verbose?: boolean;
}

export async function detectProject(
  cwd: string = process.cwd(),
  options: DetectionOptions = {}
): Promise<DetectedProject> {
  const { skipHealthCheck = false, verbose = false } = options;

  if (verbose) {
    logger.startSpinner('Analyzing project...');
  }

  try {
    // Run all analyzers in parallel (except health check which is slow)
    const [packageAnalysis, structureAnalysis, patternAnalysis] = await Promise.all([
      analyzePackage(cwd),
      analyzeStructure(cwd),
      analyzePatterns(cwd),
    ]);

    if (verbose) {
      logger.updateSpinner('Checking project health...');
    }

    // Run health check if not skipped
    let healthCheck;
    if (skipHealthCheck) {
      healthCheck = await quickHealthCheck(cwd);
      healthCheck = {
        buildStatus: 'unknown' as const,
        buildErrors: [],
        testsPassing: 'unknown' as const,
        hasTypeErrors: false,
        typeErrors: [],
      };
    } else {
      healthCheck = await checkHealth(
        cwd,
        structureAnalysis.packageManager,
        true // Skip slow checks by default
      );
    }

    if (verbose) {
      logger.updateSpinner('Detecting CI/CD and Git info...');
    }

    // Check GitHub integration
    const hasGithubActions = await hasGitHubActions(cwd);

    if (verbose) {
      logger.succeedSpinner('Project analysis complete!');
    }

    // Combine all results into DetectedProject
    const detected: DetectedProject = {
      // From package analysis
      projectName: packageAnalysis.projectName,
      projectDescription: packageAnalysis.projectDescription,
      framework: packageAnalysis.framework,
      language: packageAnalysis.language,
      database: packageAnalysis.database,
      auth: packageAnalysis.auth,
      testing: packageAnalysis.testing,
      externalApis: packageAnalysis.externalApis,

      // From structure analysis
      projectState: structureAnalysis.projectState,
      fileCount: structureAnalysis.fileCount,
      hasTests: structureAnalysis.hasTests,
      monorepo: structureAnalysis.monorepo,
      packageManager: structureAnalysis.packageManager,
      cicd: structureAnalysis.cicd || (hasGithubActions ? 'github-actions' : null),

      // From pattern analysis
      isMultiTenant: patternAnalysis.isMultiTenant,
      tenantField: patternAnalysis.tenantField,

      // From health check
      buildStatus: healthCheck.buildStatus,
      buildErrors: healthCheck.buildErrors,
    };

    return detected;
  } catch (error) {
    if (verbose) {
      logger.failSpinner('Project analysis failed');
    }
    throw error;
  }
}

// Export individual analyzers for testing/advanced usage
export { analyzePackage } from './package-analyzer.js';
export { analyzeStructure } from './structure-analyzer.js';
export { analyzePatterns } from './pattern-analyzer.js';
export { checkHealth, quickHealthCheck } from './health-checker.js';
