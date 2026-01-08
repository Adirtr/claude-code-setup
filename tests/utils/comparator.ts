import fs from 'fs-extra';
import path from 'path';

interface ContentDiff {
  file: string;
  expected: string;
  actual: string;
  diff: string;
}

interface ComparisonResult {
  allMatch: boolean;
  detectionAccuracy: number;
  missingFiles: string[];
  extraFiles: string[];
  contentDiffs: ContentDiff[];
}

// Normalize path separators to forward slashes
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

export async function compareResults(
  actual: Record<string, string>,
  expectedDir: string
): Promise<ComparisonResult> {
  const result: ComparisonResult = {
    allMatch: true,
    detectionAccuracy: 100,
    missingFiles: [],
    extraFiles: [],
    contentDiffs: [],
  };

  // Check if expected directory exists
  if (!await fs.pathExists(expectedDir)) {
    console.warn(`Expected directory not found: ${expectedDir}`);
    return result;
  }

  // Normalize actual file paths
  const normalizedActual: Record<string, string> = {};
  for (const [key, value] of Object.entries(actual)) {
    normalizedActual[normalizePath(key)] = value;
  }

  // Load expected configuration
  const filesConfigPath = path.join(expectedDir, 'files.json');
  const contentRulesPath = path.join(expectedDir, 'content-rules.json');

  let filesConfig: any = { required: [], optional: [], forbidden: [] };
  let contentRules: any = {};

  if (await fs.pathExists(filesConfigPath)) {
    filesConfig = await fs.readJson(filesConfigPath);
  }

  if (await fs.pathExists(contentRulesPath)) {
    contentRules = await fs.readJson(contentRulesPath);
  }

  // Check required files
  for (const file of filesConfig.required || []) {
    const normalizedFile = normalizePath(file);
    if (!normalizedActual[normalizedFile]) {
      result.missingFiles.push(file);
      result.allMatch = false;
    }
  }

  // Check forbidden files
  for (const pattern of filesConfig.forbidden || []) {
    const normalizedPattern = normalizePath(pattern.replace('/', ''));
    const matches = Object.keys(normalizedActual).filter(f => f.startsWith(normalizedPattern));
    if (matches.length > 0) {
      result.extraFiles.push(...matches);
      result.allMatch = false;
    }
  }

  // Check content rules
  for (const [file, rules] of Object.entries(contentRules)) {
    const normalizedFile = normalizePath(file);
    const content = normalizedActual[normalizedFile];
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

    if (r.maxLength && content.length > r.maxLength) {
      result.contentDiffs.push({
        file,
        expected: `Max length: ${r.maxLength}`,
        actual: `Actual length: ${content.length}`,
        diff: `Content too long`,
      });
    }
  }

  return result;
}
