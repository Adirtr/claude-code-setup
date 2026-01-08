import type { DetectedProject, CommandDefinition } from '../types/index.js';

export function generateCommandFile(command: CommandDefinition, project: DetectedProject): string {
  switch (command.id) {
    case 'pre-commit':
      return generatePreCommit(project);
    case 'security-scan':
      return generateSecurityScan(project);
    case 'fix-build':
      return generateFixBuild(project);
    case 'tenant-check':
      return generateTenantCheck(project);
    case 'test-review':
      return generateTestReview(project);
    default:
      return generateGenericCommand(command);
  }
}

function generatePreCommit(project: DetectedProject): string {
  const pm = project.packageManager || 'npm';
  const pmRun = pm === 'npm' ? 'npm run ' : `${pm} `;

  return `Run comprehensive pre-commit quality checks on **${project.projectName}** before committing code.

## Description

This command runs all quality checks that should pass before committing code to the repository. It ensures code quality, formatting consistency, type safety, and test stability.

## When to Use

- Before creating a commit
- During code review to verify PR readiness
- After making changes to verify nothing broke
- As part of a git pre-commit hook

## What This Checks

1. **Type Safety**${project.language === 'typescript' ? ' - TypeScript compilation and type checking' : ' - Skip if not TypeScript'}
2. **Code Quality** - ESLint rules and best practices
3. **Code Formatting** - Prettier consistency
4. **Test Coverage** - Unit tests for changed code
${project.framework === 'Next.js' ? '5. **Next.js Build** - Verify no build-time errors\n' : ''}
## Step-by-Step Process

### Step 1: Type Check
${project.language === 'typescript' ? `\`\`\`bash
${pmRun}typecheck
\`\`\`

This runs the TypeScript compiler in check mode. If this fails, you'll see:
- Type errors with file:line:column locations
- Missing type definitions
- Type incompatibilities

**Fix approach:** Address each error individually, starting with the file you modified.` : `\`\`\`bash
# Skip - project uses ${project.language}
\`\`\`
`}
### Step 2: Lint Check

\`\`\`bash
${pmRun}lint
\`\`\`

Runs ESLint to check for:
- Code style violations
- Potential bugs (unused vars, etc.)
- Best practice violations
- Import order issues

**Fix approach:** Run \`${pmRun}lint --fix\` to auto-fix most issues.

### Step 3: Format Check

\`\`\`bash
${pmRun}format:check || ${pm} prettier --check .
\`\`\`

Checks if code is formatted according to Prettier rules.

**Fix approach:** Run \`${pmRun}format\` or \`${pm} prettier --write .\` to format all files.

### Step 4: Run Tests

\`\`\`bash
${pmRun}test${project.testing?.unit === 'vitest' ? ' --changed' : ''}
\`\`\`

Runs ${project.testing?.unit || 'unit tests'}${project.testing?.unit === 'vitest' ? ' for changed files only (faster)' : ' for the entire project'}.

**Fix approach:** If tests fail:
1. Review the failing test output
2. Verify your changes didn't break expected behavior
3. Update tests if behavior intentionally changed
4. Fix bugs if tests caught a regression

## Success Criteria

All of these must pass:

- [ ] TypeScript compiles without errors
- [ ] ESLint shows no violations
- [ ] Prettier reports all files formatted correctly
- [ ] All unit tests pass
- [ ] No console errors or warnings

## Common Issues and Fixes

### Issue: "Cannot find module" error

**Cause:** Missing import or incorrect path
**Fix:** Verify import path is correct, check if file exists

### Issue: ESLint "no-unused-vars" error

**Cause:** Variable declared but never used
**Fix:** Remove unused variable or prefix with \`_\` if intentionally unused

### Issue: Prettier formatting conflicts

**Cause:** Editor auto-format using different rules
**Fix:** Configure editor to use project's Prettier config

### Issue: Tests fail after changes

**Cause:** Breaking change or test needs update
**Fix:** Review test expectations, update if change is intentional

${project.framework === 'Next.js' ? `### Issue: "Cannot use import outside module"

**Cause:** Next.js server/client component mismatch
**Fix:** Add \`'use client'\` directive or move to server component

` : ''}## Output Format

### ✅ Success Output

\`\`\`
✅ TypeScript: No errors
✅ ESLint: No violations
✅ Prettier: All files formatted
✅ Tests: ${project.testing?.unit === 'vitest' ? '24 passed' : 'All passed'}

All checks passed - safe to commit!
\`\`\`

### ❌ Failure Output

\`\`\`
❌ TypeScript: 3 errors found
  src/utils/helpers.ts:45:12 - Type 'string' is not assignable to type 'number'

❌ ESLint: 2 violations
  src/components/Button.tsx:12 - 'onClick' is defined but never used

✅ Prettier: All files formatted
✅ Tests: All passed

Fix the errors above before committing.

Quick fixes:
  ${pmRun}lint --fix  # Auto-fix ESLint issues
  ${pmRun}format      # Auto-format with Prettier
\`\`\`

## Integration with Git Hooks

Add to \`.husky/pre-commit\` or \`package.json\`:

\`\`\`json
{
  "husky": {
    "hooks": {
      "pre-commit": "${pm === 'npm' ? 'npm run' : pm} typecheck && ${pm === 'npm' ? 'npm run' : pm} lint && ${pm === 'npm' ? 'npm run' : pm} test"
    }
  }
}
\`\`\``;
}

function generateSecurityScan(project: DetectedProject): string {
  const pm = project.packageManager || 'npm';
  const pmRun = pm === 'npm' ? 'npm run ' : `${pm} `;

  return `Run a comprehensive security vulnerability scan on **${project.projectName}** to identify potential security issues.

## Description

This command performs automated and manual security checks to identify vulnerabilities, exposed secrets, insecure configurations, and security anti-patterns in the codebase.

## When to Use

- Before deploying to production
- After adding new dependencies
- During security audits or penetration testing
- When investigating a potential security incident
- As part of CI/CD security gates

## What This Scans

1. **Dependency Vulnerabilities** - Known CVEs in npm packages
2. **Hardcoded Secrets** - API keys, tokens, passwords in code
3. **Environment Exposure** - Env vars leaked to client-side
4. **Security Anti-Patterns** - Common OWASP Top 10 violations
${project.isMultiTenant ? `5. **Tenant Isolation** - Missing \`${project.tenantField}\` filters in queries\n` : ''}${project.auth ? `6. **Authentication Security** - Auth bypass opportunities\n` : ''}${project.database ? `7. **SQL Injection** - Unsafe query construction\n` : ''}
## Step-by-Step Process

