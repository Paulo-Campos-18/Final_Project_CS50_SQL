import db from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const sqlite = new db(path.resolve(process.cwd(), 'store.db'));

// Split the queries file and only execute the Inserts part.
const queries = fs.readFileSync(path.resolve(process.cwd(), 'queries.sql'), 'utf-8');
const insertsText = queries.split('--Inserts')[1];

if (insertsText) {
  try {
    sqlite.exec(insertsText);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Failed to seed:', error);
  }
} else {
  console.log('No inserts found.');
}
