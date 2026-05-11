import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { users } from '@/infra/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { hashPassword } from '@/infra/security/crypto';
import { rateLimit } from '@/infra/security/rateLimit';

const registerSchema = z.object({
  firstName: z.string().min(1).max(30).trim(),
  lastName:  z.string().min(1).max(30).trim(),
  nickname:  z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'Apelido só aceita letras, números, . _ -'),
  email:     z.string().email('Email inválido').max(100).toLowerCase(),
  password:  z.string().min(6, 'Senha precisa ter ao menos 6 caracteres').max(200),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Strict: 3 new accounts per hour per IP. Prevents mass-signup pollution.
  const rl = rateLimit('register:' + ip, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Muitos cadastros recentes deste IP. Tente novamente em ${Math.ceil(rl.retryInSeconds / 60)}min.` },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || 'Dados inválidos' },
        { status: 400 },
      );
    }
    const { firstName, lastName, nickname, email, password } = parsed.data;

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

    // Insert new user with hashed password — never store plain text from here on.
    const result = db.insert(users).values({
      firstName,
      lastName,
      nickname,
      email,
      password: hashPassword(password),
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
