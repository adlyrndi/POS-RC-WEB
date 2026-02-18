'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { transactionService, productService, voucherService, analyticsService } from '@/services/api';
import RevenueCard from '@/components/RevenueCard';
import {
    IoReceipt,
    IoCube,
    IoLayers,
    IoTrendingUp
} from 'react-icons/io5';
import styles from './analytics.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

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
            const [analyticsRes, txRes, prodRes, voucherRes] = await Promise.all([
                analyticsService.getAnalytics(tenantId),
                transactionService.getTransactions(tenantId),
                productService.getProducts(tenantId),
                voucherService.getVouchers(tenantId)
            ]);

            const analytics = analyticsRes.data;
            const transactions = txRes.data || [];
            const products = prodRes.data || [];
            const vouchers = voucherRes.data || [];

            // Use backend analytics for revenue and sales items
            const allTime = analytics.all_time;
            const revenue = allTime.revenue;
            const productsSold = allTime.product_sold;
            const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

            // Sales & Items by Hour
            const salesByHour = analytics.sales_by_hour;

            // Re-calculate itemsByHour since backend doesn't provide it yet (or we can use it from transactions)
            const itemsByHour = Array(24).fill(0);
            transactions.forEach(t => {
                const hour = new Date(t.created_at).getHours();
                const items = t.transaction_items || [];
                const qty = items.reduce((s, i) => s + (i.quantity || 0), 0);
                if (hour >= 0 && hour < 24) {
                    itemsByHour[hour] += qty;
                }
            });

            // Top Selling from Backend Inventory (sorted)
            const topSelling = (analytics.inventory || [])
                .slice(0, 3)
                .map(p => ({ name: p.title, qty: p.sold }));

            const maleTotal = allTime.demographics?.male || 0;
            const femaleTotal = allTime.demographics?.female || 0;
            const paymentStats = analytics.payment_stats || [];

            setStats({
                revenue,
                transactions: allTime.transactions,
                productsSold,
                totalStock,
                salesByHour,
                itemsByHour,
                products: products.sort((a, b) => a.stock - b.stock).slice(0, 5),
                vouchers,
                maleTotal,
                femaleTotal,
                paymentStats,
                topSelling
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
                {/* Revenue Card Row */}
                <div style={{ marginBottom: 24 }}>
                    <RevenueCard
                        title="Total Revenue"
                        amount={stats.revenue}
                        transactions={stats.transactions}
                        productsSold={stats.productsSold}
                        trend={0}
                        trendLabel="All Time"
                    />
                </div>

                {/* Demographics Card */}
                <div className={styles.chartCard}>
                    <h3 className={styles.cardTitle}>Customer Demographics</h3>
                    <div className={styles.gaugeWrapper}>
                        <div className={styles.svgContainer}>
                            <svg viewBox="0 0 200 120" className={styles.svgGauge}>
                                <defs>
                                    <linearGradient id="maleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#818CF8" />
                                        <stop offset="100%" stopColor="#3B82F6" />
                                    </linearGradient>
                                    <linearGradient id="femaleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#F472B6" />
                                        <stop offset="100%" stopColor="#EC4899" />
                                    </linearGradient>
                                </defs>
                                {/* Base track */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="#F3F4F6"
                                    strokeWidth="24"
                                    strokeLinecap="round"
                                />
                                {/* Female Segment (Right side, pink) */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="url(#femaleGradient)"
                                    strokeWidth="24"
                                    strokeLinecap="round"
                                    strokeDasharray={`${Math.PI * 80}`}
                                    strokeDashoffset="0"
                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                />
                                {/* Male Segment (Left side, blue) */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="url(#maleGradient)"
                                    strokeWidth="24"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(stats.maleTotal / (stats.maleTotal + stats.femaleTotal || 1)) * Math.PI * 80} ${Math.PI * 80}`}
                                    style={{ transition: 'stroke-dasharray 1s ease' }}
                                />
                            </svg>
                            <div className={styles.gaugeCenterInfo}>
                                <p className={styles.gaugeCenterTotal}>{stats.maleTotal + stats.femaleTotal}</p>
                                <p className={styles.gaugeCenterLabel}>Total Customers</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.demoLegend}>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: 'linear-gradient(to right, #818CF8, #3B82F6)' }} />
                            <span className={styles.legendText}>
                                Male: <strong>{stats.maleTotal}</strong> ({Math.round((stats.maleTotal / (stats.maleTotal + stats.femaleTotal || 1)) * 100)}%)
                            </span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: 'linear-gradient(to right, #F472B6, #EC4899)' }} />
                            <span className={styles.legendText}>
                                Female: <strong>{stats.femaleTotal}</strong> ({Math.round((stats.femaleTotal / (stats.maleTotal + stats.femaleTotal || 1)) * 100)}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sales by Hour Chart */}
                <div className={styles.chartCard}>
                    <h3 className={styles.cardTitle}>Sales by Hour (Revenue)</h3>
                    <div className={styles.chartContainer}>
                        <div className={styles.barChart}>
                            {stats.salesByHour.map((val, i) => (
                                <div key={i} className={styles.barCol} title={`${i}:00 - ${formatCurrency(val)}`}>
                                    {stats.itemsByHour[i] > 0 && (
                                        <span className={styles.barTopLabel}>
                                            {stats.itemsByHour[i]}
                                        </span>
                                    )}
                                    <div
                                        className={styles.bar}
                                        style={{
                                            '--val': `${(val / maxSale) * 100}%`,
                                            background: val > 0 ? (i % 2 === 0 ? '#6366F1' : '#22D3EE') : '#E5E7EB',
                                            minHeight: val > 0 ? '4px' : '0'
                                        }}
                                    />
                                    <span className={styles.barLabel}>{i}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className={styles.chartCard}>
                    <h3 className={styles.cardTitle}>Top Selling Products</h3>
                    <div className={styles.podiumChart}>
                        {stats.topSelling.map((p, i) => {
                            const maxQty = stats.topSelling[0]?.qty || 1;
                            const height = (p.qty / maxQty) * 100;
                            const colors = [
                                'linear-gradient(135deg, #F59E0B, #D97706)', // Gold/Orange
                                'linear-gradient(135deg, #6366F1, #4F46E5)', // Indigo
                                'linear-gradient(135deg, #10B981, #059669)', // Emerald
                                'linear-gradient(135deg, #EC4899, #DB2777)', // Pink
                                'linear-gradient(135deg, #6B7280, #4B5563)'  // Gray
                            ];
                            return (
                                <div key={i} className={styles.podiumCol}>
                                    <div className={styles.podiumBarWrapper}>
                                        <div className={styles.podiumLabelTop}>{p.qty}</div>
                                        <div
                                            className={styles.podiumBar}
                                            style={{
                                                height: `${height}%`,
                                                background: colors[i] || colors[4]
                                            }}
                                        />
                                        <div className={styles.podiumRank}>{i + 1}</div>
                                    </div>
                                    <span className={styles.podiumName}>{p.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
