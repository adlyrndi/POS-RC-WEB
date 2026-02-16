'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { transactionService } from '@/services/api';
import { IoBarChart, IoCube, IoReceipt, IoPeople, IoShapes } from 'react-icons/io5';
import RevenueCard from '@/components/RevenueCard';
import styles from './home.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;

export default function DashboardHome() {
    const { tenantId, tenantName, user } = useContext(AuthContext);
    const [recentTx, setRecentTx] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        try {
            const { data } = await transactionService.getTransactions(tenantId);
            const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setRecentTx(sorted);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    // Today's Data Calculation
    const isToday = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const todayTx = recentTx.filter(t => isToday(t.created_at));
    const revenueToday = todayTx.reduce((acc, tx) => acc + (Number(tx.total) || 0), 0);
    const transactionsToday = todayTx.length;

    // Items Sold Today
    const productsSoldToday = todayTx.reduce((acc, tx) => {
        const items = tx.transaction_items || tx.items || [];
        const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
        return acc + (Array.isArray(itemsArray) ? itemsArray.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0);
    }, 0);

    // Item Product Demographics (Today)
    const itemTotals = {};
    todayTx.forEach(tx => {
        const items = tx.transaction_items || tx.items || [];
        const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
        if (Array.isArray(itemsArray)) {
            itemsArray.forEach(item => {
                const title = item.product_title || item.title || 'Unknown Product';
                itemTotals[title] = (itemTotals[title] || 0) + (item.quantity || 0);
            });
        }
    });

    const topItems = Object.entries(itemTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2); // Get top 2 best sellers

    // Mock Gender Demographics (Today)
    const totalSoldToday = productsSoldToday || 1;
    const maleCount = Math.ceil(totalSoldToday * 0.55);
    const femaleCount = totalSoldToday - maleCount;
    const malePercent = Math.round((maleCount / totalSoldToday) * 100);
    const femalePercent = 100 - malePercent;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <div className={styles.headerContent}>
                    <div>
                        <p className={styles.greeting}>Welcome back 👋</p>
                        <h1 className={styles.userName}>{tenantName || user?.name || 'Admin'}</h1>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* 3D Revenue Section */}
                <div style={{ marginBottom: 24 }}>
                    <RevenueCard
                        title="Today's Performance"
                        amount={revenueToday}
                        transactions={transactionsToday}
                        productsSold={productsSoldToday}
                        trend={0}
                        trendLabel="Today"
                    />
                </div>

                {/* Demographics Grid - Re-Updated Section */}
                <div className={styles.demoGrid}>
                    <div className={styles.demoCard}>
                        <div className={styles.demoHeader}>
                            <div className={styles.demoIcon} style={{ background: '#EEF2FF', color: '#6366F1' }}>
                                <IoPeople size={20} />
                            </div>
                            <span className={styles.demoTitle}>Buyer Gender (Today)</span>
                        </div>
                        <div className={styles.demoBody}>
                            <div className={styles.demoStatRow}>
                                <span className={styles.demoLabel}>Male ({maleCount})</span>
                                <span className={styles.demoPercent} style={{ color: '#6366F1' }}>{malePercent}%</span>
                            </div>
                            <div className={styles.progressBarWrap}>
                                <div className={styles.progressBar} style={{ width: `${malePercent}%`, background: 'linear-gradient(90deg, #6366F1, #818CF8)' }} />
                            </div>
                            <div className={styles.demoStatRow} style={{ marginTop: 12 }}>
                                <span className={styles.demoLabel}>Female ({femaleCount})</span>
                                <span className={styles.demoPercent} style={{ color: '#22D3EE' }}>{femalePercent}%</span>
                            </div>
                            <div className={styles.progressBarWrap}>
                                <div className={styles.progressBar} style={{ width: `${femalePercent}%`, background: 'linear-gradient(90deg, #22D3EE, #67E8F9)' }} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.demoCard}>
                        <div className={styles.demoHeader}>
                            <div className={styles.demoIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
                                <IoShapes size={20} />
                            </div>
                            <span className={styles.demoTitle}>Top Products (Today)</span>
                        </div>
                        <div className={styles.demoBody}>
                            {topItems.length === 0 ? (
                                <p className={styles.emptyText}>No sales yet</p>
                            ) : (
                                topItems.map(([name, sold], idx) => {
                                    const percent = Math.round((sold / totalSoldToday) * 100);
                                    return (
                                        <div key={name} style={{ marginTop: idx === 0 ? 0 : 12 }}>
                                            <div className={styles.demoStatRow}>
                                                <span className={styles.demoLabel} style={{ maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {name}
                                                </span>
                                                <span className={styles.demoPercent}>{percent}%</span>
                                            </div>
                                            <div className={styles.progressBarWrap}>
                                                <div
                                                    className={styles.progressBar}
                                                    style={{
                                                        width: `${percent}%`,
                                                        background: idx === 0 ? 'linear-gradient(90deg, #1E3A8A, #1E40AF)' : 'linear-gradient(90deg, #3B82F6, #60A5FA)'
                                                    }}
                                                />
                                            </div>
                                            <p className={styles.demoSubtext}>{sold} sold today</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Access */}
                <h2 className={styles.sectionTitle}>Quick Access</h2>
                <div className={styles.quickGrid}>
                    <Link href="/dashboard/analytics" className={styles.quickCard}>
                        <IoBarChart size={24} color="#2563EB" />
                        <span>Analytics</span>
                    </Link>
                    <Link href="/dashboard/products" className={styles.quickCard}>
                        <IoCube size={24} color="#6366F1" />
                        <span>Edit Stock</span>
                    </Link>
                    <Link href="/dashboard/transactions" className={styles.quickCard}>
                        <IoReceipt size={24} color="#10B981" />
                        <span>Transactions</span>
                    </Link>
                </div>

                {/* Recent Transactions */}
                <div className={styles.sectionHeader} style={{ marginTop: 32 }}>
                    <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                    <Link href="/dashboard/transactions" className={styles.seeAll}>
                        See All
                    </Link>
                </div>

                <div className={styles.txList}>
                    {recentTx.length === 0 ? (
                        <p className={styles.emptyText}>No transactions yet</p>
                    ) : (
                        recentTx.slice(0, 10).map((tx) => (
                            <Link
                                href={`/dashboard/transactions?id=${tx.id}`}
                                key={tx.id}
                                className={styles.txCard}
                            >
                                <div className={styles.txLeft}>
                                    <p className={styles.txCode}>{tx.transaction_code}</p>
                                    <p className={styles.txDate}>{formatDate(tx.created_at)} • {formatTime(tx.created_at)}</p>
                                </div>
                                <div className={styles.txRight}>
                                    <p className={styles.txAmount}>{formatCurrency(tx.total)}</p>
                                    <span className={styles.txBadge}>{tx.payment_method}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
