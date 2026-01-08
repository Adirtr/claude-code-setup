import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string[];
}

export async function doctorCommand(): Promise<void> {
  try {
    const cwd = process.cwd();

    logger.header('Claude Code Setup Validation');
    console.log();

    const results: ValidationResult[] = [];

    // Check 1: CLAUDE.md exists
    results.push(await checkClaudeMd(cwd));

    // Check 2: .claude directory structure
    results.push(await checkClaudeDirectory(cwd));

    // Check 3: settings.local.json
    results.push(await checkSettingsLocal(cwd));

    // Check 4: settings.json (if exists)
    results.push(await checkSettingsJson(cwd));

    // Check 5: Agent files
    results.push(await checkAgents(cwd));

    // Check 6: Command files
    results.push(await checkCommands(cwd));

    // Print results
    console.log();
    logger.header('Results');
    console.log();

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach(result => {
      if (result.passed) {
        logger.success(`✓ ${result.message}`);
      } else {
        logger.error(`✗ ${result.message}`);
      }

      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`    ${detail}`);
        });
      }
    });

    console.log();
    console.log('─'.repeat(50));
    console.log();

    if (failed === 0) {
      logger.success(`All ${passed} checks passed! ✓`);
      console.log();
      logger.info('Your Claude Code setup is healthy.');
    } else {
      logger.warning(`${passed} passed, ${failed} failed`);
      console.log();
      logger.info('Fix the issues above to ensure Claude Code works correctly.');
    }

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    logger.error(`Failed to run doctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function checkClaudeMd(cwd: string): Promise<ValidationResult> {
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');

  if (!await fs.pathExists(claudeMdPath)) {
    return {
      passed: false,
      message: 'CLAUDE.md file missing',
      details: ['Run "claude-setup init" to create it'],
    };
  }

  const content = await fs.readFile(claudeMdPath, 'utf-8');

  if (content.length < 500) {
    return {
      passed: false,
      message: 'CLAUDE.md file exists but is too short',
      details: [`Found ${content.length} characters (expected at least 500)`],
    };
  }

  // Check for placeholders
  const placeholders = [
    /\{[A-Z_]+\}/g,
    /\[FILL.*?\]/gi,
    /\[TODO.*?\]/gi,
  ];

  const hasPlaceholders = placeholders.some(p => p.test(content));
  if (hasPlaceholders) {
    return {
      passed: false,
      message: 'CLAUDE.md contains placeholders',
      details: ['Edit the file and replace placeholders with actual content'],
    };
  }

  return {
    passed: true,
    message: 'CLAUDE.md is valid',
  };
}

async function checkClaudeDirectory(cwd: string): Promise<ValidationResult> {
  const claudeDir = path.join(cwd, '.claude');

  if (!await fs.pathExists(claudeDir)) {
    return {
      passed: false,
      message: '.claude directory missing',
      details: ['Run "claude-setup init" to create it'],
    };
  }

  return {
    passed: true,
    message: '.claude directory exists',
  };
}

async function checkSettingsLocal(cwd: string): Promise<ValidationResult> {
  const settingsPath = path.join(cwd, '.claude', 'settings.local.json');

  if (!await fs.pathExists(settingsPath)) {
    return {
      passed: false,
      message: 'settings.local.json missing',
      details: ['Run "claude-setup init" to create it'],
    };
  }

  try {
    const settings = await fs.readJson(settingsPath);

    if (!settings.permissions) {
      return {
        passed: false,
        message: 'settings.local.json missing permissions section',
      };
    }

    if (!settings.commands) {
      return {
        passed: false,
        message: 'settings.local.json missing commands section',
      };
    }

    return {
      passed: true,
      message: 'settings.local.json is valid',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'settings.local.json is not valid JSON',
      details: ['Fix JSON syntax errors'],
    };
  }
}

async function checkSettingsJson(cwd: string): Promise<ValidationResult> {
  const settingsPath = path.join(cwd, '.claude', 'settings.json');

  if (!await fs.pathExists(settingsPath)) {
    return {
      passed: true,
      message: 'settings.json not found (optional)',
      details: ['MCP servers are optional'],
    };
  }

  try {
    const settings = await fs.readJson(settingsPath);

    if (settings.mcpServers) {
      const mcpCount = Object.keys(settings.mcpServers).length;
      return {
        passed: true,
        message: `settings.json is valid (${mcpCount} MCP server${mcpCount !== 1 ? 's' : ''})`,
      };
    }

    return {
      passed: true,
      message: 'settings.json is valid',
    };
  } catch (error) {
    return {
      passed: false,
      message: 'settings.json is not valid JSON',
      details: ['Fix JSON syntax errors'],
    };
  }
}

async function checkAgents(cwd: string): Promise<ValidationResult> {
  const agentsDir = path.join(cwd, '.claude', 'agents');

  if (!await fs.pathExists(agentsDir)) {
    return {
      passed: true,
      message: 'No agents directory (optional)',
    };
  }

  const files = await fs.readdir(agentsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    return {
      passed: true,
      message: 'No agent files (optional)',
    };
  }

  const issues: string[] = [];

  for (const file of mdFiles) {
    const filePath = path.join(agentsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');

    // Check for frontmatter
    if (!content.startsWith('---')) {
      issues.push(`${file}: Missing frontmatter`);
    }

    // Check length
    if (content.length < 200) {
      issues.push(`${file}: Too short (${content.length} chars)`);
    }

    // Check for placeholders
    const placeholders = [
      /\{[A-Z_]+\}/g,
      /\[FILL.*?\]/gi,
      /\[TODO.*?\]/gi,
    ];
    const hasPlaceholders = placeholders.some(p => p.test(content));
    if (hasPlaceholders) {
      issues.push(`${file}: Contains placeholders`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      message: `Found ${mdFiles.length} agent(s) with issues`,
      details: issues,
    };
  }

  return {
    passed: true,
    message: `All ${mdFiles.length} agent(s) are valid`,
  };
}

async function checkCommands(cwd: string): Promise<ValidationResult> {
  const commandsDir = path.join(cwd, '.claude', 'commands');

  if (!await fs.pathExists(commandsDir)) {
    return {
      passed: true,
      message: 'No commands directory (optional)',
    };
  }

  const files = await fs.readdir(commandsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    return {
      passed: true,
      message: 'No command files (optional)',
    };
  }

  const issues: string[] = [];

  for (const file of mdFiles) {
    const filePath = path.join(commandsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');

    // Check length
    if (content.length < 100) {
      issues.push(`${file}: Too short (${content.length} chars)`);
    }

    // Check for code blocks
    if (!content.includes('```')) {
      issues.push(`${file}: No command examples (missing code blocks)`);
    }

    // Check for placeholders
    const placeholders = [
      /\{[A-Z_]+\}/g,
      /\[FILL.*?\]/gi,
      /\[TODO.*?\]/gi,
    ];
    const hasPlaceholders = placeholders.some(p => p.test(content));
    if (hasPlaceholders) {
      issues.push(`${file}: Contains placeholders`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      message: `Found ${mdFiles.length} command(s) with issues`,
      details: issues,
    };
  }

  return {
    passed: true,
    message: `All ${mdFiles.length} command(s) are valid`,
  };
}
