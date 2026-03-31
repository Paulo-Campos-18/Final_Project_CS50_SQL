const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath, { fileMustExist: true });

try {
  const gamesCount = db.prepare('SELECT count(*) as count FROM games').get().count;
  const usersCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  const genresCount = db.prepare('SELECT count(*) as count FROM genres').get().count;
  const platformsCount = db.prepare('SELECT count(*) as count FROM platforms').get().count;
  
  console.log('--- Database Stats ---');
  console.log('Games:', gamesCount);
  console.log('Users:', usersCount);
  console.log('Genres:', genresCount);
  console.log('Platforms:', platformsCount);
} catch (error) {
  console.error('Error querying database:', error.message);
} finally {
  db.close();
}
