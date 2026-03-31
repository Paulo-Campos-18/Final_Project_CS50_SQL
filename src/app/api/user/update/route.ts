import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { users } from '@/infra/database/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const { userId, firstName, lastName, nickname } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const existing = db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check nickname uniqueness if changing
    if (nickname) {
      const nickExists = db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.nickname, nickname))
        .get();
      if (nickExists && nickExists.id !== userId) {
        return NextResponse.json({ error: 'Este apelido já está em uso' }, { status: 409 });
      }
    }

    // Build update
    const updateData: Record<string, string> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (nickname) updateData.nickname = nickname;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 });
    }

    db.update(users).set(updateData).where(eq(users.id, userId)).run();

    const updatedUser = db
      .select({
        id: users.id,
        nickname: users.nickname,
        firstName: users.firstName,
        lastName: users.lastName,
        amount: users.amount,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
