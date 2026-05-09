import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { users } from '@/infra/database/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Admin-only login endpoint.
 * Returns 403 for non-admin accounts so the public /login flow stays separated
 * from the admin panel access.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = db
      .select({
        id: users.id,
        nickname: users.nickname,
        firstName: users.firstName,
        lastName: users.lastName,
        amount: users.amount,
        role: users.role,
        password: users.password,
      })
      .from(users)
      .where(and(eq(users.email, email), eq(users.deleted, 0)))
      .get();

    if (!user) {
      return NextResponse.json({ error: 'Conta administrativa não encontrada' }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Esta conta não tem privilégios administrativos.' },
        { status: 403 },
      );
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
