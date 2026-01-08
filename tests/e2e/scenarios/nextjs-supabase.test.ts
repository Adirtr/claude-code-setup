import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import type { TestScenario } from '../../types.js';

let testDirPath: string | null = null;

export const nextjsSupabaseScenario: TestScenario = {
  name: 'nextjs-supabase-app',
  description: 'Full Next.js app with Supabase auth and database',
  expectedMode: 'automatic',
  expectedFileCount: 7,
  context: {
    name: 'nextjs-subscription-payments',
    framework: 'Next.js',
    database: 'Supabase',
    packageManager: 'pnpm',
    isMultiTenant: true,
    tenantField: 'user_id',
    externalApis: ['stripe', 'supabase'],
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'Stripe', 'React'],
    existingPaths: ['app', 'components', 'utils', 'lib'],
    packageJsonScripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
  },

  setup: async () => {
    testDirPath = path.join(os.tmpdir(), `claude-test-nextjs-${Date.now()}`);

    console.log('Cloning Next.js + Supabase example...');
    try {
      execSync(
        `git clone --depth 1 https://github.com/vercel/nextjs-subscription-payments.git "${testDirPath}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    } catch (error) {
      console.error('Failed to clone repo, creating minimal example instead');
      // Fallback: create minimal Next.js + Supabase project
      await fs.ensureDir(testDirPath);
      await createMinimalNextjsSupabase(testDirPath);
      return testDirPath;
    }

    // Remove .git to simulate fresh project
    const gitDir = path.join(testDirPath, '.git');
    if (await fs.pathExists(gitDir)) {
      await fs.remove(gitDir);
    }

    return testDirPath;
  },

  cleanup: async () => {
    if (testDirPath && await fs.pathExists(testDirPath)) {
      await fs.remove(testDirPath);
    }
  },
};

async function createMinimalNextjsSupabase(dir: string): Promise<void> {
  // Create package.json
  const packageJson = {
    name: 'nextjs-supabase-test',
    version: '1.0.0',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@supabase/supabase-js': '^2.38.0',
      '@supabase/auth-helpers-nextjs': '^0.8.0',
      'stripe': '^14.0.0',
    },
    devDependencies: {
      'typescript': '^5.3.0',
      '@types/react': '^18.2.0',
      '@types/node': '^20.0.0',
    },
  };

  await fs.writeJson(path.join(dir, 'package.json'), packageJson, { spaces: 2 });

  // Create pnpm-lock.yaml
  await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), '');

  // Create app directory structure
  await fs.ensureDir(path.join(dir, 'app'));
  await fs.ensureDir(path.join(dir, 'components'));
  await fs.ensureDir(path.join(dir, 'utils'));
  await fs.ensureDir(path.join(dir, 'lib'));

  // Create a sample page with Supabase auth
  await fs.writeFile(
    path.join(dir, 'app/page.tsx'),
    `import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  return <div>Welcome {user?.email}</div>;
}
`
  );

  // Create utils/supabase
  await fs.ensureDir(path.join(dir, 'utils/supabase'));
  await fs.writeFile(
    path.join(dir, 'utils/supabase/client.ts'),
    `import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();
`
  );

  // Create a sample API route with user_id filter
  await fs.ensureDir(path.join(dir, 'app/api/subscriptions'));
  await fs.writeFile(
    path.join(dir, 'app/api/subscriptions/route.ts'),
    `import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id);

  return NextResponse.json({ subscriptions });
}
`
  );

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next',
        },
      ],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  await fs.writeJson(path.join(dir, 'tsconfig.json'), tsConfig, { spaces: 2 });
}
