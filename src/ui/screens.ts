import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import type { DetectedProject, GenerationResult } from '../types/index.js';

export class UIScreens {
  /**
   * Display welcome screen with overview of what will happen
   */
  showWelcome(): void {
    logger.box('🚀 Claude Code Setup');

    console.log(chalk.white('Welcome! I\'ll help you set up Claude Code for your project.'));
    console.log();

    console.log(chalk.bold('What will happen:'));
    console.log(chalk.dim('─────────────────'));
    console.log(chalk.cyan('1. 🔍 Scan') + chalk.dim(' - I\'ll analyze your project (automatic)'));
    console.log(chalk.cyan('2. 📋 Choose') + chalk.dim(' - You pick a setup level (1 question)'));
    console.log(chalk.cyan('3. ✨ Generate') + chalk.dim(' - I\'ll create configuration (automatic)'));
    console.log(chalk.cyan('4. 🔄 Refine') + chalk.dim(' - You can adjust via chat (optional)'));
    console.log();
  }

  /**
   * Display detection summary showing what was found
   */
  showDetectionSummary(detected: DetectedProject): void {
    logger.header('📊 Project Analysis Complete');
    console.log();

    // Project info
    const projectType = detected.projectState === 'new' ? 'New project' : 'Existing web application';
    console.log(chalk.white('Project: ') + chalk.bold(detected.projectName));
    console.log(chalk.white('Type: ') + chalk.bold(projectType) + chalk.dim(` (${detected.fileCount} source files)`));
    console.log();

    // Detected stack
    if (this.hasStack(detected)) {
      console.log(chalk.bold('Detected Stack:'));
      this.displayStack(detected);
      console.log();
    }

    // Special patterns
    if (this.hasSpecialPatterns(detected)) {
      console.log(chalk.bold('Special Patterns:'));
      this.displaySpecialPatterns(detected);
      console.log();
    }

    // Recommendations preview
    if (detected.projectState === 'existing') {
      console.log(chalk.dim('Recommended: ') + chalk.cyan('Automatic mode') + chalk.dim(' (full setup with agents & commands)'));
      console.log();
    }
  }

  /**
   * Display mode selection options
   */
  showModeOptions(): void {
    console.log();
    logger.header('Setup Mode Selection');
    console.log();

    console.log(chalk.bold.cyan('⚡ Light') + chalk.dim(' - Basic CLAUDE.md only (2 minutes)'));
    console.log(chalk.dim('   Best for: MVPs, simple projects, enterprise restrictions'));
    console.log();

    console.log(chalk.bold.green('🚀 Automatic') + chalk.dim(' - Full setup with recommendations (3 minutes)') + chalk.yellow(' ⭐ Recommended'));
    console.log(chalk.dim('   Includes: CLAUDE.md + agents + commands + guardrails'));
    console.log();

    console.log(chalk.bold.yellow('⚙️  Custom') + chalk.dim(' - Choose each component (5+ minutes)'));
    console.log(chalk.dim('   For: Advanced users who want full control'));
    console.log();
  }