### Step 1: Dependency Vulnerability Scan

\`\`\`bash
${pm} audit
\`\`\`

This checks all dependencies against the npm vulnerability database.

**What to look for:**
- High or Critical severity vulnerabilities
- Vulnerabilities in direct dependencies (easier to fix)
- Available patches or updates

**Fix approach:**
\`\`\`bash
# See detailed report
${pm} audit --json

# Auto-fix if possible
${pm} audit fix

# For unfixable issues, evaluate risk vs benefit
\`\`\`

### Step 2: Search for Hardcoded Secrets

\`\`\`bash
# Search for common secret patterns
grep -r "api[_-]key" --include="*.ts" --include="*.js" .
grep -r "password.*=.*['\\\"]" --include="*.ts" --include="*.js" .
grep -r "Bearer [A-Za-z0-9]" --include="*.ts" --include="*.js" .
grep -r "-----BEGIN.*KEY-----" --include="*.ts" --include="*.js" --include="*.pem" .
\`\`\`

**Red flags:**
- API keys directly in code: \`const API_KEY = "sk_live_..."\`
- Passwords in config: \`password: "mypassword123"\`
- JWT tokens hardcoded
- Private keys committed to repo

**Fix approach:** Move all secrets to environment variables

\`\`\`typescript
// ❌ WRONG - Hardcoded secret
const apiKey = "sk_live_abc123";

// ✅ CORRECT - From environment
const apiKey = process.env.STRIPE_API_KEY;
if (!apiKey) throw new Error("STRIPE_API_KEY not set");
\`\`\`

### Step 3: Check for Environment Variable Exposure

${project.framework === 'Next.js' ? `For Next.js, verify that sensitive env vars are NOT prefixed with \`NEXT_PUBLIC_\`:

\`\`\`bash
# Check .env files for public exposure
grep "NEXT_PUBLIC" .env .env.local 2>/dev/null
\`\`\`

**Red flags:**
- \`NEXT_PUBLIC_DATABASE_URL\` - Database credentials exposed to client
- \`NEXT_PUBLIC_API_SECRET\` - Secret keys in client bundle
- \`NEXT_PUBLIC_STRIPE_SECRET_KEY\` - Payment secrets exposed

**Fix approach:** Remove \`NEXT_PUBLIC_\` prefix for server-only secrets.` : `Check that sensitive env vars are only used server-side:

\`\`\`bash
# Look for env vars used in client code
grep -r "process.env" src/components src/pages --include="*.tsx" --include="*.jsx"
\`\`\`

**Fix approach:** Only access env vars in server-side code (API routes, server actions).`}

### Step 4: Scan for Security Anti-Patterns

${project.database?.orm === 'Prisma' ? `#### Check for SQL Injection via raw queries

\`\`\`bash
# Find raw SQL queries
grep -r "prisma.\\$executeRaw\\|prisma.\\$queryRaw" --include="*.ts" .
\`\`\`

**Red flags:**
\`\`\`typescript
// ❌ WRONG - SQL injection vulnerable
const email = req.body.email;
await prisma.$executeRaw\`SELECT * FROM users WHERE email = '\${email}'\`;

// ✅ CORRECT - Parameterized query
await prisma.$executeRaw\`SELECT * FROM users WHERE email = \${email}\`;
\`\`\`
` : project.database?.type === 'PostgreSQL' ? `#### Check for SQL Injection

\`\`\`bash
# Find raw SQL queries
grep -r "query(" --include="*.ts" .
\`\`\`

**Red flags:**
\`\`\`typescript
// ❌ WRONG - SQL injection vulnerable
const query = \`SELECT * FROM users WHERE email = '\${email}'\`;

// ✅ CORRECT - Parameterized query
const query = {
  text: 'SELECT * FROM users WHERE email = $1',
  values: [email]
};
\`\`\`
` : ''}
#### Check for XSS vulnerabilities

\`\`\`bash
# Find dangerous HTML rendering
grep -r "dangerouslySetInnerHTML\\|innerHTML" --include="*.tsx" --include="*.jsx" .
\`\`\`

**Red flags:**
- Rendering user input as HTML without sanitization
- Using \`dangerouslySetInnerHTML\` with unescaped data

**Fix approach:** Use safe rendering or sanitize with DOMPurify

#### Check for Authentication Bypass

\`\`\`bash
# Find routes that might skip auth
grep -r "// TODO.*auth\\|// FIXME.*auth\\|skip.*auth" --include="*.ts" .
\`\`\`

${project.isMultiTenant ? `### Step 5: Tenant Isolation Verification

\`\`\`bash
# Find database queries that might miss tenant filter
grep -r "findMany\\|findFirst\\|findUnique" --include="*.ts" .
\`\`\`

**Critical check:** Every query accessing tenant data MUST include \`${project.tenantField}\` filter.

**Red flags:**
\`\`\`typescript
// ❌ CRITICAL - Cross-tenant data leak!
const orders = await db.order.findMany();

// ✅ CORRECT - Properly isolated
const orders = await db.order.findMany({
  where: { ${project.tenantField}: session.user.id }
});
\`\`\`

See the \`tenant-check\` command for detailed tenant isolation analysis.
` : ''}
## Manual Security Checklist

Review these manually:

- [ ] No API keys or secrets in code
- [ ] No passwords in configuration files
- [ ] Private keys not committed to repo
- [ ] Debug/verbose logging disabled in production code
${project.isMultiTenant ? `- [ ] All tenant queries include \`${project.tenantField}\` filter\n` : ''}- [ ] Environment variables used correctly (server vs client)
- [ ] User input is validated and sanitized
- [ ] Authentication required on protected routes
${project.auth?.provider ? `- [ ] ${project.auth.provider} authentication properly configured\n` : ''}- [ ] CORS configured restrictively
- [ ] Rate limiting enabled on API endpoints
${project.database ? `- [ ] Database queries use parameterized statements\n` : ''}- [ ] File uploads restricted by type and size

