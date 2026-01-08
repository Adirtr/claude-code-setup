import type { DetectedProject } from '../types/index.js';

export function generateClaudeMd(detected: DetectedProject): string {
  const sections: string[] = [];

  // Header
  sections.push(generateHeader(detected));

  // Project Overview
  sections.push(generateProjectOverview(detected));

  // Tech Stack
  sections.push(generateTechStack(detected));

  // Architecture
  sections.push(generateArchitecture(detected));

  // Development Guidelines
  sections.push(generateGuidelines(detected));

  // Current Issues (if any)
  if (detected.buildErrors.length > 0) {
    sections.push(generateCurrentIssues(detected));
  }

  // Commands
  sections.push(generateCommands(detected));

  // Environment Variables
  sections.push(generateEnvironmentVariables(detected));

  return sections.join('\n\n---\n\n');
}

function generateHeader(detected: DetectedProject): string {
  return `# ${detected.projectName}

> ${detected.projectDescription || 'A modern web application'}`;
}

function generateProjectOverview(detected: DetectedProject): string {
  const type = detected.projectState === 'new' ? 'new project' : 'existing application';
  const purpose = detected.projectDescription || 'This is a web application';

  let overview = `## Project Overview

This is ${detected.projectState === 'new' ? 'a' : 'an'} ${type}`;

  if (detected.framework) {
    overview += ` built with ${detected.framework}`;
  }

  overview += `.

${purpose}`;

  if (detected.fileCount > 0) {
    overview += `

**Project Size:** ${detected.fileCount} source files`;
  }

  if (detected.projectState === 'existing') {
    overview += `
**Status:** Active development`;
  }

  return overview;
}

function generateTechStack(detected: DetectedProject): string {
  let stack = '## Tech Stack\n';

  // Frontend
  if (detected.framework && isFullStackOrFrontend(detected.framework)) {
    stack += `\n### Frontend\n`;
    stack += `- **Framework:** ${detected.framework}\n`;
    stack += `- **Language:** ${detected.language}\n`;
  }

  // Backend
  if (detected.framework && isBackend(detected.framework)) {
    stack += `\n### Backend\n`;
    stack += `- **Framework:** ${detected.framework}\n`;
    stack += `- **Language:** ${detected.language}\n`;
  } else if (!detected.framework) {
    stack += `\n### Language\n`;
    stack += `- ${detected.language}\n`;
  }

  // Database
  if (detected.database) {
    stack += `\n### Database\n`;
    const db = detected.database;
    if (db.type) stack += `- **Type:** ${db.type}\n`;
    if (db.provider) stack += `- **Provider:** ${db.provider}\n`;
    if (db.orm) stack += `- **ORM:** ${db.orm}\n`;
  }

  // Authentication
  if (detected.auth) {
    stack += `\n### Authentication\n`;
    stack += `- **Provider:** ${detected.auth.provider}\n`;
    if (detected.auth.methods.length > 0) {
      stack += `- **Methods:** ${detected.auth.methods.join(', ')}\n`;
    }
  }

  // External Integrations
  if (detected.externalApis.length > 0) {
    stack += `\n### External Integrations\n`;
    detected.externalApis.forEach(api => {
      stack += `- ${formatApiName(api)}\n`;
    });
  }

  // Testing
  if (detected.testing?.unit || detected.testing?.e2e) {
    stack += `\n### Testing\n`;
    if (detected.testing.unit) stack += `- **Unit Tests:** ${detected.testing.unit}\n`;
    if (detected.testing.e2e) stack += `- **E2E Tests:** ${detected.testing.e2e}\n`;
  }

  return stack;
}

