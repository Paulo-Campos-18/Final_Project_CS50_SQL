const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
console.log('Initializing database at:', dbPath);

// Remove the DB file if it exists so we start fresh with the schema
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath, { fileMustExist: false });

const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

try {
  console.log('Executing schema.sql...');
  db.exec(schemaSql);
  console.log('Database schema created successfully!');
} catch (error) {
  console.error('Error creating database schema:', error);
  process.exit(1);
}

db.close();
