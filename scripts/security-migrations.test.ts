import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('fresh PostgreSQL schema accepts the complete migration history and revokes accounts through SQL triggers', async () => {
  // Embedded disposable PostgreSQL. Never uses DATABASE_URL or the live server.
  const database = new PGlite();
  const root = path.resolve('prisma/migrations');
  try {
    for (const entry of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      try { await database.exec(readFileSync(path.join(root, entry.name, 'migration.sql'), 'utf8')); }
      catch (error) { throw new Error(`Migration failed: ${entry.name}`, { cause: error }); }
    }
    const userId = '99999999-9999-4999-8999-999999999991';
    const contactId = '99999999-9999-4999-8999-999999999992';
    await database.query('INSERT INTO contacts (id,type,"fullName",email,"updatedAt") VALUES ($1,\'CLIENT\',\'Isolated test\',\'test@invalid.test\',CURRENT_TIMESTAMP)', [contactId]);
    await database.query('INSERT INTO users (id,email,"fullName","passwordHash",role,"contactId","updatedAt") VALUES ($1,\'test@invalid.test\',\'Isolated test\',\'not-a-real-hash\',\'PORTAL_USER\',$2,CURRENT_TIMESTAMP)', [userId, contactId]);
    const userVersion = async () => (await database.query<{ authVersion: number }>('SELECT "authVersion" FROM users WHERE id=$1', [userId])).rows[0].authVersion;
    assert.equal(await userVersion(), 0);
    await database.query('UPDATE users SET "fullName"=\'Test renamed\' WHERE id=$1', [userId]);
    assert.equal(await userVersion(), 0, 'A profile display-name change does not revoke a session');
    for (const update of [
      '"passwordHash"=\'replacement-hash\'',
      'email=\'new@invalid.test\'',
      'role=\'ASSISTANT\'',
      '"isActive"=false',
      '"contactId"=NULL',
      '"emailVerifiedAt"=CURRENT_TIMESTAMP',
    ]) {
      const version = await userVersion();
      await database.query(`UPDATE users SET ${update} WHERE id=$1`, [userId]);
      assert.equal(await userVersion(), version + 1);
    }
    const contactVersion = async () => (await database.query<{ authVersion: number }>('SELECT "authVersion" FROM contacts WHERE id=$1', [contactId])).rows[0].authVersion;
    assert.equal(await contactVersion(), 0);
    await database.query('UPDATE contacts SET email=\'new@invalid.test\' WHERE id=$1', [contactId]);
    assert.equal(await contactVersion(), 1);
    await database.query('UPDATE contacts SET "deletedAt"=CURRENT_TIMESTAMP WHERE id=$1', [contactId]);
    assert.equal(await contactVersion(), 2);
    const grants = await database.query('SELECT * FROM auth_grants');
    assert.equal(grants.rows.length, 0);
  } finally { await database.close(); }
});
