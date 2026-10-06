import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { getDatabaseFilePath, getUploadsDirectory, isUsingDefaultPublicUploadsDir } from '../src/lib/storage';

test('upload directory comparison preserves default, normalized and custom paths without changing database path lookup', () => {
  const oldUploads = process.env.UPLOAD_DIR;
  const oldDatabase = process.env.DB_FILE_PATH;
  try {
    delete process.env.UPLOAD_DIR;
    delete process.env.DB_FILE_PATH;
    assert.equal(getUploadsDirectory(), path.join(process.cwd(), 'public', 'uploads'));
    assert.equal(isUsingDefaultPublicUploadsDir(), true);
    assert.equal(getDatabaseFilePath(), path.join(process.cwd(), 'data', 'db.json'));

    process.env.UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'nested', '..');
    assert.equal(isUsingDefaultPublicUploadsDir(), true, 'normalized default retains the protected public-upload behavior');

    const customDirectory = path.join(process.cwd(), 'private-client-files');
    process.env.UPLOAD_DIR = customDirectory;
    process.env.DB_FILE_PATH = path.join(process.cwd(), 'private-data', 'runtime.json');
    assert.equal(getUploadsDirectory(), customDirectory);
    assert.equal(isUsingDefaultPublicUploadsDir(), false, 'a real custom directory is not mistaken for public uploads');
    assert.equal(getDatabaseFilePath(), process.env.DB_FILE_PATH, 'runtime database path remains configurable');
  } finally {
    if (oldUploads === undefined) delete process.env.UPLOAD_DIR; else process.env.UPLOAD_DIR = oldUploads;
    if (oldDatabase === undefined) delete process.env.DB_FILE_PATH; else process.env.DB_FILE_PATH = oldDatabase;
  }
});