  /**
   * Display completion screen with created files and next steps
   */
  showCompletion(result: GenerationResult): void {
    console.log();
    logger.box('✅ Setup Complete!');

    // Created files
    console.log(chalk.bold('Created files:'));
    const filesByType = this.groupFilesByType(result.files);

    for (const [type, files] of Object.entries(filesByType)) {
      if (files.length > 0) {
        console.log(chalk.cyan(`\n${type}:`));
        files.forEach(file => {
          console.log(chalk.dim('  ├─ ') + chalk.white(file.path));
        });
      }
    }
    console.log();

    // Warnings
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.dim('  • ') + chalk.yellow(warning));
      });
      console.log();
    }

    // How to verify
    console.log(chalk.bold('How to Verify:'));
    console.log(chalk.dim('──────────────'));
    console.log(chalk.dim('1. Open ') + chalk.cyan('CLAUDE.md') + chalk.dim(' and check if the project description is accurate'));
    console.log(chalk.dim('2. Review each agent in ') + chalk.cyan('.claude/agents/') + chalk.dim(' - do they match your needs?'));
    console.log(chalk.dim('3. Test a command: ') + chalk.green('claude /pre-commit'));
    console.log(chalk.dim('4. Run: ') + chalk.green('claude-setup doctor') + chalk.dim(' (to validate configuration)'));
    console.log();

    // Not quite right
    console.log(chalk.bold('Not quite right?'));
    console.log(chalk.dim('────────────────'));
    console.log(chalk.dim('• Open a chat with Claude Code and say:'));
    console.log(chalk.cyan('  "The security-reviewer agent should focus more on OWASP Top 10"'));
    console.log();
    console.log(chalk.dim('• Or run: ') + chalk.green('claude-setup add <type> <name>'));
    console.log();

    // Next steps
    if (result.nextSteps.length > 0) {
      console.log(chalk.bold('Next Steps:'));
      result.nextSteps.forEach((step, index) => {
        console.log(chalk.dim(`${index + 1}. `) + step);
      });
      console.log();
    }

    console.log(chalk.green('Happy coding! 🎉'));
    console.log();
  }

  /**
   * Display dry run preview
   */
  showDryRunPreview(files: Array<{ path: string; content: string }>): void {
    console.log();
    logger.header('🔍 Dry Run Preview');
    console.log();

    console.log(chalk.dim('The following files would be created:'));
    console.log();

    files.forEach(file => {
      console.log(chalk.cyan('📄 ') + chalk.white(file.path));
      const lines = file.content.split('\n').length;
      const size = Buffer.byteLength(file.content, 'utf8');
      console.log(chalk.dim(`   ${lines} lines, ${this.formatBytes(size)}`));
    });

    console.log();
    console.log(chalk.yellow('ℹ️  Run without --dry-run to create these files'));
    console.log();
  }

  /**
   * Display error screen
   */
  showError(message: string, details?: string): void {
    console.log();
    console.log(chalk.red('✗ Error: ') + chalk.white(message));
    if (details) {
      console.log();
      console.log(chalk.dim(details));
    }
    console.log();
  }

  // Helper methods

  private hasStack(detected: DetectedProject): boolean {
    return !!(
      detected.framework ||
      detected.language ||
      detected.database ||
      detected.auth ||
      detected.testing?.unit ||
      detected.testing?.e2e ||
      detected.packageManager
    );
  }

  private displayStack(detected: DetectedProject): void {
    if (detected.framework) {
      console.log(chalk.dim('├─ ') + chalk.white('Framework: ') + chalk.cyan(detected.framework));
    }
    if (detected.language) {
      console.log(chalk.dim('├─ ') + chalk.white('Language: ') + chalk.cyan(detected.language));
    }
    if (detected.database) {
      const db = detected.database;
      const parts = [db.type, db.provider, db.orm].filter(Boolean);
      console.log(chalk.dim('├─ ') + chalk.white('Database: ') + chalk.cyan(parts.join(' + ')));
    }
    if (detected.auth) {
      console.log(chalk.dim('├─ ') + chalk.white('Auth: ') + chalk.cyan(detected.auth.provider));
    }
    if (detected.testing?.unit || detected.testing?.e2e) {
      const testing = [detected.testing.unit, detected.testing.e2e].filter(Boolean).join(' + ');
      console.log(chalk.dim('├─ ') + chalk.white('Testing: ') + chalk.cyan(testing));
    }
    if (detected.packageManager) {
      console.log(chalk.dim('└─ ') + chalk.white('Package Manager: ') + chalk.cyan(detected.packageManager));
    }
  }

  private hasSpecialPatterns(detected: DetectedProject): boolean {
    return !!(
      detected.isMultiTenant ||
      detected.externalApis.length > 0 ||
      detected.buildErrors.length > 0
    );
  }

  private displaySpecialPatterns(detected: DetectedProject): void {
    const patterns: string[] = [];

    if (detected.isMultiTenant) {
      const confidence = detected.isMultiTenant === 'maybe' ? '(likely)' : '';
      patterns.push(
        chalk.green('✓ ') + `Multi-tenant ${confidence}` +
        (detected.tenantField ? chalk.dim(` (field: ${detected.tenantField})`) : '')
      );
    }

    if (detected.externalApis.length > 0) {
      patterns.push(
        chalk.green('✓ ') + `External APIs: ` + chalk.cyan(detected.externalApis.slice(0, 5).join(', ')) +
        (detected.externalApis.length > 5 ? chalk.dim(` +${detected.externalApis.length - 5} more`) : '')
      );
    }

    if (detected.buildErrors.length > 0) {
      patterns.push(
        chalk.yellow('⚠ ') + `Build issues detected (${detected.buildErrors.length} errors)`
      );
    }

    patterns.forEach((pattern, index) => {
      const prefix = index === patterns.length - 1 ? '└─' : '├─';
      console.log(chalk.dim(prefix + ' ') + pattern);
    });
  }

  private groupFilesByType(files: Array<{ path: string; created: boolean }>) {
    return {
      'Core': files.filter(f => f.path.includes('CLAUDE.md')),
      'Settings': files.filter(f => f.path.includes('settings')),
      'Agents': files.filter(f => f.path.includes('/agents/')),
      'Commands': files.filter(f => f.path.includes('/commands/')),
      'Workflows': files.filter(f => f.path.includes('/workflows/')),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// Export singleton
export const screens = new UIScreens();
