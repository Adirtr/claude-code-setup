// Detection patterns and mappings for project analysis

import type {
  FrameworkDetection,
  DatabaseDetection,
  AuthDetection,
  ExternalAPIDetection,
} from '../types/index.js';

// Framework detection from package.json dependencies
export const FRAMEWORK_DETECTION: FrameworkDetection = {
  'next': 'Next.js',
  '@remix-run/react': 'Remix',
  'react': 'React',
  'vue': 'Vue',
  'nuxt': 'Nuxt',
  '@angular/core': 'Angular',
  'svelte': 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  'astro': 'Astro',
  'express': 'Express',
  'fastify': 'Fastify',
  'hono': 'Hono',
  'koa': 'Koa',
  '@nestjs/core': 'NestJS',
  'gatsby': 'Gatsby',
  '@redwoodjs/core': 'RedwoodJS',
  'solid-js': 'SolidJS',
  '@solidjs/start': 'Solid Start',
  'qwik': 'Qwik',
  '@builder.io/qwik': 'Qwik',
};

// Database detection from package.json
export const DATABASE_DETECTION: DatabaseDetection = {
  '@supabase/supabase-js': { provider: 'supabase', type: 'postgresql' },
  'prisma': { orm: 'prisma' },
  '@prisma/client': { orm: 'prisma' },
  'drizzle-orm': { orm: 'drizzle' },
  'mongoose': { type: 'mongodb', orm: 'mongoose' },
  'typeorm': { orm: 'typeorm' },
  'sequelize': { orm: 'sequelize' },
  'knex': { orm: 'knex' },
  'pg': { type: 'postgresql' },
  'mysql2': { type: 'mysql' },
  'mysql': { type: 'mysql' },
  'mongodb': { type: 'mongodb' },
  '@planetscale/database': { provider: 'planetscale', type: 'mysql' },
  'redis': { type: 'redis' },
  'ioredis': { type: 'redis' },
  '@vercel/postgres': { provider: 'vercel', type: 'postgresql' },
  '@databases/pg': { type: 'postgresql' },
  'sqlite3': { type: 'sqlite' },
  'better-sqlite3': { type: 'sqlite' },
};

// Auth provider detection
export const AUTH_DETECTION: AuthDetection = {
  '@supabase/auth-helpers-nextjs': 'supabase',
  '@supabase/auth-helpers-react': 'supabase',
  'firebase': 'firebase',
  '@clerk/nextjs': 'clerk',
  '@clerk/react': 'clerk',
  '@auth0/nextjs-auth0': 'auth0',
  '@auth0/auth0-react': 'auth0',
  'next-auth': 'nextauth',
  '@next-auth/prisma-adapter': 'nextauth',
  'passport': 'passport',
  'lucia': 'lucia',
  'better-auth': 'better-auth',
  '@kinde-oss/kinde-auth-nextjs': 'kinde',
  '@descope/nextjs-sdk': 'descope',
  'aws-amplify': 'aws-amplify',
};

// External API detection
export const EXTERNAL_API_DETECTION: ExternalAPIDetection = {
  'googleapis': ['google-sheets', 'google-drive', 'gmail'],
  '@google-cloud/gmail': ['gmail'],
  'stripe': ['stripe'],
  '@stripe/stripe-js': ['stripe'],
  '@sendgrid/mail': ['sendgrid'],
  'resend': ['resend'],
  'twilio': ['twilio'],
  'openai': ['openai'],
  '@anthropic-ai/sdk': ['anthropic'],
  '@vercel/ai': ['ai-sdk'],
  'langchain': ['langchain'],
  '@langchain/core': ['langchain'],
  'mailgun.js': ['mailgun'],
  'nodemailer': ['email-smtp'],
  '@aws-sdk/client-s3': ['aws-s3'],
  '@aws-sdk/client-ses': ['aws-ses'],
  'aws-sdk': ['aws'],
  '@octokit/rest': ['github-api'],
  'shopify-api-node': ['shopify'],
  '@slack/web-api': ['slack'],
  'discord.js': ['discord'],
  '@google-cloud/storage': ['google-cloud-storage'],
  'cloudflare': ['cloudflare'],
  '@vercel/blob': ['vercel-blob'],
  'uploadthing': ['uploadthing'],
};

