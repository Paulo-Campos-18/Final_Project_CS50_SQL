import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { users } from '@/infra/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { verifyPassword, hashPassword } from '@/infra/security/crypto';
import { rateLimit } from '@/infra/security/rateLimit';

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('login:' + ip, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${rl.retryInSeconds}s.` },
      { status: 429 },
    );
  }
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }
    const { email, password } = parsed.data;

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
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const verify = verifyPassword(password, user.password);
    if (!verify.ok) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // User-side login: do not allow administrators in here.
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Esta conta é administrativa. Use o painel de administrador (/admin/login).' },
        { status: 403 },
      );
    }

    // Silently upgrade legacy plain-text passwords to bcrypt.
    if (verify.needsRehash) {
      db.update(users).set({ password: hashPassword(password) }).where(eq(users.id, user.id)).run();
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
