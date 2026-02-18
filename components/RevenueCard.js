'use client';
import { useState } from 'react';
import { IoEyeOutline, IoEyeOffOutline, IoTrendingUp, IoTrendingDown } from 'react-icons/io5';
import styles from './RevenueCard.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

export default function RevenueCard({
    title = "Total Revenue",
    amount = 0,
    transactions = 0,
    productsSold = 0,
    trend = 0,
    trendLabel = "Today"
}) {
    const [visible, setVisible] = useState(true);
    const isPositive = trend >= 0;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
            </div>

            <div className={styles.amountRow}>
                <span className={styles.amount}>
                    {visible ? formatCurrency(amount) : '••••••••••'}
                </span>
                <button className={styles.eyeBtn} onClick={() => setVisible(!visible)}>
                    {visible ? <IoEyeOutline size={24} /> : <IoEyeOffOutline size={24} />}
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.leftStats}>
                    <span className={styles.statItem}>{transactions} Transactions</span>
                    <span className={styles.statItem}>{productsSold} Products sold</span>
                </div>

                <div className={styles.trendBadge}>
                    {isPositive ? <IoTrendingUp size={18} color="#4ADE80" /> : <IoTrendingDown size={18} color="#F87171" />}
                    <span className={styles.trendText}>
                        {Math.abs(trend)}% {trendLabel}
                    </span>
                </div>
            </div>
        </div>
    );
}