// Testing framework detection
export const TESTING_DETECTION = {
  unit: {
    'vitest': 'vitest',
    'jest': 'jest',
    '@jest/globals': 'jest',
    'mocha': 'mocha',
    'ava': 'ava',
    'uvu': 'uvu',
    'node:test': 'node',
  },
  e2e: {
    'playwright': 'playwright',
    '@playwright/test': 'playwright',
    'cypress': 'cypress',
    'puppeteer': 'puppeteer',
    '@testing-library/react': 'react-testing-library',
    '@testing-library/vue': 'vue-testing-library',
  },
};

// Package manager detection patterns
export const PACKAGE_MANAGER_FILES = {
  'pnpm-lock.yaml': 'pnpm',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
} as const;

// Monorepo detection patterns
export const MONOREPO_PATTERNS = [
  'pnpm-workspace.yaml',
  'turbo.json',
  'nx.json',
  'lerna.json',
  'rush.json',
  'workspaces', // in package.json
];

// File structure patterns
export const STRUCTURE_PATTERNS = {
  nextApp: ['app/', 'pages/'],
  srcDir: ['src/'],
  tests: ['tests/', '__tests__/', 'test/', '*.test.ts', '*.spec.ts', '*.test.js', '*.spec.js'],
  cicd: ['.github/workflows/', '.gitlab-ci.yml', 'Jenkinsfile', '.circleci/', '.drone.yml'],
  docker: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
  config: ['tsconfig.json', 'jsconfig.json', '.eslintrc', 'prettier.config'],
};

// Multi-tenant detection patterns (regex)
export const TENANT_PATTERNS = [
  /where.*user_id\s*[=:]/i,
  /where.*org_id\s*[=:]/i,
  /where.*organization_id\s*[=:]/i,
  /where.*tenant_id\s*[=:]/i,
  /where.*workspace_id\s*[=:]/i,
  /where.*team_id\s*[=:]/i,
  /\.eq\(['"]user_id['"]/,
  /\.eq\(['"]org_id['"]/,
  /\.eq\(['"]tenant_id['"]/,
  /\.eq\(['"]workspace_id['"]/,
  /\.eq\(['"]team_id['"]/,
  /filter\(['"]user_id['"]/,
  /filter\(['"]org_id['"]/,
];

// Common tenant field names to extract
export const TENANT_FIELD_NAMES = [
  'user_id',
  'userId',
  'org_id',
  'orgId',
  'organization_id',
  'organizationId',
  'tenant_id',
  'tenantId',
  'workspace_id',
  'workspaceId',
  'team_id',
  'teamId',
];

// API route patterns
export const API_PATTERNS = {
  rest: [
    /app\/api\/.*\/route\.(ts|js)/,
    /pages\/api\//,
    /api\/routes\//,
    /src\/routes\//,
  ],
  graphql: [
    /schema\.graphql/,
    /\.graphql$/,
    /resolvers\//,
    /typeDefs/,
  ],
  trpc: [
    /trpc/i,
    /createTRPCRouter/,
    /\.router\.(ts|js)$/,
  ],
};

// Build command patterns
export const BUILD_COMMANDS = {
  pnpm: 'pnpm build',
  npm: 'npm run build',
  yarn: 'yarn build',
  bun: 'bun run build',
};

// Test command patterns
export const TEST_COMMANDS = {
  pnpm: 'pnpm test',
  npm: 'npm test',
  yarn: 'yarn test',
  bun: 'bun test',
};

// Files to exclude from scanning
export const IGNORE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  '.nuxt/**',
  'out/**',
  'coverage/**',
  '.cache/**',
  '.git/**',
  '.vercel/**',
  '.netlify/**',
  '**/*.min.js',
  '**/*.bundle.js',
  'vendor/**',
  'public/**',
  'static/**',
  '**/*.map',
];

// Language detection from file extensions
export const LANGUAGE_DETECTION = {
  typescript: ['.ts', '.tsx', 'tsconfig.json'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python: ['.py', 'requirements.txt', 'pyproject.toml'],
  go: ['.go', 'go.mod'],
  rust: ['.rs', 'Cargo.toml'],
  java: ['.java', 'pom.xml', 'build.gradle'],
};
