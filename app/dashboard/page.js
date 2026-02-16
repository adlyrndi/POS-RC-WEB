'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { transactionService, productService } from '@/services/api';
import RevenueCard from '@/components/RevenueCard';
import {
    IoReceipt,
    IoCube,
    IoLayers
} from 'react-icons/io5';
import styles from './home.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;

export default function DashboardHome() {
    const { user, tenantId } = useContext(AuthContext);
    const [recentTx, setRecentTx] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            try {
                const [txRes, prodRes] = await Promise.all([
                    transactionService.getTransactions(tenantId),
                    productService.getProducts(tenantId)
                ]);
                setRecentTx(txRes.data || []);
                setProducts(prodRes.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId]);

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    // Helper to check if date is today
    const isToday = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Helper to check if date is yesterday
    const isYesterday = (dateString) => {
        const date = new Date(dateString);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
    };

    // Calculate Dashboard Data
    const todayTx = recentTx.filter(t => isToday(t.created_at));
    const yesterdayTx = recentTx.filter(t => isYesterday(t.created_at));

    const revenueToday = todayTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const revenueYesterday = yesterdayTx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    // Percentage Change
    const revChange = revenueYesterday === 0 ? 100 : Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100);

    // Items Sold Today Calculation
    const productsSoldToday = todayTx.reduce((sum, t) => {
        const items = t.transaction_items || t.items || [];
        const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
        return sum + (Array.isArray(itemsArray) ? itemsArray.reduce((s, i) => s + (i.quantity || 0), 0) : 0);
    }, 0);

    // Top Selling Today Logic
    const productSalesToday = {};
    todayTx.forEach(t => {
        const items = t.transaction_items || t.items || [];
        const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
        if (Array.isArray(itemsArray)) {
            itemsArray.forEach(i => {
                const id = i.product_id;
                if (!productSalesToday[id]) {
                    productSalesToday[id] = { ...i, sold: 0, revenue: 0 };
                }
                productSalesToday[id].sold += (i.quantity || 0);
                productSalesToday[id].revenue += (i.subtotal || i.price * i.quantity || 0);
            });
        }
    });

    const topSelling = Object.values(productSalesToday)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

    const transactionsAllTime = recentTx.length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.welcome}>Welcome back, {user?.name || 'Admin'}!</h1>
                    <p className={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.avatar}>{user?.name?.[0] || 'A'}</div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className={styles.statsGrid}>
                {/* 3D Revenue Card */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <RevenueCard
                        title="Today's Revenue"
                        amount={revenueToday}
                        transactions={todayTx.length}
                        productsSold={productsSoldToday}
                        trend={revChange}
                        trendLabel="Today"
                    />
                </div>

                {/* Other Stats */}
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#EEF2FF', color: '#6366F1' }}>
                            <IoReceipt size={24} />
                        </div>
                        <span className={styles.statLabel}>Transactions</span>
                    </div>
                    <div className={styles.statValue}>{transactionsAllTime}</div>
                    <span className={styles.statSub}>Total All Time</span>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
                            <IoCube size={24} />
                        </div>
                        <span className={styles.statLabel}>Total Products</span>
                    </div>
                    <div className={styles.statValue}>{products.length}</div>
                    <span className={styles.statSub}>Active Items</span>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon} style={{ background: '#FFF7ED', color: '#F97316' }}>
                            <IoLayers size={24} />
                        </div>
                        <span className={styles.statLabel}>Low Stock</span>
                    </div>
                    <div className={styles.statValue}>{products.filter(p => p.stock < 10).length}</div>
                    <span className={styles.statSub}>Items need reorder</span>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Left Col: Recent Transactions */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3>Recent Transactions</h3>
                        <Link href="/dashboard/transactions" className={styles.seeAll}>See All</Link>
                    </div>
                    <div className={styles.transactionList}>
                        {recentTx.slice(0, 5).map((tx) => (
                            <div key={tx.id} className={styles.transactionItem}>
                                <div className={styles.txIcon}>
                                    <IoReceipt size={18} color="#64748B" />
                                </div>
                                <div className={styles.txInfo}>
                                    <p className={styles.txCode}>{tx.transaction_code}</p>
                                    <p className={styles.txDate}>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className={styles.txAmount}>{formatCurrency(tx.total)}</div>
                            </div>
                        ))}
                        {recentTx.length === 0 && <p className={styles.emptyText}>No transactions yet</p>}
                    </div>
                </div>

                {/* Right Col: Top Selling Today */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3>Top Selling (Today)</h3>
                    </div>
                    <div className={styles.topList}>
                        {topSelling.length === 0 ? (
                            <p className={styles.emptyText}>No sales today</p>
                        ) : (
                            topSelling.map((item, index) => (
                                <div key={index} className={styles.topItem}>
                                    <div className={styles.topRank}>{index + 1}</div>
                                    <div className={styles.topInfo}>
                                        <p className={styles.topName}>{item.product_title || item.title}</p>
                                        <p className={styles.topSold}>{item.sold} sold</p>
                                    </div>
                                    <div className={styles.topRevenue}>{formatCurrency(item.revenue)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
