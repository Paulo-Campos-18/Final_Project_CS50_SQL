import { db } from '@/infra/database/connection';
import {
  games, platforms, keys, keyStatus, keyBatches, suppliers,
  orders, orderKeys, transactions, paymentMethod,
  gameRating, users,
} from '@/infra/database/schema';
import { eq, sql, count, sum, avg, and } from 'drizzle-orm';
import StatCard from '@/components/StatCard';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard — KeyVault',
  description: 'Admin dashboard with revenue analytics, key inventory, and business insights.',
};

async function getDashboardData() {
  // ─── Revenue per game (replicating the SQL view) ───
  const revenuePerGame = db
    .select({
      gameId: games.id,
      gameName: games.name,
      totalRevenue: sum(orderKeys.unitPrice).as('totalRevenue'),
    })
    .from(orderKeys)
    .innerJoin(keys, eq(orderKeys.keyId, keys.id))
    .innerJoin(games, eq(keys.gameId, games.id))
    .groupBy(games.id, games.name)
    .orderBy(sql`totalRevenue DESC`)
    .all();

  // ─── Cost per game ───
  const costPerGame = db
    .select({
      gameId: games.id,
      gameName: games.name,
      totalCost: sql<number>`SUM(${keyBatches.unitPrice} * ${keyBatches.quantity})`.as('totalCost'),
    })
    .from(games)
    .innerJoin(keyBatches, eq(keyBatches.gameId, games.id))
    .groupBy(games.id, games.name)
    .orderBy(sql`totalCost DESC`)
    .all();

  // ─── Profit per game ───
  const profitPerGame = revenuePerGame.map((rev) => {
    const cost = costPerGame.find((c) => c.gameId === rev.gameId);
    const revenue = Number(rev.totalRevenue ?? 0);
    const totalCost = Number(cost?.totalCost ?? 0);
    return {
      gameId: rev.gameId,
      gameName: rev.gameName,
      revenue,
      cost: totalCost,
      profit: revenue - totalCost,
    };
  });

  // ─── Most sold games ───
  const mostSold = db
    .select({
      gameName: games.name,
      soldCount: count(keys.id).as('soldCount'),
    })
    .from(games)
    .innerJoin(keys, eq(keys.gameId, games.id))
    .innerJoin(keyStatus, eq(keys.keyStatusId, keyStatus.id))
    .where(eq(keyStatus.status, 'Sold'))
    .groupBy(games.id)
    .orderBy(sql`soldCount DESC`)
    .all();

  // ─── Keys per status ───
  const keysPerStatus = db
    .select({
      status: keyStatus.status,
      count: count(keys.id).as('keyCount'),
    })
    .from(keyStatus)
    .leftJoin(keys, eq(keys.keyStatusId, keyStatus.id))
    .groupBy(keyStatus.id, keyStatus.status)
    .orderBy(sql`keyCount DESC`)
    .all();

  // ─── Keys by supplier ───
  const keysBySupplier = db
    .select({
      supplierName: suppliers.name,
      totalKeys: count(keys.id).as('totalKeys'),
      totalBatches: sql<number>`COUNT(DISTINCT ${keyBatches.id})`.as('totalBatches'),
    })
    .from(suppliers)
    .innerJoin(keyBatches, eq(keyBatches.supplierId, suppliers.id))
    .innerJoin(keys, eq(keys.batchId, keyBatches.id))
    .groupBy(suppliers.id)
    .orderBy(sql`totalKeys DESC`)
    .all();

  // ─── Payment method popularity ───
  const paymentMethodStats = db
    .select({
      methodName: paymentMethod.name,
      count: count(transactions.id).as('paymentCount'),
    })
    .from(paymentMethod)
    .innerJoin(transactions, eq(transactions.paymentMethodId, paymentMethod.id))
    .groupBy(paymentMethod.id)
    .orderBy(sql`paymentCount DESC`)
    .all();

  // ─── Top rated games ───
  const topRated = db
    .select({
      gameName: games.name,
      avgRating: avg(gameRating.rating).as('avgRating'),
      ratingCount: count(gameRating.id).as('ratingCount'),
    })
    .from(games)
    .innerJoin(gameRating, eq(games.id, gameRating.gameId))
    .groupBy(games.id)
    .orderBy(sql`avgRating DESC`)
    .all();

  // ─── Aggregate stats ───
  const totalGames = db.select({ count: count() }).from(games).where(eq(games.deleted, 0)).get();
  const totalUsers = db.select({ count: count() }).from(users).where(eq(users.deleted, 0)).get();
  const totalOrders = db.select({ count: count() }).from(orders).get();
  const totalRevenueAgg = db.select({ total: sum(transactions.totalPrice) }).from(transactions).where(eq(transactions.status, 'Sold')).get();
  const totalKeysCount = db.select({ count: count() }).from(keys).get();
  const overallProfit = profitPerGame.reduce((acc, g) => acc + g.profit, 0);

  return {
    profitPerGame,
    mostSold,
    keysPerStatus,
    keysBySupplier,
    paymentMethodStats,
    topRated,
    stats: {
      totalGames: totalGames?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
      totalOrders: totalOrders?.count ?? 0,
      totalRevenue: totalRevenueAgg?.total ? Number(totalRevenueAgg.total) : 0,
      totalKeys: totalKeysCount?.count ?? 0,
      overallProfit,
    },
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxSold = data.mostSold.length > 0 ? Math.max(...data.mostSold.map((g) => g.soldCount)) : 1;
  const maxKeys = data.keysBySupplier.length > 0 ? Math.max(...data.keysBySupplier.map((s) => s.totalKeys)) : 1;

  return (
    <main>
      <section className="section" style={{ paddingTop: '40px' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h1 className="section-title">📊 Dashboard</h1>
              <p className="section-subtitle">Business analytics and store performance metrics</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/dashboard/add-game" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                ➕ Add Game
              </Link>
              <Link href="/dashboard/restock" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                📦 Restock
              </Link>
            </div>
          </div>

          {/* Top Stats */}
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
            <StatCard icon="🎮" value={data.stats.totalGames} label="Total Games" color="purple" />
            <StatCard icon="👥" value={data.stats.totalUsers} label="Active Users" color="cyan" />
            <StatCard icon="🛒" value={data.stats.totalOrders} label="Total Orders" color="amber" />
            <StatCard
              icon="💰"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.stats.totalRevenue)}
              label="Total Revenue"
              color="green"
            />
            <StatCard icon="🔑" value={data.stats.totalKeys} label="Total Keys" color="pink" />
            <StatCard
              icon="📈"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.stats.overallProfit)}
              label="Overall Profit"
              color={data.stats.overallProfit >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Charts Grid */}
          <div className="dashboard-grid">
            {/* Profit per Game */}
            <div className="dashboard-card">
              <h3>💵 Profit Per Game</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Revenue</th>
                      <th>Cost</th>
                      <th>Profit</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.profitPerGame.map((g) => (
                      <tr key={g.gameId}>
                        <td>{g.gameName}</td>
                        <td style={{ color: 'var(--accent-success)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.revenue)}</td>
                        <td style={{ color: 'var(--accent-danger)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.cost)}</td>
                        <td style={{ color: g.profit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.profit)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link href={`/dashboard/edit-game/${g.gameId}`} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                            ✏️ Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Sold Games */}
            <div className="dashboard-card">
              <h3>🏆 Most Sold Games</h3>
              <div className="bar-chart">
                {data.mostSold.map((g) => (
                  <div key={g.gameName} className="bar-item">
                    <span className="bar-label" style={{ minWidth: '220px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{g.gameName}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.max((g.soldCount / maxSold) * 100, 15)}%` }}
                      >
                        {g.soldCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keys Per Status */}
            <div className="dashboard-card">
              <h3>🔑 Key Inventory</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.keysPerStatus.map((ks) => {
                  let badgeClass = 'badge-info';
                  let emoji = '🔵';
                  if (ks.status === 'Available') { badgeClass = 'badge-success'; emoji = '✅'; }
                  if (ks.status === 'Sold') { badgeClass = 'badge-warning'; emoji = '💰'; }
                  if (ks.status === 'Refunded') { badgeClass = 'badge-danger'; emoji = '↩️'; }
                  if (ks.status === 'Expired') { badgeClass = 'badge-info'; emoji = '⏰'; }

                  return (
                    <div key={ks.status} className="detail-info-row" style={{ borderColor: 'var(--border-color)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {emoji} {ks.status}
                      </span>
                      <span className={`badge ${badgeClass}`}>{ks.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suppliers */}
            <div className="dashboard-card">
              <h3>📦 Keys by Supplier</h3>
              <div className="bar-chart">
                {data.keysBySupplier.map((s) => (
                  <div key={s.supplierName} className="bar-item">
                    <span className="bar-label" style={{ minWidth: '180px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{s.supplierName}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.max((s.totalKeys / maxKeys) * 100, 15)}%`,
                          background: 'var(--gradient-cool)',
                        }}
                      >
                        {s.totalKeys} keys · {s.totalBatches} batches
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="dashboard-card">
              <h3>💳 Payment Methods</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.paymentMethodStats.map((pm) => (
                      <tr key={pm.methodName}>
                        <td>{pm.methodName}</td>
                        <td>
                          <span className="badge badge-info">{pm.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Rated */}
            <div className="dashboard-card">
              <h3>⭐ Top Rated Games</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Avg Rating</th>
                      <th>Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topRated.map((g) => (
                      <tr key={g.gameName}>
                        <td>{g.gameName}</td>
                        <td style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>
                          ⭐ {Number(g.avgRating).toFixed(1)}/10
                        </td>
                        <td>{g.ratingCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