function generateArchitecture(detected: DetectedProject): string {
  let arch = '## Architecture\n';

  // Multi-tenancy section
  if (detected.isMultiTenant && detected.tenantField) {
    arch += `\n### Multi-Tenancy\n\n`;
    arch += `**CRITICAL:** This is a multi-tenant application.\n\n`;
    arch += `- **Tenant Identifier:** \`${detected.tenantField}\`\n`;
    arch += `- **Isolation Strategy:** Row-level filtering\n\n`;
    arch += `**MANDATORY RULE:** All database queries that access user data MUST include a \`${detected.tenantField}\` filter.\n\n`;
    arch += `Example:\n\`\`\`typescript\n`;
    arch += `// ✅ CORRECT - With tenant filter\n`;
    arch += `const items = await db.items.findMany({\n`;
    arch += `  where: { ${detected.tenantField}: session.user.id }\n`;
    arch += `});\n\n`;
    arch += `// ❌ WRONG - No tenant filter (exposes all users' data!)\n`;
    arch += `const items = await db.items.findMany();\n`;
    arch += `\`\`\`\n`;
  }

  // Key principles
  arch += `\n### Key Principles\n\n`;

  if (detected.isMultiTenant) {
    arch += `1. **Data Isolation:** Every query must filter by \`${detected.tenantField}\`\n`;
  }

  arch += `${detected.isMultiTenant ? '2' : '1'}. **Type Safety:** Use TypeScript for all new code\n`;
  arch += `${detected.isMultiTenant ? '3' : '2'}. **Testing:** Write tests for all business logic\n`;
  arch += `${detected.isMultiTenant ? '4' : '3'}. **Security:** Never trust user input, always validate\n`;

  return arch;
}

function generateGuidelines(detected: DetectedProject): string {
  let guidelines = '## Development Guidelines\n';

  // Code conventions
  guidelines += `\n### Code Conventions\n\n`;
  if (detected.language === 'typescript') {
    guidelines += `- Use TypeScript for all new files\n`;
    guidelines += `- Enable strict mode in tsconfig.json\n`;
    guidelines += `- Use meaningful variable and function names\n`;
    guidelines += `- Prefer functional programming patterns where appropriate\n`;
  } else if (detected.language === 'javascript') {
    guidelines += `- Use modern JavaScript (ES6+)\n`;
    guidelines += `- Use const/let instead of var\n`;
    guidelines += `- Prefer arrow functions for callbacks\n`;
  }

  // Database rules
  if (detected.database) {
    guidelines += `\n### Database Rules\n\n`;
    guidelines += `- Use parameterized queries only (never string concatenation)\n`;

    if (detected.database.orm) {
      guidelines += `- Use ${detected.database.orm} for all database operations\n`;
    }

    if (detected.isMultiTenant) {
      guidelines += `- **CRITICAL:** Include \`${detected.tenantField}\` filter in ALL queries\n`;
      guidelines += `- Validate tenant access before any data operation\n`;
    }

    guidelines += `- Use transactions for operations that modify multiple records\n`;
  }

  // Security rules
  guidelines += `\n### Security Rules\n\n`;
  guidelines += `- Never commit secrets or API keys to the repository\n`;
  guidelines += `- Use environment variables for all sensitive configuration\n`;
  guidelines += `- Validate and sanitize all user input\n`;
  guidelines += `- Never log sensitive data (passwords, tokens, PII)\n`;

  if (detected.auth) {
    guidelines += `- Always verify authentication before accessing protected resources\n`;
  }

  if (detected.isMultiTenant) {
    guidelines += `- **CRITICAL:** Verify tenant ownership before data operations\n`;
  }

  // Testing standards
  if (detected.hasTests) {
    guidelines += `\n### Testing Standards\n\n`;
    guidelines += `- Test real behavior, not implementation details\n`;
    guidelines += `- Mock only: external APIs, time, randomness\n`;
    guidelines += `- DO NOT mock: internal services, database (use test database)\n`;
    guidelines += `- Aim for 80%+ coverage on critical paths\n`;
    guidelines += `- Write tests before fixing bugs (TDD for bug fixes)\n`;
  }

  return guidelines;
}

function generateCurrentIssues(detected: DetectedProject): string {
  let issues = '## Current Issues\n';

  if (detected.buildStatus === 'failing') {
    issues += `\n### Build Errors\n\n`;
    issues += `The project currently has ${detected.buildErrors.length} build error(s):\n\n`;

    detected.buildErrors.slice(0, 5).forEach((error, index) => {
      issues += `${index + 1}. ${error}\n`;
    });

    if (detected.buildErrors.length > 5) {
      issues += `\n...and ${detected.buildErrors.length - 5} more errors.\n`;
    }

    issues += `\n**Priority:** Fix these build errors before adding new features.\n`;
  }

  return issues;
}

