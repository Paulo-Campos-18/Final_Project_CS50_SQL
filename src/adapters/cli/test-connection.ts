import { db } from '../../infra/database/connection';
import { users } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Testing Database Connection and Drizzle Schema...');
  
  try {
    // Attempt an INSERT operation
    console.log('Attempting to insert a mock user...');
    const result = db.insert(users).values({
      firstName: 'Test',
      lastName: 'User',
      nickname: `test_user_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'mock_password_hash',
      amount: 0,
      deleted: 0
    }).returning().all();
    
    console.log('Insert successful:', result);
    
    // Attempt a DELETE operation
    if (result.length > 0) {
      console.log('Attempting to delete the mock user...');
      db.delete(users).where(eq(users.id, result[0].id)).run();
      console.log('Mock user deleted successfully.');
    }
    
    console.log('All DB operations OK!');
    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exit(1);
  }
}

main();
