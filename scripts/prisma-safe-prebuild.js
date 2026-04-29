const { spawn } = require('node:child_process');

const DEFAULT_RECOVERY_MIGRATIONS = [
  '20251024170000_init',
  '20251026103000_add_personal_income_table',
];

function getRecoveryMigrations() {
  const raw = process.env.PRISMA_RECOVERY_MIGRATIONS;
  if (!raw) return DEFAULT_RECOVERY_MIGRATIONS;

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCommand(command) {
  return process.platform === 'win32' ? `${command}.cmd` : command;
}

function runCommand(command, args, options = {}) {
  const { captureOutput = false } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    });

    let stdout = '';
    let stderr = '';

    if (captureOutput) {
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        process.stderr.write(text);
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function ensurePrismaState() {
  console.log('Checking Prisma migration status...');

  const statusResult = await runCommand(getCommand('npx'), ['prisma', 'migrate', 'status'], {
    captureOutput: true,
  });

  const output = `${statusResult.stdout}\n${statusResult.stderr}`;
  const lowerOutput = output.toLowerCase();

  const hasFailedMigration = lowerOutput.includes('p3009') || lowerOutput.includes('failed');
  if (!hasFailedMigration) {
    console.log('No failed Prisma migration state detected.');
    return;
  }

  const configuredMigrations = getRecoveryMigrations();
  const migrationsToResolve = configuredMigrations.filter((migrationName) =>
    lowerOutput.includes(migrationName.toLowerCase()),
  );

  if (migrationsToResolve.length === 0) {
    throw new Error(
      'Prisma reported a failed migration (P3009), but none matched PRISMA_RECOVERY_MIGRATIONS. ' +
        'Set PRISMA_RECOVERY_MIGRATIONS="migration_name" in environment to authorize recovery.',
    );
  }

  for (const migrationName of migrationsToResolve) {
    console.log(`Marking failed migration as rolled back: ${migrationName}`);

    const resolveResult = await runCommand(getCommand('npx'), [
      'prisma',
      'migrate',
      'resolve',
      '--rolled-back',
      migrationName,
    ]);

    if (resolveResult.code !== 0) {
      throw new Error(`Failed to mark ${migrationName} as rolled back.`);
    }
  }
}

async function main() {
  await ensurePrismaState();

  console.log('Applying Prisma migrations...');
  const deployResult = await runCommand(getCommand('npx'), ['prisma', 'migrate', 'deploy']);
  if (deployResult.code !== 0) {
    throw new Error('Prisma migrate deploy failed.');
  }

  console.log('Generating Prisma client...');
  const generateResult = await runCommand(getCommand('npx'), ['prisma', 'generate']);
  if (generateResult.code !== 0) {
    throw new Error('Prisma generate failed.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
