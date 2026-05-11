const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'store.db');
console.log('Initializing database at:', dbPath);

// Remove the DB file if it exists so we start fresh
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Old database removed.');
}

const db = new Database(dbPath, { fileMustExist: false });

// 1. Create schema
const schemaPath = path.join(root, 'docs', 'sql', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
try {
  console.log('Executing schema.sql...');
  db.exec(schemaSql);
  console.log('Schema created successfully!');
} catch (error) {
  console.error('Error creating schema:', error);
  process.exit(1);
}

// 2. Seed data (only the INSERT portion)
const queriesPath = path.join(root, 'docs', 'sql', 'queries.sql');
const queries = fs.readFileSync(queriesPath, 'utf-8');
const insertsText = queries.split('--Inserts')[1];
if (insertsText) {
  try {
    console.log('Seeding database...');
    db.exec(insertsText);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
} else {
  console.log('No inserts found in queries.sql.');
}

// 3. Hash any plain-text password seeded by queries.sql.
// queries.sql ships with plain passwords for readability; we never want plain
// in the DB at rest. bcryptjs is required regardless of TS/JS context.
try {
  const bcrypt = require('bcryptjs');
  const rows = db.prepare('SELECT id, password FROM users').all();
  const update = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  let migrated = 0;
  for (const u of rows) {
    if (typeof u.password === 'string' && u.password.startsWith('$2')) continue;
    update.run(bcrypt.hashSync(u.password, 10), u.id);
    migrated++;
  }
  console.log(`Passwords hashed: ${migrated}/${rows.length}`);
} catch (e) {
  console.error('Failed to hash seeded passwords:', e);
  process.exit(1);
}

db.close();
console.log('Done!');
