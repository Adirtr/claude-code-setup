import { readJSON } from '../utils/fs.js';
import {
  FRAMEWORK_DETECTION,
  DATABASE_DETECTION,
  AUTH_DETECTION,
  EXTERNAL_API_DETECTION,
  TESTING_DETECTION,
} from '../constants/detection.js';
import type { DatabaseConfig, AuthConfig, TestingConfig, Language } from '../types/index.js';

interface PackageJson {
  name?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  type?: string;
}

export interface PackageAnalysisResult {
  projectName: string;
  projectDescription: string;
  framework: string | null;
  language: Language;
  database: DatabaseConfig | null;
  auth: AuthConfig | null;
  testing: TestingConfig | null;
  externalApis: string[];
  hasTypeScript: boolean;
  dependencies: string[];
}

export async function analyzePackage(cwd: string): Promise<PackageAnalysisResult> {
  const packageJsonPath = `${cwd}/package.json`;
  const pkg = await readJSON<PackageJson>(packageJsonPath);

  if (!pkg) {
    // No package.json found - likely not a Node project
    return {
      projectName: 'unknown',
      projectDescription: '',
      framework: null,
      language: 'other',
      database: null,
      auth: null,
      testing: null,
      externalApis: [],
      hasTypeScript: false,
      dependencies: [],
    };
  }

  // Combine all dependencies
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  const depList = Object.keys(allDeps);

  // Detect framework
  const framework = detectFramework(depList);

  // Detect language
  const hasTypeScript = depList.includes('typescript') || depList.includes('ts-node');
  const language: Language = hasTypeScript ? 'typescript' : 'javascript';

  // Detect database
  const database = detectDatabase(depList);

  // Detect auth
  const auth = detectAuth(depList);

  // Detect testing
  const testing = detectTesting(depList);

  // Detect external APIs
  const externalApis = detectExternalApis(depList);

  return {
    projectName: pkg.name || 'unknown',
    projectDescription: pkg.description || '',
    framework,
    language,
    database,
    auth,
    testing,
    externalApis,
    hasTypeScript,
    dependencies: depList,
  };
}

function detectFramework(deps: string[]): string | null {
  // Check in priority order (more specific frameworks first)
  const priorityOrder = [
    '@remix-run/react',
    '@sveltejs/kit',
    '@solidjs/start',
    '@builder.io/qwik',
    '@nestjs/core',
    '@redwoodjs/core',
    'next',
    'nuxt',
    'astro',
    'gatsby',
    'qwik',
    'solid-js',
    'svelte',
    '@angular/core',
    'vue',
    'react',
    'express',
    'fastify',
    'hono',
    'koa',
  ];

  for (const dep of priorityOrder) {
    if (deps.includes(dep)) {
      return FRAMEWORK_DETECTION[dep];
    }
  }

  return null;
}

function detectDatabase(deps: string[]): DatabaseConfig | null {
  let config: DatabaseConfig = {
    type: '',
    provider: '',
    orm: '',
  };

  // Check each dependency
  for (const dep of deps) {
    if (DATABASE_DETECTION[dep]) {
      const detected = DATABASE_DETECTION[dep];
      if (detected.type) config.type = detected.type;
      if (detected.provider) config.provider = detected.provider;
      if (detected.orm) config.orm = detected.orm;
    }
  }

  // If we found something, return it
  if (config.type || config.provider || config.orm) {
    return config;
  }

  return null;
}

function detectAuth(deps: string[]): AuthConfig | null {
  const providers: string[] = [];
  const methods: string[] = [];

  for (const dep of deps) {
    if (AUTH_DETECTION[dep]) {
      const provider = AUTH_DETECTION[dep];
      if (!providers.includes(provider)) {
        providers.push(provider);
      }
    }
  }

  if (providers.length === 0) {
    return null;
  }

  // Infer auth methods based on provider
  if (providers.includes('supabase')) {
    methods.push('email', 'oauth');
  }
  if (providers.includes('clerk')) {
    methods.push('email', 'oauth', 'magic-link');
  }
  if (providers.includes('auth0')) {
    methods.push('email', 'oauth');
  }
  if (providers.includes('nextauth')) {
    methods.push('email', 'oauth');
  }
  if (providers.includes('firebase')) {
    methods.push('email', 'oauth', 'phone');
  }

  return {
    provider: providers[0], // Primary provider
    methods: methods.length > 0 ? methods : ['email'],
  };
}

function detectTesting(deps: string[]): TestingConfig | null {
  let unit: string | undefined;
  let e2e: string | undefined;

  // Detect unit testing
  for (const [dep, framework] of Object.entries(TESTING_DETECTION.unit)) {
    if (deps.includes(dep)) {
      unit = framework;
      break;
    }
  }

  // Detect E2E testing
  for (const [dep, framework] of Object.entries(TESTING_DETECTION.e2e)) {
    if (deps.includes(dep)) {
      e2e = framework;
      break;
    }
  }

  if (!unit && !e2e) {
    return null;
  }

  return { unit, e2e };
}

function detectExternalApis(deps: string[]): string[] {
  const apis = new Set<string>();

  for (const dep of deps) {
    if (EXTERNAL_API_DETECTION[dep]) {
      const detectedApis = EXTERNAL_API_DETECTION[dep];
      detectedApis.forEach(api => apis.add(api));
    }
  }

  return Array.from(apis);
}

export function getVersionFromDeps(
  pkg: PackageJson | null,
  depName: string
): string | null {
  if (!pkg) return null;

  const version =
    pkg.dependencies?.[depName] ||
    pkg.devDependencies?.[depName];

  if (!version) return null;

  // Clean up version string (remove ^, ~, etc.)
  return version.replace(/^[\^~>=<]/, '');
}
