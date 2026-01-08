import type { CommandQualityResult, QualityIssue, ProjectContext, CommandValidation } from '../types.js';

function extractCommands(content: string): string[] {
  const blocks = content.match(/```(?:bash|sh|shell)?\n([\s\S]*?)```/g) || [];
  return blocks.flatMap(block => {
    const code = block.replace(/```(?:bash|sh|shell)?\n?/g, '').replace(/```/g, '');
    return code.split('\n').filter(line =>
      line.trim() &&
      !line.trim().startsWith('#') &&
      !line.trim().startsWith('//')
    );
  });
}

function isValidCommand(cmd: string): boolean {
  // Basic syntax validation
  const validStarters = [
    'npm', 'pnpm', 'yarn', 'bun', 'npx',
    'node', 'tsx', 'ts-node',
    'git', 'gh',
    'cd', 'mkdir', 'cp', 'mv', 'cat', 'echo', 'ls',
    'curl', 'wget',
    'docker', 'docker-compose',
    'prisma', 'drizzle-kit',
  ];

  const firstWord = cmd.trim().split(/\s+/)[0];
  return validStarters.includes(firstWord) || cmd.includes('|') || cmd.startsWith('./');
}

export async function assessCommandQuality(
  commandContent: string,
  projectContext: ProjectContext
): Promise<CommandQualityResult> {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];

  // === STRUCTURE (20 points) ===
  let structureScore = 0;

  // First paragraph describes purpose
  const firstParagraph = commandContent.split('\n\n')[0];
  if (firstParagraph.length > 50 && !firstParagraph.startsWith('#')) {
    structureScore += 5;
  } else if (commandContent.match(/^#[^#].*\n\n.{50,}/)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'structure', message: 'Missing clear description' });
  }

  // Has steps
  if (/^\d+\./m.test(commandContent) || /^#+\s*(step|phase)/im.test(commandContent)) {
    structureScore += 5;
  }

  // Has command blocks
  const shellBlocks = commandContent.match(/```(?:bash|sh|shell)?\n[\s\S]*?```/g) || [];
  if (shellBlocks.length > 0) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'major', category: 'structure', message: 'No shell command blocks' });
  }

  // Output format
  if (/^#+\s*(output|result|expect)/im.test(commandContent)) {
    structureScore += 5;
  }

  // === SPECIFICITY (35 points) ===
  let specificityScore = 0;

  // Package manager
  const pm = projectContext.packageManager;
  const pmPattern = new RegExp(`\\b${pm}\\b`, 'g');
  const pmMatches = commandContent.match(pmPattern) || [];
  if (pmMatches.length > 0) {
    specificityScore += 10;
  } else {
    // Check if using wrong package manager
    const wrongPm = ['npm', 'yarn', 'pnpm', 'bun'].filter(p => p !== pm);
    const usesWrongPm = wrongPm.some(p => new RegExp(`\\b${p}\\s+(run|install|add)`, 'g').test(commandContent));
    if (usesWrongPm) {
      issues.push({ severity: 'critical', category: 'specificity', message: `Uses wrong package manager (should be ${pm})` });
    }
  }

  // References actual scripts
  const scripts = Object.keys(projectContext.packageJsonScripts || {});
  const scriptMentions = scripts.filter(s => commandContent.includes(s));
  specificityScore += Math.min(10, scriptMentions.length * 3);

  // References actual paths
  const pathPattern = /(?:\.\/)?(?:src|app|lib|tests?)\/[\w\/-]+/g;
  const pathMatches = commandContent.match(pathPattern) || [];
  const validPaths = pathMatches.filter(p =>
    projectContext.existingPaths.some(ep => ep.includes(p.replace('./', '')))
  );
  specificityScore += Math.min(10, validPaths.length * 2);

  // Config files
  const configFiles = ['tsconfig', 'eslint', 'prettier', 'vitest', 'jest', 'playwright'];
  const configMentions = configFiles.filter(c => commandContent.toLowerCase().includes(c));
  specificityScore += Math.min(5, configMentions.length * 2);

  // === USEFULNESS (30 points) ===
  let usefulnessScore = 0;

  // Commands are syntactically valid
  const commands = extractCommands(commandContent);
  const validCommands = commands.filter(cmd => isValidCommand(cmd));
  usefulnessScore += Math.min(10, (validCommands.length / Math.max(1, commands.length)) * 10);

  // Error handling
  if (/error|fail|if.*exit|catch|\|\||&&/i.test(commandContent)) {
    usefulnessScore += 5;
  } else {
    suggestions.push('Add error handling guidance (what to do if commands fail)');
  }

  // Success criteria
  if (/success|complete|done|✓|pass/i.test(commandContent)) {
    usefulnessScore += 5;
  }

  // Solves real problem (LLM placeholder)
  usefulnessScore += 10;

  // === PROFESSIONAL (15 points) ===
  let professionalScore = 0;

  // No placeholders
  const hasPlaceholders = /\{[A-Z_]+\}|\[FILL|\[TODO|YOUR_.*_HERE/.test(commandContent);
  if (!hasPlaceholders) {
    professionalScore += 5;
  } else {
    issues.push({ severity: 'critical', category: 'professional', message: 'Contains placeholders' });
  }

  // Safety check
  const dangerousPatterns = [
    /rm\s+-rf\s+[\/~]/,
    /sudo\s+rm/,
    /DROP\s+DATABASE/i,
    /DELETE\s+FROM\s+\w+\s*;?\s*$/i,  // DELETE without WHERE
  ];
  const hasDangerous = dangerousPatterns.some(p => p.test(commandContent));
  if (!hasDangerous) {
    professionalScore += 5;
  } else {
    issues.push({ severity: 'critical', category: 'professional', message: 'Contains potentially dangerous commands without safeguards' });
  }

  // Length
  if (commandContent.length >= 200 && commandContent.length <= 3000) {
    professionalScore += 5;
  }

  return {
    score: structureScore + specificityScore + usefulnessScore + professionalScore,
    breakdown: {
      structure: structureScore,
      specificity: specificityScore,
      usefulness: usefulnessScore,
      professional: professionalScore,
    },
    issues,
    suggestions,
    runnableCommands: commands.map(cmd => ({
      command: cmd,
      isValid: isValidCommand(cmd),
    })),
  };
}
