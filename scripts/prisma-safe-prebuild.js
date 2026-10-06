const { spawnSync } = require('node:child_process');

// A preview/build must never migrate, repair or reset a production database.
// Apply reviewed migrations separately with npm run prisma:migrate:deploy.
const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'generate'], {
  env: process.env,
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error('Prisma client generation could not start:', result.error.name);
}
process.exit(result.status ?? 1);