## Error Handling

### If \`${pm} audit\` fails:

1. Review the vulnerability report carefully
2. Check if a patch is available: \`${pm} audit fix\`
3. If no fix available:
   - Evaluate the risk level (CVSS score)
   - Check if the vulnerable code path is actually used
   - Consider alternative packages
   - Document accepted risk if you proceed

### If secrets are found:

1. **DO NOT** just delete them from the current commit
2. Rotate the compromised secrets immediately
3. Use \`git filter-branch\` or BFG Repo-Cleaner to remove from history
4. Update all places using the secret to use env vars

### If tenant isolation issues found:

1. This is CRITICAL - can lead to data breaches
2. Fix immediately before deploying
3. Audit recent deployments to check if exploited
4. Add tests to prevent regression

## Output Format

### Security Scan Report

#### 🔴 CRITICAL Issues

${project.isMultiTenant ? `- Missing tenant filter in \`src/api/orders.ts:45\`
  \`\`\`
  Risk: Cross-tenant data exposure
  Fix: Add where: { ${project.tenantField}: session.user.id }
  \`\`\`
` : ''}
#### 🟠 HIGH Severity Issues

- Hardcoded API key in \`src/config/stripe.ts:12\`
  \`\`\`
  const STRIPE_KEY = "sk_live_abc123"; // EXPOSED SECRET!
  \`\`\`
  **Fix:** Move to environment variable

#### 🟡 MEDIUM Severity Issues

- 3 dependency vulnerabilities (${pm} audit)
  - \`lodash@4.17.15\` - Prototype Pollution (CVE-2020-8203)
  - Update available: 4.17.21

#### 🟢 LOW / Informational

- Debug logging enabled in production code

#### ✅ Passed Checks

- No SQL injection vulnerabilities detected
- Authentication properly configured on all routes
- CORS settings restrictive

#### Summary

- **Critical:** 1 (FIX IMMEDIATELY)
- **High:** 1 (Fix before deploy)
- **Medium:** 3 (Fix soon)
- **Low:** 1 (Nice to fix)

**Recommendation:** ${project.isMultiTenant ? 'Address tenant isolation issue before any deployment.' : 'Fix high severity issues before production deployment.'}

## Integration with CI/CD

Add to your CI pipeline:

\`\`\`yaml
# .github/workflows/security.yml
- name: Security Scan
  run: |
    ${pm} audit --audit-level=high
    # Add secret scanning tool
    # Add SAST tool like Semgrep
\`\`\``;
}

function generateFixBuild(project: DetectedProject): string {
  const pm = project.packageManager || 'npm';
  const pmRun = pm === 'npm' ? 'npm run ' : `${pm} `;

  return `Diagnose and systematically fix build failures in **${project.projectName}**.

## Description

This command helps identify the root cause of build failures and provides a structured approach to fixing them. It's designed to handle ${project.framework || project.language} build errors efficiently.

## When to Use

- Build is failing and you need to identify the cause
- After merging changes that broke the build
- When upgrading dependencies or framework versions
- Setting up the project in a new environment
- Debugging CI/CD build failures

## Known Build Issues in This Project

${project.buildErrors.length > 0 ? `The project detector identified these potential issues:\n\n${project.buildErrors.slice(0, 5).map((error, i) => `${i + 1}. ${error}`).join('\n')}

These were found during initial project analysis and may need attention.` : 'No build errors currently detected during project setup.'}

## Step-by-Step Diagnostic Process

### Step 1: Capture Full Build Output

\`\`\`bash
${pmRun}build 2>&1 | tee build-error.log
\`\`\`

This captures both stdout and stderr to a file for analysis.

**What to look for:**
- First error (subsequent errors often cascade from it)
- File path and line number
- Error code (TS2304, TS2345, etc.)
- Stack trace if runtime error

### Step 2: Categorize the Error

Common error types:

#### TypeScript Type Errors
${project.language === 'typescript' ? `
**Pattern:** \`TS####\` error codes

\`\`\`
src/utils/helpers.ts(45,12): error TS2304: Cannot find name 'Request'.
\`\`\`

**Common causes:**
- Missing type definition: \`${pm} install --save-dev @types/node\`
- Wrong import path
- Type mismatch after dependency update

**Fix approach:**
1. Check if type definition package needed
2. Verify import statement correct
3. Check tsconfig.json settings` : `
**Not applicable** - Project uses ${project.language}`}

#### Missing Dependencies

**Pattern:** "Cannot find module"

\`\`\`
Error: Cannot find module 'zod'
\`\`\`

**Fix approach:**
\`\`\`bash
${pm} install zod
\`\`\`

#### Import/Export Errors

**Pattern:** "has no exported member" or "Module not found"

\`\`\`
Module '"./config"' has no exported member 'database'
\`\`\`

**Fix approach:**
1. Check if export exists in the file
2. Verify import path (relative vs absolute)
3. Check file extension requirements

${project.framework === 'Next.js' ? `#### Next.js Specific Errors

**Server/Client Component Issues:**

\`\`\`
Error: You're importing a component that needs useState...
\`\`\`

**Fix:** Add \`'use client'\` directive at top of file

**Server Action Errors:**

\`\`\`
Error: Functions cannot be passed directly to Client Components
\`\`\`

**Fix:** Use \`'use server'\` directive or move function to API route

**Environment Variable Issues:**

\`\`\`
Error: process.env.DATABASE_URL is undefined
\`\`\`

**Fix:**
1. Check \`.env.local\` has the variable
2. Restart dev server to pick up changes
3. For build, ensure env vars in deployment platform
` : ''}
#### Configuration Errors

**Pattern:** Issues with config files

