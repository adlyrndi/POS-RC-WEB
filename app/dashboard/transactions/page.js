'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { transactionService } from '@/services/api';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import styles from './transactions.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function TransactionHistoryPage() {
    const searchParams = useSearchParams();
    const { tenantId } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const fetchTransactions = useCallback(async () => {
        if (!tenantId) return;
        try {
            const res = await transactionService.getTransactions(tenantId);
            const sorted = (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setTransactions(sorted);

            // Handle query param for detail expansion
            const targetId = searchParams.get('id');
            if (targetId) {
                setExpandedId(targetId);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, searchParams]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <h1 className={styles.headerTitle}>Transactions</h1>
                <p className={styles.headerSub}>{transactions.length} total</p>
            </div>

            <div className={styles.content}>
                {transactions.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📋</span>
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className={styles.txList}>
                        {transactions.map((tx) => {
                            const isExpanded = expandedId?.toString() === tx.id.toString();
                            return (
                                <div key={tx.id} className={styles.txCard}>
                                    <button className={styles.txHeader} onClick={() => setExpandedId(isExpanded ? null : tx.id)}>
                                        <div className={styles.txLeft}>
                                            <p className={styles.txCode}>{tx.transaction_code}</p>
                                            <p className={styles.txDate}>{formatDate(tx.created_at)} • {formatTime(tx.created_at)}</p>
                                        </div>
                                        <div className={styles.txRight}>
                                            <p className={styles.txTotal}>{formatCurrency(tx.total)}</p>
                                            <span className={styles.txBadge}>{tx.payment_method}</span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className={styles.details}>
                                            <h4 className={styles.detailsTitle}>Transaction Details</h4>

                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Order ID</span>
                                                <span className={styles.detailValue}>{tx.transaction_code}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Date</span>
                                                <span className={styles.detailValue}>{formatDate(tx.created_at)}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Time</span>
                                                <span className={styles.detailValue}>{formatTime(tx.created_at)}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Total Items</span>
                                                <span className={styles.detailValue}>{(tx.transaction_items || []).reduce((a, c) => a + c.quantity, 0)} Items</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Payment</span>
                                                <span className={styles.detailValue}>{tx.payment_method}</span>
                                            </div>
                                            {(tx.male_count > 0 || tx.female_count > 0) && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Demographics</span>
                                                    <span className={styles.detailValue}>{tx.male_count} Male, {tx.female_count} Female</span>
                                                </div>
                                            )}

                                            <div className={styles.divider} />

                                            {(tx.transaction_items || []).map((ti, idx) => (
                                                <div key={idx} className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>{ti.quantity}x {ti.product_title}</span>
                                                    <span className={styles.detailValue}>{formatCurrency(ti.subtotal)}</span>
                                                </div>
                                            ))}

                                            <div className={styles.divider} />

                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Subtotal</span>
                                                <span className={styles.detailValue}>{formatCurrency(tx.subtotal)}</span>
                                            </div>
                                            {tx.discount > 0 && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Discount</span>
                                                    <span className={styles.detailValueDanger}>-{formatCurrency(tx.discount)}</span>
                                                </div>
                                            )}
                                            <div className={styles.totalRow}>
                                                <span>TOTAL</span>
                                                <span>{formatCurrency(tx.total)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.expandHint}>
                                        {isExpanded ? <IoChevronUp size={16} color="#64748B" /> : <IoChevronDown size={16} color="#64748B" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
