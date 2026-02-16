'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { transactionService, productService, voucherService } from '@/services/api';
import RevenueCard from '@/components/RevenueCard';
import {
    IoReceipt,
    IoCube,
    IoLayers,
    IoTrendingUp
} from 'react-icons/io5';
import styles from './analytics.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;

export default function AnalyticsPage() {
    const { tenantId } = useContext(AuthContext);
    const [stats, setStats] = useState({
        revenue: 0,
        transactions: 0,
        productsSold: 0,
        totalStock: 0,
        salesByHour: Array(24).fill(0),
        itemsByHour: Array(24).fill(0),
        products: [],
        vouchers: []
    });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        try {
            const [txRes, prodRes, voucherRes] = await Promise.all([
                transactionService.getTransactions(tenantId),
                productService.getProducts(tenantId),
                voucherService.getVouchers(tenantId)
            ]);

            const transactions = txRes.data || [];
            const products = prodRes.data || [];
            const vouchers = voucherRes.data || [];

            // Calculate Stats
            const revenue = transactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

            // Per-transaction items calculation
            const txItemsCount = transactions.map(t => {
                const items = t.transaction_items || t.items || [];
                const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
                return Array.isArray(itemsArray) ? itemsArray.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
            });

            const productsSold = txItemsCount.reduce((a, b) => a + b, 0);
            const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

            // Sales & Items by Hour
            const salesByHour = Array(24).fill(0);
            const itemsByHour = Array(24).fill(0);

            transactions.forEach((t, index) => {
                const hour = new Date(t.created_at).getHours();
                if (hour >= 0 && hour < 24) {
                    salesByHour[hour] += (Number(t.total) || 0);
                    itemsByHour[hour] += txItemsCount[index];
                }
            });

            setStats({
                revenue,
                transactions: transactions.length,
                productsSold,
                totalStock,
                salesByHour,
                itemsByHour,
                products: products.sort((a, b) => a.stock - b.stock).slice(0, 5), // Low stock first
                vouchers
            });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    const maxSale = Math.max(...stats.salesByHour, 1);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <h1 className={styles.headerTitle}>Analytics</h1>
                <p className={styles.headerSub}>Business performance overview</p>
            </div>

            <div className={styles.content}>
                {/* Stat Cards */}
                <div className={styles.statGrid}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <RevenueCard
                            title="Total Revenue"
                            amount={stats.revenue}
                            transactions={stats.transactions}
                            productsSold={stats.productsSold}
                            trend={0}
                            trendLabel="All Time"
                        />
                    </div>
                </div>

                {/* Sales by Hour Chart */}
                <div className={styles.chartCard} style={{ marginTop: 24 }}>
                    <h3 className={styles.cardTitle}>Sales by Hour (Revenue)</h3>
                    <div className={styles.barChart}>
                        {stats.salesByHour.map((val, i) => (
                            <div key={i} className={styles.barCol} title={`${i}:00 - ${formatCurrency(val)}`}>
                                {stats.itemsByHour[i] > 0 && (
                                    <span className={styles.barTopLabel}>
                                        {stats.itemsByHour[i]} items
                                    </span>
                                )}
                                <div
                                    className={styles.bar}
                                    style={{
                                        height: `${Math.max((val / maxSale) * 100, 4)}%`,
                                        background: val > 0 ? (i % 2 === 0 ? '#6366F1' : '#22D3EE') : '#E5E7EB',
                                        width: '24px'
                                    }}
                                />
                                <span className={styles.barLabel}>{i}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.twoCol}>
                    {/* Active Vouchers */}
                    <div className={styles.chartCard}>
                        <h3 className={styles.cardTitle}>Active Vouchers</h3>
                        {stats.vouchers.length === 0 ? (
                            <p className={styles.emptyText}>No vouchers found</p>
                        ) : (
                            <div className={styles.voucherList}>
                                {stats.vouchers.map((v) => (
                                    <div key={v.id} className={styles.voucherRow}>
                                        <div>
                                            <p className={styles.voucherCode}>{v.code}</p>
                                            <p className={styles.voucherName}>{v.name}</p>
                                        </div>
                                        <span className={styles.voucherBadge}>
                                            {v.discount_type === 'percentage' ? `${v.discount_amount}%` : formatCurrency(v.discount_amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Low Stock Alert */}
                    <div className={styles.chartCard}>
                        <h3 className={styles.cardTitle}>Stock Levels (Lowest First)</h3>
                        {stats.products.length === 0 ? (
                            <p className={styles.emptyText}>No products found</p>
                        ) : (
                            <div className={styles.stockList}>
                                {stats.products.map((p) => (
                                    <div key={p.id} className={styles.stockRow}>
                                        <span className={styles.stockName}>{p.title}</span>
                                        <div className={styles.stockBarWrap}>
                                            <div
                                                className={styles.stockBar}
                                                style={{
                                                    width: `${Math.min((p.stock / 100) * 100, 100)}%`, // Relative to 100 for visualization
                                                    background: p.stock <= 5 ? 'var(--danger)' : 'var(--primary)',
                                                }}
                                            />
                                        </div>
                                        <span className={`${styles.stockCount} ${p.stock <= 5 ? styles.stockLow : ''}`}>
                                            {p.stock}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
