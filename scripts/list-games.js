const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath, { fileMustExist: true });

try {
  const games = db.prepare('SELECT name FROM games').all();
  console.log('--- Game Names ---');
  games.forEach(g => console.log('- ' + g.name));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
