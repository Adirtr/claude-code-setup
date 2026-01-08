import { fileExists, writeFile, ensureDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import type { GeneratedFile } from '../types/index.js';
import path from 'path';

export interface WriteOptions {
  force?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

export interface WriteResult {
  written: GeneratedFile[];
  skipped: GeneratedFile[];
  errors: Array<{ file: string; error: string }>;
}

export async function writeFiles(
  files: GeneratedFile[],
  options: WriteOptions = {}
): Promise<WriteResult> {
  const { force = false, dryRun = false, cwd = process.cwd() } = options;

  const result: WriteResult = {
    written: [],
    skipped: [],
    errors: [],
  };

  // Check for existing files
  const existingFiles: GeneratedFile[] = [];

  for (const file of files) {
    const fullPath = path.join(cwd, file.path);
    const exists = await fileExists(fullPath);

    if (exists && !force) {
      existingFiles.push(file);
    }
  }

  // If files exist and force is false, skip writing
  if (existingFiles.length > 0 && !force) {
    logger.warning(`${existingFiles.length} file(s) already exist. Use --force to overwrite.`);
    existingFiles.forEach(file => {
      logger.dim(`  - ${file.path}`);
    });
    result.skipped = existingFiles;
    return result;
  }

  // Dry run - just report what would be written
  if (dryRun) {
    logger.info('Dry run - no files will be written');
    console.log();
    files.forEach(file => {
      logger.success(`Would create: ${file.path}`);
    });
    return result;
  }

  // Write each file
  for (const file of files) {
    try {
      const fullPath = path.join(cwd, file.path);

      // Ensure directory exists
      await ensureDir(path.dirname(fullPath));

      // Write file
      await writeFile(fullPath, file.content);

      result.written.push({ ...file, created: true });
      logger.success(`Created: ${file.path}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push({
        file: file.path,
        error: errorMessage,
      });
      logger.error(`Failed to create ${file.path}: ${errorMessage}`);
    }
  }

  return result;
}

export function calculateTotalSize(files: GeneratedFile[]): number {
  return files.reduce((total, file) => {
    return total + Buffer.byteLength(file.content, 'utf8');
  }, 0);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function groupFilesByDirectory(files: GeneratedFile[]): Record<string, GeneratedFile[]> {
  const groups: Record<string, GeneratedFile[]> = {};

  files.forEach(file => {
    const dir = path.dirname(file.path);
    if (!groups[dir]) {
      groups[dir] = [];
    }
    groups[dir].push(file);
  });

  return groups;
}
