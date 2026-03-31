import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infra/database/connection';
import { friendships, users } from '@/infra/database/schema';
import { eq, and, or, sql } from 'drizzle-orm';

// GET: list friends and pending requests
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });

  const uid = Number(userId);

  // Accepted friends
  const friends = db
    .select({
      friendshipId: friendships.id,
      friendId: sql<number>`CASE WHEN ${friendships.userId} = ${uid} THEN ${friendships.friendId} ELSE ${friendships.userId} END`.as('friendId'),
      firstName: sql<string>`CASE WHEN ${friendships.userId} = ${uid} THEN f.first_name ELSE u.first_name END`.as('firstName'),
      lastName: sql<string>`CASE WHEN ${friendships.userId} = ${uid} THEN f.last_name ELSE u.last_name END`.as('lastName'),
      nickname: sql<string>`CASE WHEN ${friendships.userId} = ${uid} THEN f.nickname ELSE u.nickname END`.as('nickname'),
      status: friendships.status,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(sql`users u`, sql`u.id = ${friendships.userId}`)
    .innerJoin(sql`users f`, sql`f.id = ${friendships.friendId}`)
    .where(
      and(
        or(eq(friendships.userId, uid), eq(friendships.friendId, uid)),
        eq(friendships.status, 'accepted')
      )
    )
    .all();

  // Pending requests received
  const pendingReceived = db
    .select({
      friendshipId: friendships.id,
      fromUserId: friendships.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      nickname: users.nickname,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.userId))
    .where(and(eq(friendships.friendId, uid), eq(friendships.status, 'pending')))
    .all();

  // Pending requests sent
  const pendingSent = db
    .select({
      friendshipId: friendships.id,
      toUserId: friendships.friendId,
      firstName: users.firstName,
      lastName: users.lastName,
      nickname: users.nickname,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.friendId))
    .where(and(eq(friendships.userId, uid), eq(friendships.status, 'pending')))
    .all();

  return NextResponse.json({ friends, pendingReceived, pendingSent });
}

// POST: send friend request by email
export async function POST(request: NextRequest) {
  try {
    const { userId, friendEmail } = await request.json();
    if (!userId || !friendEmail) return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });

    // Find friend by email
    const friend = db.select({ id: users.id, nickname: users.nickname }).from(users)
      .where(and(eq(users.email, friendEmail), eq(users.deleted, 0))).get();

    if (!friend) return NextResponse.json({ error: 'Usuário não encontrado com este e-mail' }, { status: 404 });
    if (friend.id === userId) return NextResponse.json({ error: 'Você não pode adicionar a si mesmo' }, { status: 400 });

    // Check if friendship already exists
    const existing = db.select({ id: friendships.id, status: friendships.status }).from(friendships)
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friend.id)),
          and(eq(friendships.userId, friend.id), eq(friendships.friendId, userId)),
        )
      ).get();

    if (existing) {
      if (existing.status === 'accepted') return NextResponse.json({ error: 'Vocês já são amigos!' }, { status: 409 });
      if (existing.status === 'pending') return NextResponse.json({ error: 'Pedido de amizade já enviado' }, { status: 409 });
      if (existing.status === 'rejected') {
        // Allow re-sending
        db.update(friendships).set({ status: 'pending', userId, friendId: friend.id }).where(eq(friendships.id, existing.id)).run();
        return NextResponse.json({ message: 'Pedido de amizade reenviado!' });
      }
    }

    db.insert(friendships).values({ userId, friendId: friend.id, status: 'pending' }).run();
    return NextResponse.json({ message: 'Pedido de amizade enviado!' }, { status: 201 });
  } catch (error) {
    console.error('Friend request error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH: accept or reject friend request
export async function PATCH(request: NextRequest) {
  try {
    const { friendshipId, action } = await request.json();
    if (!friendshipId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    db.update(friendships).set({ status: newStatus }).where(eq(friendships.id, friendshipId)).run();

    return NextResponse.json({ message: action === 'accept' ? 'Amizade aceita!' : 'Pedido rejeitado' });
  } catch (error) {
    console.error('Friendship update error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