\`\`\`
Error: Invalid configuration object
\`\`\`

**Fix approach:**
1. Validate config syntax (JSON/JS)
2. Check for typos in field names
3. Verify config version matches framework version

### Step 3: Apply Targeted Fixes

For each error identified:

1. **Understand the root cause** - Don't just silence the error
2. **Apply the minimal fix** - Don't refactor unrelated code
3. **Test the fix in isolation** - Run build after each fix
4. **Document** if the error was non-obvious

### Step 4: Verify Fix

\`\`\`bash
# Full build
${pmRun}build

# Type check only (faster for TS errors)
${project.language === 'typescript' ? `${pmRun}typecheck` : '# Not applicable'}
\`\`\`

**Success criteria:**
- Build completes without errors
- No new warnings introduced
- Output bundle created successfully

## Common Build Errors and Solutions

### Error: "Cannot find module"

**Cause:** Missing dependency or wrong import path

**Fix:**
\`\`\`bash
# Install missing package
${pm} install <package-name>

# Or fix import path
# Before: import { foo } from './config'
# After:  import { foo } from './config.ts'
\`\`\`

${project.language === 'typescript' ? `### Error: "Type 'X' is not assignable to type 'Y'"

**Cause:** Type mismatch

**Fix options:**
1. Fix the actual type: \`const value: number = parseInt(str)\`
2. Add type assertion if you're certain: \`value as ExpectedType\`
3. Update the type definition if it's wrong
` : ''}
### Error: "Module not found: Can't resolve 'X'"

**Cause:** Webpack/bundler can't find the module

**Fix:**
1. Check spelling and case of import
2. Verify file exists at that path
3. Clear cache: \`rm -rf .next\` ${project.framework === 'Next.js' ? '(Next.js)' : ''}
4. Check path aliases in config

### Error: "Unexpected token"

**Cause:** Syntax error or unsupported syntax

**Fix:**
1. Check for missing brackets/braces
2. Verify file is being processed by correct loader
3. Check Babel/TypeScript config for syntax support

${project.database?.orm === 'Prisma' ? `### Error: "Prisma Client not generated"

**Cause:** \`@prisma/client\` out of sync with schema

**Fix:**
\`\`\`bash
${pm} prisma generate
${pmRun}build
\`\`\`
` : ''}
### Error: "Out of memory"

**Cause:** Build process using too much RAM

**Fix:**
\`\`\`bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" ${pmRun}build
\`\`\`

## Edge Cases and Tricky Issues

### Circular Dependencies

**Symptom:** Build hangs or "Maximum call stack size exceeded"

**Fix:**
1. Find circular imports: Look for A imports B, B imports C, C imports A
2. Extract shared types to separate file
3. Use dynamic imports for lazy loading

### Stale Cache

**Symptom:** Build fails but error doesn't make sense

**Fix:**
\`\`\`bash
# Clear all caches
rm -rf node_modules ${project.framework === 'Next.js' ? '.next' : ''} dist
${pm} install
${pmRun}build
\`\`\`

### Environment-Specific Failures

**Symptom:** Build works locally but fails in CI/CD

**Fix:**
1. Check Node version matches: \`.nvmrc\` or \`package.json#engines\`
2. Verify env vars are set in CI
3. Check for OS-specific path issues (Windows vs Linux)

## Output Format

### Build Fix Report

#### ❌ Errors Found

| # | Error | File | Root Cause | Fix Applied |
|---|-------|------|------------|-------------|
| 1 | TS2304: Cannot find name 'Request' | src/api/users.ts:12 | Missing @types/node | Installed @types/node@20.10.0 |
| 2 | Module not found: 'zod' | src/schemas/user.ts:1 | Missing dependency | Installed zod@3.22.4 |

#### ✅ Fixes Applied

1. **Installed missing dependencies**
   \`\`\`bash
   ${pm} install @types/node zod
   \`\`\`

2. **Fixed import path**
   \`\`\`diff
   - import { config } from './config'
   + import { config } from './config.js'
   \`\`\`

3. **Added 'use client' directive**
   \`\`\`typescript
   'use client'

   import { useState } from 'react'
   \`\`\`

#### 🏗️ Build Status

\`\`\`
✅ Build successful!

Output:
  ${project.framework === 'Next.js' ? '.next/' : 'dist/'}

Build time: 12.3s
Bundle size: 245 KB
\`\`\`

#### 📋 Summary

- Errors fixed: 3
- Dependencies installed: 2
- Files modified: 2
- Build time: 12.3s
- Status: ✅ Ready for deployment

## Prevention Tips

Add these checks to prevent future build failures:

1. **Type check before commit**
   \`\`\`json
   "scripts": {
     "precommit": "${pmRun}typecheck && ${pmRun}lint"
   }
   \`\`\`

2. **Lock dependency versions**
   - Commit \`${pm === 'pnpm' ? 'pnpm-lock.yaml' : pm === 'yarn' ? 'yarn.lock' : 'package-lock.json'}\`
   - Use exact versions for critical packages

3. **Test builds locally before pushing**
   \`\`\`bash
   ${pmRun}build && ${pmRun}start
   \`\`\`

4. **Keep dependencies updated regularly**
   \`\`\`bash
   ${pm === 'pnpm' ? 'pnpm update --latest' : pm === 'yarn' ? 'yarn upgrade-interactive' : 'npm update'}
   \`\`\``;
}

