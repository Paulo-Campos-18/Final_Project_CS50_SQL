const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath, { fileMustExist: true });

try {
  const gamesInView = db.prepare('SELECT name, available_keys FROM available_keys_per_game').all();
  console.log('--- Games in available_keys_per_game View ---');
  gamesInView.forEach(g => console.log('- ' + g.name + ': ' + g.available_keys));
} catch (error) {
  console.error('Error querying view:', error.message);
} finally {
  db.close();
}
