import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { users } from '@/infra/database/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, nickname, email, password } = await request.json();

    if (!firstName || !lastName || !nickname || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Check email uniqueness
    const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 409 });
    }

    // Check nickname uniqueness
    const existingNick = db.select({ id: users.id }).from(users).where(eq(users.nickname, nickname)).get();
    if (existingNick) {
      return NextResponse.json({ error: 'Este apelido já está em uso' }, { status: 409 });
    }

    // Insert new user
    const result = db.insert(users).values({
      firstName,
      lastName,
      nickname,
      email,
      password,
      amount: 0,
      role: 'user',
      deleted: 0,
    }).run();

    const newUser = db
      .select({
        id: users.id,
        nickname: users.nickname,
        firstName: users.firstName,
        lastName: users.lastName,
        amount: users.amount,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, Number(result.lastInsertRowid)))
      .get();

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