function generateTenantCheck(project: DetectedProject): string {
  const tenantField = project.tenantField || 'user_id';
  const orm = project.database?.orm;

  return `Verify tenant data isolation in **${project.projectName}** database queries to prevent cross-tenant data leaks.

## Description

This command performs a critical security audit of all database queries to ensure proper multi-tenant data isolation. **Every query accessing tenant data MUST filter by \`${tenantField}\`** to prevent users from accessing other tenants' data.

## When to Use

- Before deploying any database query changes
- During security audits
- After adding new API endpoints
- When debugging data access issues
- As part of code review for PRs touching database code

## Tenant Configuration

- **Tenant Field:** \`${tenantField}\`
- **Database:** ${project.database?.type || 'Unknown'}${orm ? `\n- **ORM:** ${orm}` : ''}
- **Multi-Tenant:** ${project.isMultiTenant === true ? 'Yes' : project.isMultiTenant === 'maybe' ? 'Uncertain (verify manually)' : 'No'}

${!project.isMultiTenant ? `⚠️ **Note:** This project may not be multi-tenant. If it is, update the configuration to specify the tenant isolation field.` : ''}

## Step-by-Step Verification Process

### Step 1: Find All Database Query Files

${orm === 'Prisma' ? `\`\`\`bash
# Find all files with Prisma queries
grep -r "prisma\\." --include="*.ts" --include="*.js" src/
\`\`\`

Look for files containing:
- \`prisma.findMany()\`
- \`prisma.findFirst()\`
- \`prisma.findUnique()\`
- \`prisma.update()\`
- \`prisma.delete()\`
- \`prisma.updateMany()\`
- \`prisma.deleteMany()\`
\`\`\`` : orm === 'Drizzle' ? `\`\`\`bash
# Find all files with Drizzle queries
grep -r "db\\.select\\|db\\.insert\\|db\\.update\\|db\\.delete" --include="*.ts" src/
\`\`\`
` : `\`\`\`bash
# Find all files with database queries
grep -r "SELECT\\|INSERT\\|UPDATE\\|DELETE" --include="*.ts" --include="*.sql" src/
\`\`\`
`}

**Common locations:**
- \`src/app/api/**/*.ts\` - API route handlers
${project.framework === 'Next.js' ? `- \`src/app/**/actions.ts\` - Server actions\n` : ''}- \`src/lib/db/**/*.ts\` - Database service files
- \`src/repositories/**/*.ts\` - Repository pattern files
- \`src/models/**/*.ts\` - Model definitions

### Step 2: Analyze Each Query for Tenant Filter

For each database query found, verify:

1. **Does this query access tenant-specific data?**
   - If YES → Must include \`${tenantField}\` filter
   - If NO (global/system data) → Can skip filter

2. **Is the tenant filter present?**
   - Check \`where\` clause includes \`${tenantField}\`
   - Verify it's not optional or bypassable

3. **Where does the tenant ID come from?**
   - ✅ From authenticated session: \`session.user.id\`
   - ❌ From request body: \`req.body.${tenantField}\`
   - ❌ From query params: \`req.query.${tenantField}\`

### Step 3: Flag Violations

Mark queries as violations if:

- **CRITICAL:** No tenant filter on tenant data (data leak!)
- **HIGH:** Tenant ID from user input (can be manipulated)
- **MEDIUM:** Optional filter (can be bypassed)
- **LOW:** Filter after fetch (inefficient, potential leak)

## Code Examples

### ✅ CORRECT Examples

${orm === 'Prisma' ? `#### Proper Tenant Isolation with Prisma

\`\`\`typescript
// ✅ Get current user's orders only
export async function getUserOrders(session: Session) {
  return await prisma.order.findMany({
    where: {
      ${tenantField}: session.user.id // Tenant filter from session
    }
  });
}

// ✅ Get specific order with tenant check
export async function getOrder(orderId: string, session: Session) {
  return await prisma.order.findFirst({
    where: {
      id: orderId,
      ${tenantField}: session.user.id // Critical: prevents access to other users' orders
    }
  });
}

// ✅ Update with tenant filter
export async function updateOrder(orderId: string, data: any, session: Session) {
  return await prisma.order.update({
    where: {
      id: orderId,
      ${tenantField}: session.user.id // Prevents updating others' orders
    },
    data
  });
}

// ✅ Delete with tenant filter
export async function deleteOrder(orderId: string, session: Session) {
  return await prisma.order.delete({
    where: {
      id: orderId,
      ${tenantField}: session.user.id
    }
  });
}
\`\`\`
` : `#### Proper Tenant Isolation

\`\`\`typescript
// ✅ Get current user's orders only
export async function getUserOrders(session: Session) {
  const query = {
    text: 'SELECT * FROM orders WHERE ${tenantField} = $1',
    values: [session.user.id]
  };
  return await db.query(query);
}

// ✅ Get specific order with tenant check
export async function getOrder(orderId: string, session: Session) {
  const query = {
    text: 'SELECT * FROM orders WHERE id = $1 AND ${tenantField} = $2',
    values: [orderId, session.user.id]
  };
  return await db.query(query);
}
\`\`\`
`}

### ❌ WRONG Examples (Security Vulnerabilities)

${orm === 'Prisma' ? `#### Missing Tenant Filter (CRITICAL)

\`\`\`typescript
// ❌ CRITICAL VULNERABILITY - Cross-tenant data leak!
export async function getAllOrders() {
  return await prisma.order.findMany(); // No tenant filter!
}
// This returns ALL orders from ALL users!

// ❌ CRITICAL - User can access any order
export async function getOrder(orderId: string) {
  return await prisma.order.findUnique({
    where: { id: orderId } // Missing ${tenantField} check!
  });
}
\`\`\`

#### Tenant ID from User Input (CRITICAL)

\`\`\`typescript
// ❌ CRITICAL - User can supply any ${tenantField} value!
export async function getOrders(req: Request) {
  const { ${tenantField} } = req.body; // User-controllable!

  return await prisma.order.findMany({
    where: { ${tenantField} } // Attacker can set this to anyone's ID
  });
}
\`\`\`

#### Optional Tenant Filter (HIGH)

\`\`\`typescript
// ❌ HIGH RISK - Filter can be bypassed
export async function getOrders(${tenantField}?: string) {
  const where = ${tenantField} ? { ${tenantField} } : {}; // If null, returns all!

  return await prisma.order.findMany({ where });
}
\`\`\`

#### Filter After Fetch (MEDIUM)

\`\`\`typescript
// ❌ MEDIUM RISK - Fetches all data then filters
export async function getUserOrders(session: Session) {
  const allOrders = await prisma.order.findMany(); // Gets ALL orders!
  return allOrders.filter(o => o.${tenantField} === session.user.id); // Filters in memory
}
// This is inefficient and risky if filter is forgotten
\`\`\`
` : `#### Missing Tenant Filter (CRITICAL)

\`\`\`typescript
// ❌ CRITICAL VULNERABILITY - Cross-tenant data leak!
const query = 'SELECT * FROM orders'; // No WHERE clause!
const orders = await db.query(query);
\`\`\`

#### Tenant ID from User Input (CRITICAL)

\`\`\`typescript
// ❌ CRITICAL - User can supply any ${tenantField}!
const { ${tenantField} } = req.body;
const query = {
  text: 'SELECT * FROM orders WHERE ${tenantField} = $1',
  values: [${tenantField}] // Attacker controls this!
};
\`\`\`
`}

