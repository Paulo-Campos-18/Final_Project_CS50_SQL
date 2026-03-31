'use server';

import { db } from '@/infra/database/connection';
import { users } from '@/infra/database/schema';

export async function getAllUsers() {
  const data = db.select({
    id: users.id,
    nickname: users.nickname,
    firstName: users.firstName,
    lastName: users.lastName,
    amount: users.amount
  }).from(users).all();
  
  return data;
}
