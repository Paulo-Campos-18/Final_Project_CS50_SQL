const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath, { fileMustExist: true });

try {
  // 1. Get all games that have 0 keys
  const gamesWithNoKeys = db.prepare(\`
    SELECT g.id, g.name, g.active_platform_id, g.price
    FROM games g
    LEFT JOIN keys k ON g.id = k.game_id
    GROUP BY g.id
    HAVING COUNT(k.id) = 0
  \`).all();

  console.log('Found ' + gamesWithNoKeys.length + ' games with no keys.');

  // 2. Function to generate a random key code
  const generateKey = (gameName) => {
    const prefix = gameName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'G');
    const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return prefix + '-' + randomPart() + '-' + randomPart() + '-' + randomPart();
  };

  const insertBatch = db.prepare('INSERT INTO key_batches (game_id, supplier_id, unit_price, quantity) VALUES (?, ?, ?, ?)');
  const insertKey = db.prepare('INSERT INTO keys (game_id, batch_id, key_status_id, key_code) VALUES (?, ?, ?, ?)');

  db.transaction(() => {
    for (const game of gamesWithNoKeys) {
      // Find a supplier for the game's platform
      const supplier = db.prepare('SELECT id FROM suppliers WHERE platform_id = ?').get(game.active_platform_id);
      
      // If no supplier for that platform, just use the first available supplier
      const supplierId = supplier ? supplier.id : 1;
      
      // Create a batch of 10 keys
      const quantity = 10;
      const unitPrice = parseFloat((game.price * 0.5).toFixed(2)); // Wholesale price 50% of retail
      
      const result = insertBatch.run(game.id, supplierId, unitPrice, quantity);
      const batchId = result.lastInsertRowid;

      // Add 10 keys to the batch
      for (let i = 0; i < quantity; i++) {
        const keyStatusId = 1; // Available
        const keyCode = generateKey(game.name) + '-' + i;
        insertKey.run(game.id, batchId, keyStatusId, keyCode);
      }
      
      console.log('Added 10 keys for: ' + game.name);
    }
  })();

  console.log('Seeding of missing keys completed successfully!');

} catch (error) {
  console.error('Error seeding keys:', error.message);
} finally {
  db.close();
}
