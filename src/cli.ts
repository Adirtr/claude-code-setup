#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { doctorCommand } from './commands/doctor.js';
import { exportCommand } from './commands/export.js';

const program = new Command();

program
  .name('claude-setup')
  .description('CLI tool to set up Claude Code environment with best practices')
  .version('1.0.0');

// Main init command
program
  .command('init')
  .description('Initialize Claude Code configuration')
  .option('-y, --yes', 'Skip prompts, use auto-detected values')
  .option('-m, --mode <mode>', 'Setup mode: light, automatic, custom')
  .option('--dry-run', 'Show what would be created without writing files')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

// Add components
program
  .command('add <type> [name]')
  .description('Add agent, command, or MCP (type: agent, command, mcp)')
  .option('-l, --list', 'List available options')
  .action(addCommand);

// Validate setup
program
  .command('doctor')
  .description('Validate Claude Code setup and configuration')
  .action(doctorCommand);

// Export config
program
  .command('export')
  .description('Export configuration to JSON or YAML')
  .option('-f, --format <format>', 'Output format: json, yaml', 'json')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(exportCommand);

program.parse();
