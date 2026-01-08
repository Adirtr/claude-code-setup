import { generateClaudeMd } from './claude-md.js';
import { generateGuardrails, generateSettingsLocalJson } from './guardrails.js';
import { generateAgentFile } from './agents.js';
import { generateCommandFile } from './commands.js';
import { writeFiles } from './file-writer.js';
import { selectAgents } from '../constants/agents.js';
import { selectCommands } from '../constants/commands.js';
import { recommendMCPs, generateSettingsJson } from '../constants/mcps.js';
import type { DetectedProject, SetupMode, GeneratedFile, GenerationResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface GenerationOptions {
  mode: SetupMode;
  force?: boolean;
  dryRun?: boolean;
  cwd?: string;
  customAgents?: import('../types/index.js').AgentDefinition[];
  customCommands?: import('../types/index.js').CommandDefinition[];
  customMCPs?: import('../types/index.js').MCPConfig[];
}

export async function generateAll(
  detected: DetectedProject,
  options: GenerationOptions
): Promise<GenerationResult> {
  const { mode, force = false, dryRun = false, cwd = process.cwd() } = options;

  logger.startSpinner('Generating configuration files...');

  const files: GeneratedFile[] = [];
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  try {
    // Always generate CLAUDE.md
    const claudeMd = generateClaudeMd(detected);
    files.push({
      path: 'CLAUDE.md',
      content: claudeMd,
      created: false,
    });

    // Always generate guardrails (Light mode and above)
    const guardrails = generateGuardrails(detected);
    const settingsLocal = generateSettingsLocalJson(guardrails);

    files.push({
      path: '.claude/settings.local.json',
      content: settingsLocal,
      created: false,
    });

    // Automatic mode: Generate agents, commands, and MCPs
    if (mode === 'automatic') {
      // Generate agents
      const agents = selectAgents(detected);
      agents.forEach(agent => {
        const agentContent = generateAgentFile(agent, detected);
        files.push({
          path: `.claude/agents/${agent.id}.md`,
          content: agentContent,
          created: false,
        });
      });

      // Generate commands
      const commands = selectCommands(detected);
      commands.forEach(command => {
        const commandContent = generateCommandFile(command, detected);
        files.push({
          path: `.claude/commands/${command.id}.md`,
          content: commandContent,
          created: false,
        });
      });

      // Generate MCP configuration if any MCPs recommended
      const mcps = recommendMCPs(detected);
      if (mcps.length > 0) {
        const settingsJson = generateSettingsJson(mcps);
        files.push({
          path: '.claude/settings.json',
          content: settingsJson,
          created: false,
        });
      }
    }

    // Custom mode: Generate user-selected components
    if (mode === 'custom') {
      const { customAgents = [], customCommands = [], customMCPs = [] } = options;

      // Generate selected agents
      customAgents.forEach(agent => {
        const agentContent = generateAgentFile(agent, detected);
        files.push({
          path: `.claude/agents/${agent.id}.md`,
          content: agentContent,
          created: false,
        });
      });

      // Generate selected commands
      customCommands.forEach(command => {
        const commandContent = generateCommandFile(command, detected);
        files.push({
          path: `.claude/commands/${command.id}.md`,
          content: commandContent,
          created: false,
        });
      });

      // Generate MCP configuration if any MCPs selected
      if (customMCPs.length > 0) {
        const settingsJson = generateSettingsJson(customMCPs);
        files.push({
          path: '.claude/settings.json',
          content: settingsJson,
          created: false,
        });
      }
    }

    // Add warnings based on detection
    if (detected.buildStatus === 'failing') {
      warnings.push('Build is currently failing - fix build errors before proceeding');
    }

    if (detected.isMultiTenant && !detected.tenantField) {
      warnings.push('Multi-tenant patterns detected but tenant field is unclear');
    }

    if (detected.externalApis.length > 0) {
      warnings.push(`External APIs detected (${detected.externalApis.join(', ')}) - ensure API keys are in .env`);
    }

    // Add next steps
    nextSteps.push('Review CLAUDE.md and update any project-specific details');
    nextSteps.push('Add environment variables to .env file');

    if (detected.buildStatus === 'failing') {
      nextSteps.push('Fix build errors listed in CLAUDE.md');
    }

    if (mode === 'automatic' || mode === 'custom') {
      const hasAgents = files.some(f => f.path.includes('/agents/'));
      const hasCommands = files.some(f => f.path.includes('/commands/'));

      if (hasAgents) {
        nextSteps.push('Test agents with Claude Code to verify they work as expected');
      }

      if (hasCommands) {
        nextSteps.push('Try commands like /pre-commit or /security-scan');
      }
    }

    nextSteps.push('Run: claude-setup doctor to validate your setup');

    logger.succeedSpinner(`Generated ${files.length} file(s)`);

    // Write files
    const writeResult = await writeFiles(files, {
      force,
      dryRun,
      cwd,
    });

    const summary = dryRun
      ? `Would create ${files.length} file(s)`
      : `Created ${writeResult.written.length} file(s)`;

    return {
      files: writeResult.written,
      summary,
      warnings,
      nextSteps,
    };
  } catch (error) {
    logger.failSpinner('Generation failed');
    throw error;
  }
}

// Export individual generators for advanced usage
export { generateClaudeMd } from './claude-md.js';
export { generateGuardrails, generateSettingsLocalJson } from './guardrails.js';
export { writeFiles } from './file-writer.js';
