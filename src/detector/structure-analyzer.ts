import { globby } from 'globby';
import { fileExists, readJSON } from '../utils/fs.js';
import {
  PACKAGE_MANAGER_FILES,
  MONOREPO_PATTERNS,
  STRUCTURE_PATTERNS,
  IGNORE_PATTERNS,
} from '../constants/detection.js';
import type { PackageManager, ProjectState } from '../types/index.js';

export interface StructureAnalysisResult {
  projectState: ProjectState;
  fileCount: number;
  hasTests: boolean;
  monorepo: boolean;
  packageManager: PackageManager | null;
  cicd: string | null;
  hasDocker: boolean;
  sourceDirectories: string[];
  testDirectories: string[];
}

export async function analyzeStructure(cwd: string): Promise<StructureAnalysisResult> {
  // Detect package manager
  const packageManager = await detectPackageManager(cwd);

  // Detect if monorepo
  const monorepo = await detectMonorepo(cwd);

  // Count files and detect project state
  const files = await globby(['**/*'], {
    cwd,
    ignore: IGNORE_PATTERNS,
    onlyFiles: true,
    gitignore: true,
  });

  const sourceFiles = files.filter(f =>
    /\.(ts|tsx|js|jsx|vue|svelte|py|go|rs|java)$/.test(f)
  );

  const fileCount = sourceFiles.length;
  const projectState: ProjectState = fileCount > 5 ? 'existing' : 'new';

  // Detect test directories
  const testDirectories = await detectDirectories(cwd, STRUCTURE_PATTERNS.tests);
  const hasTests = testDirectories.length > 0 || files.some(f =>
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f)
  );

  // Detect CI/CD
  const cicd = await detectCICD(cwd);

  // Detect Docker
  const hasDocker = await fileExists(`${cwd}/Dockerfile`) ||
    await fileExists(`${cwd}/docker-compose.yml`);

  // Detect source directories
  const sourceDirectories = await detectDirectories(cwd, STRUCTURE_PATTERNS.srcDir);

  return {
    projectState,
    fileCount,
    hasTests,
    monorepo,
    packageManager,
    cicd,
    hasDocker,
    sourceDirectories,
    testDirectories,
  };
}

async function detectPackageManager(cwd: string): Promise<PackageManager | null> {
  for (const [file, pm] of Object.entries(PACKAGE_MANAGER_FILES)) {
    const exists = await fileExists(`${cwd}/${file}`);
    if (exists) {
      return pm;
    }
  }
  return null;
}

async function detectMonorepo(cwd: string): Promise<boolean> {
  // Check for monorepo config files
  for (const pattern of MONOREPO_PATTERNS) {
    if (pattern === 'workspaces') {
      // Check package.json for workspaces field
      const pkg = await readJSON<{ workspaces?: string[] | { packages: string[] } }>(`${cwd}/package.json`);
      if (pkg?.workspaces) {
        return true;
      }
    } else {
      const exists = await fileExists(`${cwd}/${pattern}`);
      if (exists) {
        return true;
      }
    }
  }

  // Check for common monorepo directory structures
  const hasPackagesDir = await fileExists(`${cwd}/packages`);
  const hasAppsDir = await fileExists(`${cwd}/apps`);

  return hasPackagesDir || hasAppsDir;
}

async function detectDirectories(cwd: string, patterns: string[]): Promise<string[]> {
  const directories: string[] = [];

  for (const pattern of patterns) {
    // Remove wildcards for directory check
    const dirPath = pattern.replace(/\*/g, '').replace(/\/$/, '');
    if (dirPath && !dirPath.includes('.')) {
      const exists = await fileExists(`${cwd}/${dirPath}`);
      if (exists) {
        directories.push(dirPath);
      }
    }
  }

  return directories;
}

async function detectCICD(cwd: string): Promise<string | null> {
  // Check GitHub Actions
  if (await fileExists(`${cwd}/.github/workflows`)) {
    return 'github-actions';
  }

  // Check GitLab CI
  if (await fileExists(`${cwd}/.gitlab-ci.yml`)) {
    return 'gitlab-ci';
  }

  // Check CircleCI
  if (await fileExists(`${cwd}/.circleci`)) {
    return 'circleci';
  }

  // Check Jenkins
  if (await fileExists(`${cwd}/Jenkinsfile`)) {
    return 'jenkins';
  }

  // Check Drone CI
  if (await fileExists(`${cwd}/.drone.yml`)) {
    return 'drone';
  }

  return null;
}

export async function getProjectFiles(
  cwd: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
): Promise<string[]> {
  const patterns = extensions.map(ext => `**/*${ext}`);

  const files = await globby(patterns, {
    cwd,
    ignore: IGNORE_PATTERNS,
    gitignore: true,
  });

  return files;
}

export async function countFilesByExtension(cwd: string): Promise<Record<string, number>> {
  const files = await globby(['**/*'], {
    cwd,
    ignore: IGNORE_PATTERNS,
    onlyFiles: true,
    gitignore: true,
  });

  const counts: Record<string, number> = {};

  for (const file of files) {
    const ext = file.substring(file.lastIndexOf('.'));
    counts[ext] = (counts[ext] || 0) + 1;
  }

  return counts;
}