## Automated Checks

Run these grep commands to find potential issues:

### Find queries without tenant filter

${orm === 'Prisma' ? `\`\`\`bash
# Find Prisma queries
grep -n "prisma\\.[a-z]*\\.find" src/**/*.ts | while read line; do
  file=\${line%%:*}
  if ! grep -q "${tenantField}" "$file"; then
    echo "⚠️  Potential missing tenant filter: $line"
  fi
done
\`\`\`
` : `\`\`\`bash
# Find SELECT queries without ${tenantField}
grep -n "SELECT.*FROM" src/**/*.ts | grep -v "${tenantField}"
\`\`\`
`}

### Find tenant ID from request body

\`\`\`bash
# Dangerous pattern: getting tenant ID from user input
grep -rn "req\\.body\\.${tenantField}\\|req\\.query\\.${tenantField}" src/
\`\`\`

### Check for optional tenant filters

\`\`\`bash
# Find optional tenant filter parameters
grep -rn "${tenantField}?" src/
\`\`\`

## Manual Review Checklist

For each database query found:

- [ ] Query accesses tenant-specific data (not global/system data)
- [ ] \`where\` clause includes \`${tenantField}\`
- [ ] Tenant ID comes from authenticated session, not user input
- [ ] Filter is required, not optional
- [ ] Filter is applied in the database query, not after fetching
- [ ] No way to bypass the filter with null/undefined values
${orm === 'Prisma' ? `- [ ] \`findUnique\` with composite key includes ${tenantField}\n- [ ] \`updateMany/deleteMany\` include ${tenantField} filter\n` : ''}
## Known Exceptions

Some queries legitimately don't need tenant filters:

- **System/Admin queries** - Admin viewing all tenants (requires separate auth check)
- **Public data** - Read-only public information
- **Global configuration** - App settings, feature flags
- **Metadata tables** - Enums, categories, etc.

**Important:** Document why each exception doesn't need a filter.

## Output Format

### Tenant Isolation Security Audit

#### 🔴 CRITICAL - Missing Tenant Filters

| File | Line | Query | Risk |
|------|------|-------|------|
| src/api/orders.ts | 45 | \`prisma.order.findMany()\` | Cross-tenant data exposure |
| src/api/payments.ts | 78 | \`prisma.payment.findFirst()\` | Payment data leak |

**Impact:** Users can access other tenants' data
**Priority:** FIX IMMEDIATELY before deploying

#### 🟠 HIGH - Bypassable Filters

| File | Line | Issue |
|------|------|-------|
| src/api/users.ts | 34 | Tenant ID from \`req.body.${tenantField}\` (user-controllable) |
| src/lib/db.ts | 89 | Optional ${tenantField} parameter allows bypass |

#### 🟡 MEDIUM - Inefficient Filtering

| File | Line | Issue |
|------|------|-------|
| src/api/reports.ts | 123 | Filters after fetch instead of in query |

#### ✅ Properly Isolated Queries

- src/api/profiles.ts:23 - \`findMany\` with ${tenantField} from session
- src/api/invoices.ts:56 - \`findFirst\` with ${tenantField} check
- src/app/actions/orders.ts:12 - Server action with proper isolation

#### 📊 Summary

- **Total queries found:** 47
- **Properly isolated:** 42 (89%)
- **Critical issues:** 2 (FIX NOW!)
- **High risk:** 2 (Fix before deploy)
- **Medium risk:** 1 (Fix soon)
- **Exceptions (documented):** 4

#### 🎯 Action Items

1. **IMMEDIATE:** Fix critical issues in orders.ts and payments.ts
   \`\`\`typescript
   // Add this to both queries:
   where: { ${tenantField}: session.user.id }
   \`\`\`

2. **Before Deploy:** Fix high-risk issues
   - Change users.ts to get ${tenantField} from session
   - Make ${tenantField} parameter required in db.ts

3. **Next Sprint:** Optimize medium-risk queries

## Prevention

Add this test to catch future violations:

\`\`\`typescript
// tests/security/tenant-isolation.test.ts
describe('Tenant Isolation', () => {
  it('all tenant queries must include ${tenantField} filter', async () => {
    // Parse all query files
    // Verify ${tenantField} in where clause
    // Fail test if missing
  });
});
\`\`\`

Add to code review checklist:
- [ ] All database queries include ${tenantField} filter
- [ ] Tenant ID from session, not user input
- [ ] No optional tenant filters`;
}

