import { execa } from 'execa';
import { fileExists } from './fs.js';
import path from 'path';

export async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--git-dir'], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function hasGitHubRemote(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['remote', '-v'], { cwd });
    return stdout.includes('github.com');
  } catch {
    return false;
  }
}

export async function getRemoteUrl(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getGitHubInfo(cwd: string = process.cwd()): Promise<{
  owner: string;
  repo: string;
} | null> {
  const remoteUrl = await getRemoteUrl(cwd);
  if (!remoteUrl) return null;

  // Parse GitHub URL (both HTTPS and SSH formats)
  const httpsMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)(\.git)?$/);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2],
    };
  }

  return null;
}

export async function hasGitHubActions(cwd: string = process.cwd()): Promise<boolean> {
  const workflowsPath = path.join(cwd, '.github', 'workflows');
  return fileExists(workflowsPath);
}

export async function getCurrentBranch(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function hasUncommittedChanges(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain'], { cwd });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getGitIgnorePatterns(cwd: string = process.cwd()): Promise<string[]> {
  const gitignorePath = path.join(cwd, '.gitignore');
  const exists = await fileExists(gitignorePath);

  if (!exists) return [];

  try {
    const { readFile } = await import('./fs.js');
    const content = await readFile(gitignorePath);
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch {
    return [];
  }
}
