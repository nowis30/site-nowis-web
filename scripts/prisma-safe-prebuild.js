const { spawn } = require('node:child_process');

const DEFAULT_RECOVERY_MIGRATIONS = [
  '20251024170000_init',
  '20251026103000_add_personal_income_table',
];
const MAX_RECOVERY_PASSES = 6;

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

function extractFailedMigrationNames(output) {
  return Array.from(output.matchAll(/The `([^`]+)` migration[^\n]*failed/gi), (match) => match[1]);
}

async function resolveFailedMigrations(names) {
  const uniqueNames = Array.from(new Set(names));

  for (const migrationName of uniqueNames) {
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

async function deployWithRecovery() {
  const configuredMigrations = getRecoveryMigrations();

  for (let pass = 1; pass <= MAX_RECOVERY_PASSES; pass += 1) {
    console.log(`Applying Prisma migrations (pass ${pass}/${MAX_RECOVERY_PASSES})...`);

    const deployResult = await runCommand(getCommand('npx'), ['prisma', 'migrate', 'deploy'], {
      captureOutput: true,
    });

    if (deployResult.code === 0) {
      console.log('Prisma migrate deploy completed successfully.');
      return;
    }

    const output = `${deployResult.stdout}\n${deployResult.stderr}`;
    const lowerOutput = output.toLowerCase();
    const isP3009 = lowerOutput.includes('p3009') || lowerOutput.includes('failed migrations in the target database');

    if (!isP3009) {
      throw new Error('Prisma migrate deploy failed for a non-P3009 reason.');
    }

    const failedNamesFromOutput = extractFailedMigrationNames(output);
    const matchedNames = failedNamesFromOutput.filter((name) => configuredMigrations.includes(name));

    if (matchedNames.length === 0) {
      // Some Prisma outputs do not include explicit migration names in this step.
      // In that case, attempt known recoverable migrations.
      console.log('P3009 detected without explicit migration name; attempting allowlisted recovery migrations.');
      await resolveFailedMigrations(configuredMigrations);
    } else {
      await resolveFailedMigrations(matchedNames);
    }
  }

  throw new Error(`Prisma migrate deploy is still blocked by P3009 after ${MAX_RECOVERY_PASSES} attempts.`);
}

async function main() {
  await deployWithRecovery();

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
