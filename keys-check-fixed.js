const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath, { fileMustExist: true });

try {
  const stats = db.prepare('SELECT g.name, COUNT(k.id) as key_count FROM games g LEFT JOIN keys k ON g.id = k.game_id GROUP BY g.id').all();
  
  console.log('--- Keys per Game ---');
  stats.forEach(s => {
    console.log('- ' + s.name + ': ' + s.key_count + ' keys');
  });
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
