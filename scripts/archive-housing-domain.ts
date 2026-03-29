import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function buildArchiveDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return process.env.HOUSING_ARCHIVE_DIR?.trim()
    ? path.resolve(process.env.HOUSING_ARCHIVE_DIR.trim())
    : path.join(process.cwd(), 'archive', 'housing-domain', timestamp);
}

async function main() {
  const outputDir = buildArchiveDir();
  mkdirSync(outputDir, { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir,
    strategy: 'post-destructive-cleanup',
    irreversibleDropPerformed: true,
    note: 'Housing legacy tables and columns are now removed from runtime schema.',
    datasets: {
      properties: 0,
      units: 0,
      tenants: 0,
      leases: 0,
      payments: 0,
      maintenanceTickets: 0,
      maintenanceUpdates: 0,
    },
  };

  writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Archive post-cleanup generated in ${outputDir}`);
}

main().catch((error) => {
  console.error('Archive script failed', error);
  process.exitCode = 1;
});