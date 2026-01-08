import { globby } from 'globby';
import { readFile } from '../utils/fs.js';
import {
  TENANT_PATTERNS,
  TENANT_FIELD_NAMES,
  API_PATTERNS,
  IGNORE_PATTERNS,
} from '../constants/detection.js';

export interface PatternAnalysisResult {
  isMultiTenant: boolean | 'maybe';
  tenantField: string | null;
  apiStyle: string | null; // 'rest', 'graphql', 'trpc', 'mixed'
  hasRoutes: boolean;
  tenantExamples: string[]; // File paths where tenant patterns found
}

export async function analyzePatterns(cwd: string): Promise<PatternAnalysisResult> {
  // Get all source files
  const sourceFiles = await globby(['**/*.{ts,tsx,js,jsx,py,go}'], {
    cwd,
    ignore: IGNORE_PATTERNS,
    gitignore: true,
  });

  // Limit files to analyze (for performance)
  const filesToAnalyze = sourceFiles.slice(0, 50);

  // Analyze multi-tenancy
  const { isMultiTenant, tenantField, examples } = await detectMultiTenancy(
    cwd,
    filesToAnalyze
  );

  // Detect API style
  const apiStyle = await detectAPIStyle(sourceFiles);

  // Check if has routes
  const hasRoutes = apiStyle !== null;

  return {
    isMultiTenant,
    tenantField,
    apiStyle,
    hasRoutes,
    tenantExamples: examples,
  };
}

async function detectMultiTenancy(
  cwd: string,
  files: string[]
): Promise<{
  isMultiTenant: boolean | 'maybe';
  tenantField: string | null;
  examples: string[];
}> {
  const tenantFieldCounts: Record<string, number> = {};
  const examples: string[] = [];
  let totalMatches = 0;

  for (const file of files) {
    try {
      const content = await readFile(`${cwd}/${file}`);

      // Check each tenant pattern
      for (const pattern of TENANT_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          totalMatches += matches.length;
          if (examples.length < 5) {
            examples.push(file);
          }

          // Try to extract the specific field name
          for (const fieldName of TENANT_FIELD_NAMES) {
            if (content.includes(fieldName)) {
              tenantFieldCounts[fieldName] = (tenantFieldCounts[fieldName] || 0) + 1;
            }
          }
        }
      }
    } catch {
      // Skip files that can't be read
      continue;
    }
  }

  // Determine if multi-tenant
  let isMultiTenant: boolean | 'maybe' = false;
  if (totalMatches >= 5) {
    isMultiTenant = true;
  } else if (totalMatches >= 2) {
    isMultiTenant = 'maybe';
  }

  // Find most common tenant field
  let tenantField: string | null = null;
  if (Object.keys(tenantFieldCounts).length > 0) {
    tenantField = Object.entries(tenantFieldCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  return {
    isMultiTenant,
    tenantField,
    examples: [...new Set(examples)],
  };
}

async function detectAPIStyle(files: string[]): Promise<string | null> {
  const styles = {
    rest: 0,
    graphql: 0,
    trpc: 0,
  };

  // Check for REST API patterns
  for (const pattern of API_PATTERNS.rest) {
    const matches = files.filter(f => pattern.test(f));
    styles.rest += matches.length;
  }

  // Check for GraphQL patterns
  for (const pattern of API_PATTERNS.graphql) {
    const matches = files.filter(f => pattern.test(f));
    styles.graphql += matches.length;
  }

  // Check for tRPC patterns
  for (const pattern of API_PATTERNS.trpc) {
    const matches = files.filter(f => pattern.test(f));
    styles.trpc += matches.length;
  }

  // Determine primary style
  const total = styles.rest + styles.graphql + styles.trpc;
  if (total === 0) return null;

  const sortedStyles = Object.entries(styles).sort((a, b) => b[1] - a[1]);

  // If multiple styles, return 'mixed'
  if (sortedStyles[0][1] > 0 && sortedStyles[1][1] > 0) {
    return 'mixed';
  }

  return sortedStyles[0][1] > 0 ? sortedStyles[0][0] : null;
}

export async function searchForPattern(
  cwd: string,
  pattern: RegExp,
  maxFiles: number = 20
): Promise<{ matches: number; files: string[] }> {
  const sourceFiles = await globby(['**/*.{ts,tsx,js,jsx}'], {
    cwd,
    ignore: IGNORE_PATTERNS,
    gitignore: true,
  });

  const filesToCheck = sourceFiles.slice(0, maxFiles);
  const matchedFiles: string[] = [];
  let totalMatches = 0;

  for (const file of filesToCheck) {
    try {
      const content = await readFile(`${cwd}/${file}`);
      const matches = content.match(pattern);
      if (matches) {
        totalMatches += matches.length;
        matchedFiles.push(file);
      }
    } catch {
      continue;
    }
  }

  return {
    matches: totalMatches,
    files: matchedFiles,
  };
}
