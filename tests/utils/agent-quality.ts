import type { AgentQualityResult, QualityIssue, ProjectContext } from '../types.js';

export async function assessAgentQuality(
  agentContent: string,
  projectContext: ProjectContext
): Promise<AgentQualityResult> {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];

  // === STRUCTURE (25 points) ===
  let structureScore = 0;

  // Frontmatter check
  const frontmatterMatch = agentContent.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    if (frontmatter.includes('name:')) structureScore += 2;
    else issues.push({ severity: 'critical', category: 'structure', message: 'Missing name in frontmatter' });

    if (frontmatter.includes('description:')) structureScore += 2;
    else issues.push({ severity: 'major', category: 'structure', message: 'Missing description in frontmatter' });

    if (frontmatter.includes('model:')) structureScore += 1;
  } else {
    issues.push({ severity: 'critical', category: 'structure', message: 'Missing frontmatter block' });
  }

  // Role definition
  if (/^#+ .*(role|agent|purpose)/im.test(agentContent)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'major', category: 'structure', message: 'No clear role definition section' });
  }

  // When to activate
  if (/^#+ .*(when|trigger|activate|use this)/im.test(agentContent)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'structure', message: 'No "when to use" section' });
    suggestions.push('Add a section explaining when this agent should be activated');
  }

  // Process section
  if (/^#+ .*(process|steps|workflow|procedure)/im.test(agentContent) ||
      /^\d+\.\s+/m.test(agentContent)) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'major', category: 'structure', message: 'No clear process/steps section' });
  }

  // Output format
  if (/^#+ .*(output|format|result)/im.test(agentContent) ||
      agentContent.includes('```')) {
    structureScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'structure', message: 'No output format defined' });
  }

  // === SPECIFICITY (35 points) ===
  let specificityScore = 0;

  // Project name
  if (agentContent.toLowerCase().includes(projectContext.name.toLowerCase())) {
    specificityScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'specificity', message: 'Does not mention project name' });
  }

  // Tech stack references
  const techMentions = projectContext.techStack.filter(tech =>
    agentContent.toLowerCase().includes(tech.toLowerCase())
  );
  specificityScore += Math.min(10, techMentions.length * 3);
  if (techMentions.length < 2) {
    issues.push({ severity: 'major', category: 'specificity', message: `Only mentions ${techMentions.length} tech stack items` });
    suggestions.push(`Reference more of the detected stack: ${projectContext.techStack.join(', ')}`);
  }

  // File path references
  const pathPattern = /(?:\/[\w-]+)+\.\w+|['"`](?:src|app|lib|components)\/[\w\/.-]+['"`]/g;
  const pathMatches = agentContent.match(pathPattern) || [];
  const validPaths = pathMatches.filter(p => projectContext.existingPaths.some(ep => p.includes(ep)));
  specificityScore += Math.min(10, validPaths.length * 2);
  if (validPaths.length === 0) {
    issues.push({ severity: 'major', category: 'specificity', message: 'No references to actual project paths' });
  }

  // Pattern references (tenant field, APIs, etc.)
  if (projectContext.tenantField && agentContent.includes(projectContext.tenantField)) {
    specificityScore += 5;
  }
  const apiMentions = projectContext.externalApis.filter(api =>
    agentContent.toLowerCase().includes(api.toLowerCase())
  );
  specificityScore += Math.min(5, apiMentions.length * 2);

  // === ACTIONABILITY (25 points) ===
  let actionabilityScore = 0;

  // Code examples
  const codeBlocks = (agentContent.match(/```[\s\S]*?```/g) || []).length;
  actionabilityScore += Math.min(5, codeBlocks * 2);
  if (codeBlocks === 0) {
    suggestions.push('Add code examples showing good vs bad patterns');
  }

  // Success criteria / checklist
  if (/\[[ x]\]/i.test(agentContent) || /^#+ .*(criteria|checklist|done|complete)/im.test(agentContent)) {
    actionabilityScore += 5;
  } else {
    suggestions.push('Add a checklist or success criteria section');
  }

  // Edge cases
  if (/error|edge case|exception|fail|invalid/i.test(agentContent)) {
    actionabilityScore += 5;
  } else {
    issues.push({ severity: 'minor', category: 'actionability', message: 'Does not mention error handling or edge cases' });
  }

  // Specific instructions (assessed via LLM - placeholder for now)
  // This would be filled by LLM-as-Judge
  actionabilityScore += 10; // Placeholder - adjusted by LLM

  // === PROFESSIONAL QUALITY (15 points) ===
  let professionalScore = 0;

  // No placeholders
  const placeholders = [
    /\{[A-Z_]+\}/g,
    /\[FILL.*?\]/gi,
    /\[TODO.*?\]/gi,
    /YOUR_.*?_HERE/gi,
    /REPLACE_.*?/gi,
  ];
  const hasPlaceholders = placeholders.some(p => p.test(agentContent));
  if (!hasPlaceholders) {
    professionalScore += 5;
  } else {
    issues.push({ severity: 'critical', category: 'professional', message: 'Contains placeholder text' });
  }

  // Valid markdown - basic check
  professionalScore += 3;

  // Length check
  if (agentContent.length >= 500 && agentContent.length <= 5000) {
    professionalScore += 3;
  } else if (agentContent.length < 500) {
    issues.push({ severity: 'major', category: 'professional', message: 'Agent too short - likely missing important details' });
  } else {
    issues.push({ severity: 'minor', category: 'professional', message: 'Agent very long - may need trimming' });
  }

  // Consistency (placeholder for LLM check)
  professionalScore += 4;

  return {
    score: structureScore + specificityScore + actionabilityScore + professionalScore,
    breakdown: {
      structure: structureScore,
      specificity: specificityScore,
      actionability: actionabilityScore,
      professional: professionalScore,
    },
    issues,
    suggestions,
  };
}
