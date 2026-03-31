import { db } from '@/infra/database/connection';
import { users, orders, transactions, wishlist } from '@/infra/database/schema';
import { eq, count, sum, sql } from 'drizzle-orm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users — KeyVault',
  description: 'View all registered users on KeyVault.',
};

async function getUsersData() {
  const allUsers = db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      nickname: users.nickname,
      email: users.email,
      amount: users.amount,
      createdAt: users.createdAt,
      deleted: users.deleted,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} ASC`)
    .all();

  // Get order counts and total spent per user
  const usersWithStats = allUsers.map((user) => {
    const orderCount = db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .get();

    const totalSpent = db
      .select({ total: sum(transactions.totalPrice) })
      .from(transactions)
      .innerJoin(orders, eq(transactions.orderId, orders.id))
      .where(eq(orders.userId, user.id))
      .get();

    const wishlistCount = db
      .select({ count: count() })
      .from(wishlist)
      .where(eq(wishlist.userId, user.id))
      .get();

    return {
      ...user,
      orderCount: orderCount?.count ?? 0,
      totalSpent: totalSpent?.total ? Number(totalSpent.total) : 0,
      wishlistCount: wishlistCount?.count ?? 0,
    };
  });

  return usersWithStats;
}

export default async function UsersPage() {
  const usersData = await getUsersData();
  const activeUsers = usersData.filter((u) => u.deleted === 0);
  const deletedUsers = usersData.filter((u) => u.deleted === 1);

  return (
    <main>
      <section className="section" style={{ paddingTop: '40px' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h1 className="section-title">👥 Users</h1>
              <p className="section-subtitle">
                {activeUsers.length} active users · {deletedUsers.length} deleted accounts
              </p>
            </div>
          </div>

          {/* Active Users */}
          <div className="user-grid">
            {activeUsers.map((user) => (
              <div key={user.id} className="user-card" id={`user-card-${user.id}`}>
                <div className="user-avatar">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3>{user.firstName} {user.lastName}</h3>
                  <p className="user-nickname">@{user.nickname}</p>
                  <p className="user-email">{user.email}</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-success">💰 ${user.amount.toFixed(2)}</span>
                    <span className="badge badge-info">🛒 {user.orderCount} orders</span>
                    <span className="badge badge-warning">❤️ {user.wishlistCount} wishlist</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deleted Users */}
          {deletedUsers.length > 0 && (
            <div style={{ marginTop: '48px' }}>
              <h2 className="section-title" style={{ fontSize: '1.3rem', marginBottom: '20px' }}>
                🗑️ Deleted Accounts
              </h2>
              <div className="user-grid">
                {deletedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-card"
                    style={{ opacity: 0.5 }}
                    id={`deleted-user-${user.id}`}
                  >
                    <div className="user-avatar" style={{ background: 'var(--bg-tertiary)' }}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="user-info">
                      <h3>{user.firstName} {user.lastName}</h3>
                      <p className="user-nickname">@{user.nickname}</p>
                      <span className="badge badge-danger">Deleted</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
