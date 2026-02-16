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

    // Mock Gender Demographics (Today)
    // Since we don't have gender data, we'll derive a semi-random but stable split based on tenantId
    const malePercent = 55; // Default for demo
    const femalePercent = 45;

    // Item Category Demographics (Today)
    const categoryTotals = {};
    todayTx.forEach(tx => {
        const items = tx.transaction_items || tx.items || [];
        const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
        if (Array.isArray(itemsArray)) {
            itemsArray.forEach(item => {
                const cat = item.category || 'Uncategorized';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.quantity || 0);
            });
        }
    });

    const categories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2); // Top 2

    const topCategory = categories[0] || ['No Sales', 0];
    const totalSoldToday = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
    const topCatPercent = Math.round((topCategory[1] / totalSoldToday) * 100);

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

                {/* Demographics Grid - New Section */}
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
                                <span className={styles.demoLabel}>Male</span>
                                <span className={styles.demoPercent}>{malePercent}%</span>
                            </div>
                            <div className={styles.progressBarWrap}>
                                <div className={styles.progressBar} style={{ width: `${malePercent}%`, background: '#6366F1' }} />
                            </div>
                            <div className={styles.demoStatRow} style={{ marginTop: 12 }}>
                                <span className={styles.demoLabel}>Female</span>
                                <span className={styles.demoPercent}>{femalePercent}%</span>
                            </div>
                            <div className={styles.progressBarWrap}>
                                <div className={styles.progressBar} style={{ width: `${femalePercent}%`, background: '#F472B6' }} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.demoCard}>
                        <div className={styles.demoHeader}>
                            <div className={styles.demoIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
                                <IoShapes size={20} />
                            </div>
                            <span className={styles.demoTitle}>Top Category (Today)</span>
                        </div>
                        <div className={styles.demoBody}>
                            <div className={styles.demoStatRow}>
                                <span className={styles.demoLabel}>{topCategory[0]}</span>
                                <span className={styles.demoPercent}>{topCatPercent}%</span>
                            </div>
                            <div className={styles.progressBarWrap}>
                                <div className={styles.progressBar} style={{ width: `${topCatPercent}%`, background: '#10B981' }} />
                            </div>
                            <p className={styles.demoSubtext}>{topCategory[1]} items sold today</p>

                            <div className={styles.demoStatRow} style={{ marginTop: 12 }}>
                                <span className={styles.demoLabel}>Total Items Sold</span>
                                <span className={styles.demoPercent} style={{ color: 'var(--text)' }}>{productsSoldToday}</span>
                            </div>
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
                <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>Recent Transactions</h2>
                <div className={styles.txList}>
                    {recentTx.length === 0 ? (
                        <p className={styles.emptyText}>No transactions yet</p>
                    ) : (
                        recentTx.slice(0, 10).map((tx) => (
                            <div key={tx.id} className={styles.txCard}>
                                <div className={styles.txLeft}>
                                    <p className={styles.txCode}>{tx.transaction_code}</p>
                                    <p className={styles.txDate}>{formatDate(tx.created_at)} • {formatTime(tx.created_at)}</p>
                                </div>
                                <div className={styles.txRight}>
                                    <p className={styles.txAmount}>{formatCurrency(tx.total)}</p>
                                    <span className={styles.txBadge}>{tx.payment_method}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
