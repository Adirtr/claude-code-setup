import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJSON<T = any>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(filePath: string, data: any): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

export async function removeFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
  } catch {
    // Ignore errors if file doesn't exist
  }
}

export async function listFiles(dirPath: string, recursive = false): Promise<string[]> {
  try {
    if (recursive) {
      const files: string[] = [];
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          const subFiles = await listFiles(fullPath, true);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }

      return files;
    } else {
      const items = await fs.readdir(dirPath);
      return items.map(item => path.join(dirPath, item));
    }
  } catch {
    return [];
  }
}

export function getProjectRoot(): string {
  return process.cwd();
}

export function resolvePath(...segments: string[]): string {
  return path.resolve(getProjectRoot(), ...segments);
}

export function relativePath(from: string, to: string): string {
  return path.relative(from, to);
}

export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}