function generateTestReview(project: DetectedProject): string {
  const testFramework = project.testing?.unit || 'Jest';

  return `Analyze and improve test quality in **${project.projectName}** to ensure tests provide genuine confidence, not false security.

## Description

This command reviews test files to identify common anti-patterns, low-quality tests, and missing coverage. It helps ensure tests are testing actual behavior, not implementation details or mock configurations.

## When to Use

- Before releasing a new feature
- When test coverage is high but bugs still slip through
- After discovering a bug that tests didn't catch
- During code review to validate test quality
- When refactoring to ensure tests won't break unnecessarily

## Test Configuration

- **Unit Testing:** ${project.testing?.unit || 'Not detected'}
${project.testing?.e2e ? `- **E2E Testing:** ${project.testing.e2e}\n` : ''}- **Test Location:** ${project.framework === 'Next.js' ? '__tests__/ or *.test.ts files' : 'tests/ or *.test.ts files'}

## What Makes a Good Test

A quality test must:

1. **Test behavior, not implementation** - Focus on what, not how
2. **Have meaningful assertions** - Verify actual outcomes
3. **Be maintainable** - Survive refactoring without breaking
4. **Test edge cases** - Not just happy paths
5. **Use appropriate mocking** - Mock external dependencies, not your own code

## Step-by-Step Review Process

### Step 1: Find All Test Files

\`\`\`bash
# Find all test files
find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts"

# Or use your test framework
${project.packageManager === 'pnpm' ? 'pnpm' : project.packageManager || 'npm'} test --listTests
\`\`\`

### Step 2: Analyze Test Quality

For each test file, check for these anti-patterns:

#### ❌ Anti-Pattern 1: Mock Abuse (Testing the Mock)

\`\`\`typescript
// ❌ BAD - Only verifies mock was called, not behavior
test('should fetch user data', async () => {
  const mockFetch = vi.fn();
  await getUserData(mockFetch);

  expect(mockFetch).toHaveBeenCalledWith('/api/user');
  // ⚠️ This only tests that we called the mock!
  // What if the function ignores the result?
});

// ✅ GOOD - Tests actual behavior
test('should return user data from API', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    id: 1,
    name: 'John'
  });

  const result = await getUserData(mockFetch);

  // Test the actual output
  expect(result).toEqual({ id: 1, name: 'John' });
  expect(result.name).toBe('John');
});
\`\`\`

#### ❌ Anti-Pattern 2: No Assertions (Ghost Tests)

\`\`\`typescript
// ❌ BAD - Test runs but verifies nothing
test('should process payment', async () => {
  await processPayment({
    amount: 100,
    userId: 'user123'
  });
  // If function throws, test fails. Otherwise passes.
  // But does it do the RIGHT thing?
});

// ✅ GOOD - Verifies expected outcome
test('should process payment and create record', async () => {
  const result = await processPayment({
    amount: 100,
    userId: 'user123'
  });

  expect(result.status).toBe('success');
  expect(result.transactionId).toBeDefined();

  // Verify side effects
  const payment = await db.payment.findUnique({
    where: { transactionId: result.transactionId }
  });
  expect(payment.amount).toBe(100);
  expect(payment.userId).toBe('user123');
});
\`\`\`

#### ❌ Anti-Pattern 3: Testing Implementation Details

\`\`\`typescript
// ❌ BAD - Breaks when refactoring internal logic
test('should use memoized calculation', () => {
  const component = render(<PriceCalculator items={items} />);

  // Testing that it uses useMemo (implementation detail)
  expect(component.instance().useMemo).toHaveBeenCalled();
});

// ✅ GOOD - Tests observable behavior
test('should display correct total price', () => {
  const { getByText } = render(
    <PriceCalculator items={[
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ]} />
  );

  // Tests what user sees (behavior)
  expect(getByText('Total: $35')).toBeInTheDocument();
});
\`\`\`

#### ❌ Anti-Pattern 4: Over-Mocking (Mocking Your Own Code)

\`\`\`typescript
// ❌ BAD - Mocks everything, tests nothing
test('should create user', async () => {
  const mockValidate = vi.fn().mockReturnValue(true);
  const mockHashPassword = vi.fn().mockReturnValue('hashed');
  const mockSaveToDb = vi.fn().mockResolvedValue({ id: 1 });

  await createUser(data, {
    validate: mockValidate,
    hashPassword: mockHashPassword,
    saveToDb: mockSaveToDb
  });

  expect(mockValidate).toHaveBeenCalled();
  expect(mockHashPassword).toHaveBeenCalled();
  expect(mockSaveToDb).toHaveBeenCalled();
}); // This tests nothing about the actual createUser logic!

// ✅ GOOD - Only mock external dependencies
test('should create user with hashed password', async () => {
  // Only mock external database
  const mockDb = {
    user: {
      create: vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' })
    }
  };

  const result = await createUser(
    { email: 'test@example.com', password: 'password123' },
    mockDb
  );

  // Verify actual behavior
  expect(result.id).toBe(1);
  expect(mockDb.user.create).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: expect.stringMatching(/^\\$2[ab]\\$/) // Verify bcrypt hash
  });
});
\`\`\`

#### ❌ Anti-Pattern 5: Missing Edge Cases

\`\`\`typescript
// ❌ BAD - Only tests happy path
test('should divide numbers', () => {
  expect(divide(10, 2)).toBe(5);
});

// ✅ GOOD - Tests edge cases
describe('divide', () => {
  test('should divide positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  test('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
  });

  test('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
  });

  test('should handle decimals', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
\`\`\`

### Step 3: Check Coverage Gaps

\`\`\`bash
# Run tests with coverage
${project.packageManager === 'pnpm' ? 'pnpm' : project.packageManager || 'npm'} test --coverage

# Look for:
# - Low coverage files (<80%)
# - Uncovered branches (error handling)
# - Uncovered lines (edge cases)
\`\`\`

**Critical paths that MUST have tests:**
- Authentication logic
- Payment processing
- Data validation
${project.isMultiTenant ? `- Tenant isolation (${project.tenantField} filtering)\n` : ''}- API endpoints
- Database mutations

### Step 4: Evaluate Test Structure (AAA Pattern)

Good tests follow **Arrange-Act-Assert**:

\`\`\`typescript
test('should calculate discount for premium users', () => {
  // ARRANGE - Set up test data
  const user = { isPremium: true };
  const price = 100;

  // ACT - Execute the behavior
  const result = calculatePrice(price, user);

  // ASSERT - Verify outcome
  expect(result).toBe(80); // 20% discount
});
\`\`\`

### Step 5: Check for Brittle Tests

Brittle tests break when refactoring:

\`\`\`typescript
// ❌ BRITTLE - Depends on exact HTML structure
const button = container.querySelector('div > div > button.primary');

// ✅ RESILIENT - Depends on user-visible behavior
const button = getByRole('button', { name: /submit/i });
\`\`\`

## Test Quality Scoring

### High Quality Test (Score: 9-10/10)

\`\`\`typescript
describe('createOrder', () => {
  test('should create order and send confirmation email', async () => {
    // Arrange - Real data, only mock external services
    const mockEmailService = vi.fn().mockResolvedValue({ sent: true });
    const orderData = {
      userId: 'user123',
      items: [{ productId: 'prod1', quantity: 2 }],
      total: 50
    };

    // Act
    const result = await createOrder(orderData, {
      emailService: mockEmailService
    });

    // Assert - Multiple meaningful assertions
    expect(result.status).toBe('confirmed');
    expect(result.orderId).toBeDefined();
    expect(mockEmailService).toHaveBeenCalledWith({
      to: expect.stringContaining('@'),
      subject: 'Order Confirmation',
      orderId: result.orderId
    });

    // Verify database side effect
    const order = await db.order.findUnique({
      where: { id: result.orderId }
    });
    expect(order.status).toBe('confirmed');
    expect(order.total).toBe(50);
  });

  test('should handle email service failure gracefully', async () => {
    // Tests error case
    const mockEmailService = vi.fn().mockRejectedValue(
      new Error('Email service down')
    );

    const result = await createOrder(orderData, {
      emailService: mockEmailService
    });

    // Order still created even if email fails
    expect(result.status).toBe('pending_notification');
    expect(result.orderId).toBeDefined();
  });
});
\`\`\`

### Low Quality Test (Score: 2-3/10)

\`\`\`typescript
test('test order creation', () => {
  const mock = vi.fn();
  createOrder(mock);
  expect(mock).toHaveBeenCalled();
});
// Issues: Vague name, no real data, only tests mock, no assertions on behavior
\`\`\`

## Common Issues to Flag

### Issue: Tests Pass But Feature is Broken

**Cause:** Tests are testing mocks, not real behavior

**Fix:** Reduce mocking, test actual outputs

### Issue: Tests Break When Refactoring

**Cause:** Testing implementation details

**Fix:** Test public API and user-visible behavior only

### Issue: Low Coverage of Error Paths

**Cause:** Only testing happy paths

**Fix:** Add tests for:
- Invalid input
- Network failures
- Database errors
- Edge cases

${project.isMultiTenant ? `### Issue: No Tests for Tenant Isolation

**Cause:** Security tests overlooked

**Fix:** Add tenant isolation tests:

\`\`\`typescript
test('should only return current user orders', async () => {
  // Create orders for different users
  await db.order.create({ userId: 'user1', total: 100 });
  await db.order.create({ userId: 'user2', total: 200 });

  // Fetch as user1
  const session = { user: { id: 'user1' } };
  const orders = await getOrders(session);

  // Should only get user1's order
  expect(orders).toHaveLength(1);
  expect(orders[0].userId).toBe('user1');
});
\`\`\`
` : ''}
## Output Format

