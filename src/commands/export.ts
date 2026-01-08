import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { ExportOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { detectProject } from '../detector/index.js';

interface ExportData {
  version: string;
  timestamp: string;
  project: {
    name: string;
    type: string;
    framework?: string;
    language?: string;
    database?: any;
    auth?: any;
    packageManager?: string;
    isMultiTenant: boolean | 'maybe';
    tenantField?: string;
    externalApis: string[];
  };
  files: {
    claudeMd: boolean;
    settingsLocal: boolean;
    settingsJson: boolean;
    agents: string[];
    commands: string[];
  };
  mcpServers?: Record<string, any>;
  guardrails?: any;
}

export async function exportCommand(options: ExportOptions): Promise<void> {
  try {
    const cwd = process.cwd();
    const format = options.format || 'json';

    // Check if setup exists
    const claudeDir = path.join(cwd, '.claude');
    if (!await fs.pathExists(claudeDir)) {
      logger.error('No Claude Code setup found in this directory.');
      logger.info('Run "claude-setup init" first to initialize the project.');
      process.exit(1);
    }

    logger.startSpinner('Collecting configuration...');

    // Detect project
    const detected = await detectProject(cwd, { skipHealthCheck: true });

    // Collect file information
    const agents: string[] = [];
    const agentsDir = path.join(cwd, '.claude', 'agents');
    if (await fs.pathExists(agentsDir)) {
      const files = await fs.readdir(agentsDir);
      agents.push(...files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
    }

    const commands: string[] = [];
    const commandsDir = path.join(cwd, '.claude', 'commands');
    if (await fs.pathExists(commandsDir)) {
      const files = await fs.readdir(commandsDir);
      commands.push(...files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
    }

    // Read MCP configuration
    let mcpServers: Record<string, any> | undefined;
    const settingsJsonPath = path.join(cwd, '.claude', 'settings.json');
    if (await fs.pathExists(settingsJsonPath)) {
      try {
        const settings = await fs.readJson(settingsJsonPath);
        mcpServers = settings.mcpServers;
      } catch {
        // Ignore errors
      }
    }

    // Read guardrails
    let guardrails: any;
    const settingsLocalPath = path.join(cwd, '.claude', 'settings.local.json');
    if (await fs.pathExists(settingsLocalPath)) {
      try {
        guardrails = await fs.readJson(settingsLocalPath);
      } catch {
        // Ignore errors
      }
    }

    // Build export data
    const exportData: ExportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      project: {
        name: detected.projectName,
        type: detected.projectState,
        framework: detected.framework || undefined,
        language: detected.language,
        database: detected.database,
        auth: detected.auth,
        packageManager: detected.packageManager || undefined,
        isMultiTenant: detected.isMultiTenant,
        tenantField: detected.tenantField || undefined,
        externalApis: detected.externalApis,
      },
      files: {
        claudeMd: await fs.pathExists(path.join(cwd, 'CLAUDE.md')),
        settingsLocal: await fs.pathExists(settingsLocalPath),
        settingsJson: await fs.pathExists(settingsJsonPath),
        agents,
        commands,
      },
      mcpServers,
      guardrails,
    };

    logger.succeedSpinner('Configuration collected');

    // Format output
    let output: string;
    if (format === 'yaml') {
      output = yaml.stringify(exportData);
    } else {
      output = JSON.stringify(exportData, null, 2);
    }

    // Write or print output
    if (options.output) {
      await fs.writeFile(options.output, output);
      logger.success(`✓ Exported to: ${options.output}`);
    } else {
      console.log();
      console.log(output);
    }

  } catch (error) {
    logger.error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