function generateCommands(detected: DetectedProject): string {
  const pm = detected.packageManager || 'npm';

  let commands = '## Commands\n';

  commands += `\n### Development\n\n`;
  commands += `- \`${pm} ${pm === 'npm' ? 'run ' : ''}dev\` - Start development server\n`;
  commands += `- \`${pm} ${pm === 'npm' ? 'run ' : ''}build\` - Build for production\n`;

  if (detected.hasTests) {
    commands += `- \`${pm} test\` - Run tests\n`;
  }

  if (detected.language === 'typescript') {
    commands += `- \`${pm} ${pm === 'npm' ? 'run ' : ''}typecheck\` - Check TypeScript types\n`;
  }

  commands += `\n### Quality\n\n`;
  commands += `- \`${pm} ${pm === 'npm' ? 'run ' : ''}lint\` - Lint code\n`;
  commands += `- \`${pm} ${pm === 'npm' ? 'run ' : ''}format\` - Format code\n`;

  return commands;
}

function generateEnvironmentVariables(detected: DetectedProject): string {
  let envVars = '## Environment Variables\n\n';
  envVars += 'Create a `.env` file in the project root with the following variables:\n\n';
  envVars += '### Required\n\n';

  const requiredVars: string[] = [];

  // Database
  if (detected.database) {
    if (detected.database.provider === 'supabase') {
      requiredVars.push('`SUPABASE_URL` - Your Supabase project URL');
      requiredVars.push('`SUPABASE_ANON_KEY` - Your Supabase anon/public key');
    } else if (detected.database.type === 'postgresql') {
      requiredVars.push('`DATABASE_URL` - PostgreSQL connection string');
    } else if (detected.database.type === 'mongodb') {
      requiredVars.push('`MONGODB_URI` - MongoDB connection string');
    }
  }

  // Auth
  if (detected.auth) {
    if (detected.auth.provider === 'clerk') {
      requiredVars.push('`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key');
      requiredVars.push('`CLERK_SECRET_KEY` - Clerk secret key');
    } else if (detected.auth.provider === 'nextauth') {
      requiredVars.push('`NEXTAUTH_URL` - Your application URL');
      requiredVars.push('`NEXTAUTH_SECRET` - NextAuth secret key');
    }
  }

  // External APIs
  detected.externalApis.forEach(api => {
    if (api === 'openai') {
      requiredVars.push('`OPENAI_API_KEY` - OpenAI API key');
    } else if (api === 'anthropic') {
      requiredVars.push('`ANTHROPIC_API_KEY` - Anthropic API key');
    } else if (api === 'stripe') {
      requiredVars.push('`STRIPE_SECRET_KEY` - Stripe secret key');
      requiredVars.push('`STRIPE_PUBLISHABLE_KEY` - Stripe publishable key');
    }
  });

  if (requiredVars.length === 0) {
    envVars += 'No environment variables detected. Add them as needed.\n';
  } else {
    requiredVars.forEach(varDesc => {
      envVars += `- ${varDesc}\n`;
    });
  }

  envVars += '\n### Optional\n\n';
  envVars += '- `NODE_ENV` - Environment (development, production)\n';

  if (detected.cicd) {
    envVars += '- `CI` - Set to true in CI/CD environment\n';
  }

  return envVars;
}

// Helper functions

function isFullStackOrFrontend(framework: string): boolean {
  const frontend = ['Next.js', 'React', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'SvelteKit', 'Astro', 'Remix', 'SolidJS', 'Solid Start', 'Qwik', 'Gatsby'];
  return frontend.includes(framework);
}

function isBackend(framework: string): boolean {
  const backend = ['Express', 'Fastify', 'Hono', 'Koa', 'NestJS'];
  return backend.includes(framework);
}

function formatApiName(api: string): string {
  const names: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic (Claude)',
    'stripe': 'Stripe',
    'google-sheets': 'Google Sheets',
    'google-drive': 'Google Drive',
    'gmail': 'Gmail',
    'sendgrid': 'SendGrid',
    'resend': 'Resend',
    'twilio': 'Twilio',
    'aws-s3': 'AWS S3',
    'aws-ses': 'AWS SES',
    'github-api': 'GitHub API',
  };
  return names[api] || api;
}