### Test Quality Review for ${project.projectName}

#### 🔴 Critical Issues (Tests Providing False Confidence)

| File | Line | Issue | Score | Fix |
|------|------|-------|-------|-----|
| api/payments.test.ts | 34 | Only tests mock calls, not payment processing | 2/10 | Add assertions on result |
| components/Form.test.ts | 67 | No assertions, test always passes | 1/10 | Add expect() statements |

#### 🟡 Tests Needing Improvement

| File | Issue | Recommendation |
|------|-------|----------------|
| lib/utils.test.ts | Missing edge case tests | Add tests for null, undefined, empty inputs |
| api/users.test.ts | Over-mocked, testing implementation | Reduce mocking, test actual behavior |
| components/Button.test.ts | Brittle selectors | Use getByRole() instead of querySelector() |

#### ❌ Missing Test Coverage

**Critical Paths Without Tests:**
${project.isMultiTenant ? `- Tenant isolation in \`src/api/orders.ts\`\n` : ''}- Error handling in \`src/lib/stripe.ts\`
- Validation logic in \`src/schemas/user.ts\`
- API route \`src/app/api/webhooks/stripe/route.ts\`

**Recommended:** Prioritize these areas - they're high-risk

#### ✅ High-Quality Test Examples

**Great patterns found in:**
- \`src/lib/auth.test.ts\` - Tests actual auth flow with minimal mocking
- \`src/components/LoginForm.test.ts\` - User-centric tests with accessibility
- \`src/api/users.test.ts:45-78\` - Comprehensive edge case coverage

Use these as templates for other tests.

#### 📊 Test Metrics

- **Test files:** 47
- **Total tests:** 312
- **Average quality score:** 6.8/10
- **High quality (8+):** 89 tests (29%)
- **Low quality (<5):** 23 tests (7%)
- **Coverage:** ${project.testing?.unit === 'vitest' ? '78%' : '72%'} (target: 80%+)

#### 🎯 Action Items

**High Priority:**
1. Fix 23 low-quality tests (false confidence)
2. Add tests for critical missing coverage areas
${project.isMultiTenant ? `3. Add tenant isolation security tests\n` : ''}
**Medium Priority:**
1. Improve 45 tests with minor issues
2. Increase edge case coverage
3. Reduce over-mocking in test suite

**Low Priority:**
1. Refactor brittle tests to be more maintainable
2. Add integration tests for critical flows

#### 💡 Suggestions

1. **Add test quality linting:** Use ESLint plugin for ${testFramework === 'Vitest' ? 'Vitest' : testFramework}
   \`\`\`bash
   ${project.packageManager === 'pnpm' ? 'pnpm' : project.packageManager || 'npm'} install -D eslint-plugin-${testFramework === 'Vitest' ? 'vitest' : 'jest'}
   \`\`\`

2. **Require coverage thresholds** in ${testFramework} config:
   \`\`\`javascript
   coverageThreshold: {
     global: {
       statements: 80,
       branches: 75,
       functions: 80,
       lines: 80
     }
   }
   \`\`\`

3. **Code review checklist:** For every PR with tests, verify:
   - [ ] Tests verify behavior, not implementation
   - [ ] Tests have meaningful assertions
   - [ ] Edge cases covered
   - [ ] Mocking is minimal and appropriate

## Prevention Tips

**Write tests that answer:**
- What is this code supposed to do? (Behavior)
- What happens if inputs are wrong? (Edge cases)
- What happens if dependencies fail? (Error handling)

**DON'T write tests that answer:**
- Does this code call this function? (Implementation)
- Is this mock configured correctly? (Test setup)`;
}

function generateGenericCommand(command: CommandDefinition): string {
  return `${command.description}

## What This Does

[Description of command functionality]

## Process

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output Format

[Expected output structure]`;
}
