const { spawn } = require('node:child_process');

const RECOVERY_MIGRATION =
  process.env.PRISMA_RECOVERY_MIGRATION || '20251026103000_add_personal_income_table';

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

  const statusResult = await runCommand(
    getCommand('npx'),
    ['prisma', 'migrate', 'status'],
    { captureOutput: true },
  );

  const combinedOutput = `${statusResult.stdout}\n${statusResult.stderr}`.toLowerCase();
  const targetMigration = RECOVERY_MIGRATION.toLowerCase();
  const hasFailedMigration = combinedOutput.includes('p3009') || combinedOutput.includes('failed');
  const hasTargetFailure = hasFailedMigration && combinedOutput.includes(targetMigration);

  if (hasTargetFailure) {
    console.log(`Rolling back failed Prisma migration ${RECOVERY_MIGRATION}...`);

    const resolveResult = await runCommand(getCommand('npx'), [
      'prisma',
      'migrate',
      'resolve',
      '--rolled-back',
      RECOVERY_MIGRATION,
    ]);

    if (resolveResult.code !== 0) {
      throw new Error(`Failed to mark ${RECOVERY_MIGRATION} as rolled back.`);
    }
  } else if (hasFailedMigration) {
    throw new Error(
      `Prisma reported a failed migration other than ${RECOVERY_MIGRATION}. Automatic recovery stopped to avoid guessing.`,
    );
  } else {
    console.log(`No failed Prisma state detected for ${RECOVERY_MIGRATION}; skipping recovery.`);
  }

  console.log('Applying Prisma migrations...');

  const deployResult = await runCommand(getCommand('npx'), ['prisma', 'migrate', 'deploy']);

  if (deployResult.code !== 0) {
    throw new Error('Prisma migrate deploy failed.');
  }
}

async function main() {
  await ensurePrismaState();

  console.log('Starting application...');

  const startResult = await runCommand(getCommand('npm'), ['run', 'start']);
  process.exit(startResult.code);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});