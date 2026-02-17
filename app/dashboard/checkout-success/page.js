'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import styles from './success.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;

function SuccessContent() {
    const params = useSearchParams();
    const code = params.get('code') || 'N/A';
    const method = params.get('method') || 'Cash';
    const subtotal = Number(params.get('subtotal')) || 0;
    const discount = Number(params.get('discount')) || 0;
    const total = Number(params.get('total')) || 0;
    const male = params.get('male') || '0';
    const female = params.get('female') || '0';
    const itemsCount = params.get('items') || '0';
    const summary = params.get('summary') || '';

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrap}>
                    <IoCheckmarkCircle size={72} color="#10B981" />
                </div>
                <h1 className={styles.title}>Payment Successful!</h1>
                <p className={styles.subtitle}>Transaction completed successfully</p>

                <div className={styles.details}>
                    <div className={styles.row}>
                        <span className={styles.label}>Transaction Code</span>
                        <span className={styles.value}>{code}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Payment Method</span>
                        <span className={styles.value}>{method}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.row}>
                        <span className={styles.label}>Total Items</span>
                        <span className={styles.value}>{itemsCount} Items</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Payment</span>
                        <span className={styles.value}>{method}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Demographics</span>
                        <span className={styles.value}>{male} Male, {female} Female</span>
                    </div>
                    {summary && (
                        <div className={styles.row} style={{ marginTop: 8 }}>
                            <span className={styles.label} style={{ fontSize: '12px', opacity: 0.8 }}>Summary</span>
                            <span className={styles.value} style={{ fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>{summary}</span>
                        </div>
                    )}
                    <div className={styles.divider} />
                    <div className={styles.row}>
                        <span className={styles.label}>Subtotal</span>
                        <span className={styles.value}>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className={styles.row}>
                            <span className={styles.label}>Discount</span>
                            <span className={styles.discountValue}>-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    <div className={styles.divider} />
                    <div className={`${styles.row} ${styles.totalRow}`}>
                        <span>TOTAL</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                <Link href="/dashboard/pos" className={styles.backBtn}>
                    Back to POS
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /></div>}>
            <SuccessContent />
        </Suspense>
    );
}
