'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';
import { voucherService, transactionService } from '@/services/api';
import { IoRemove, IoAdd, IoCloseCircle, IoManOutline, IoWomanOutline } from 'react-icons/io5';
import GradientButton from '@/components/GradientButton';
import styles from './cart.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;
const PAYMENT_METHODS = ['Cash', 'Debit Card', 'Credit Card', 'E-Wallet'];

export default function CartPage() {
    const { tenantId } = useContext(AuthContext);
    const {
        items, removeItem, updateQuantity, clearCart,
        voucher, applyVoucher, removeVoucher,
        maleCount, setMaleCount, femaleCount, setFemaleCount,
        paymentMethod, setPaymentMethod,
        subtotal, discount, total, itemCount,
    } = useContext(CartContext);
    const router = useRouter();
    const [vouchers, setVouchers] = useState([]);
    const [showVoucherPicker, setShowVoucherPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchVouchers = useCallback(async () => {
        if (!tenantId) return;
        try {
            const res = await voucherService.getVouchers(tenantId);
            setVouchers((res.data || []).filter((v) => v.is_active));
        } catch (err) {
            console.error(err);
        }
    }, [tenantId]);

    useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setLoading(true);
        try {
            const txData = {
                tenant_id: tenantId,
                items: items.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    price: i.price,
                })),
                subtotal,
                discount,
                total,
                payment_method: paymentMethod,
                male_count: maleCount,
                female_count: femaleCount,
                voucher_id: voucher?.id || null,
            };
            const res = await transactionService.createTransaction(txData);
            const transaction = res.data;
            clearCart();
            router.push(`/dashboard/checkout-success?code=${transaction.transaction_code}&method=${paymentMethod}&subtotal=${subtotal}&discount=${discount}&total=${total}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.headerTitle}>Cart</h1>
                </div>
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🛒</span>
                    <p>Your cart is empty</p>
                    <button className={styles.backBtn} onClick={() => router.push('/dashboard/pos')}>
                        Browse Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <h1 className={styles.headerTitle}>Cart</h1>
                <p className={styles.headerSub}>{itemCount} items</p>
            </div>

            <div className={styles.content}>
                <div className={styles.mainCol}>
                    {/* Items */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Order Items</h3>
                        <div className={styles.itemList}>
                            {items.map((item) => (
                                <div key={item.product_id} className={styles.itemCard}>
                                    <div className={styles.itemImageWrap}>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className={styles.itemImage} />
                                        ) : (
                                            <div className={styles.itemImagePlaceholder}>📦</div>
                                        )}
                                    </div>
                                    <div className={styles.itemInfo}>
                                        <p className={styles.itemName}>{item.title}</p>
                                        <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
                                    </div>
                                    <div className={styles.itemQty}>
                                        <button className={styles.qtyBtn} onClick={() => item.quantity === 1 ? removeItem(item.product_id) : updateQuantity(item.product_id, item.quantity - 1)}>
                                            <IoRemove size={14} />
                                        </button>
                                        <span className={styles.qtyValue}>{item.quantity}</span>
                                        <button className={`${styles.qtyBtn} ${styles.qtyBtnAdd}`} onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                                            <IoAdd size={14} />
                                        </button>
                                    </div>
                                    <button className={styles.removeBtn} onClick={() => removeItem(item.product_id)}>
                                        <IoCloseCircle size={22} color="#EF4444" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Voucher */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Voucher</h3>
                        {voucher ? (
                            <div className={styles.voucherApplied}>
                                <div>
                                    <p className={styles.voucherCode}>{voucher.code}</p>
                                    <p className={styles.voucherDiscount}>
                                        {voucher.discount_type === 'percentage' ? `${voucher.discount_amount}%` : formatCurrency(voucher.discount_amount)} off
                                    </p>
                                </div>
                                <button className={styles.removeVoucherBtn} onClick={removeVoucher}>Remove</button>
                            </div>
                        ) : (
                            <div>
                                <button className={styles.selectVoucherBtn} onClick={() => setShowVoucherPicker(!showVoucherPicker)}>
                                    Select Voucher
                                </button>
                                {showVoucherPicker && (
                                    <div className={styles.voucherList}>
                                        {vouchers.length === 0 ? (
                                            <p className={styles.noVouchers}>No active vouchers</p>
                                        ) : (
                                            vouchers.map((v) => (
                                                <button key={v.id} className={styles.voucherOption} onClick={() => { applyVoucher(v); setShowVoucherPicker(false); }}>
                                                    <span className={styles.voucherOptionCode}>{v.code}</span>
                                                    <span className={styles.voucherOptionName}>{v.name}</span>
                                                    <span className={styles.voucherOptionAmount}>
                                                        {v.discount_type === 'percentage' ? `${v.discount_amount}%` : formatCurrency(v.discount_amount)}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Customer Count */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Customer Count</h3>
                        <div className={styles.countRow}>
                            <div className={styles.countItem}>
                                <IoManOutline size={20} color="#3B82F6" />
                                <span>Male</span>
                                <div className={styles.countControls}>
                                    <button className={styles.countBtn} onClick={() => setMaleCount(Math.max(0, maleCount - 1))}>-</button>
                                    <span className={styles.countValue}>{maleCount}</span>
                                    <button className={styles.countBtn} onClick={() => setMaleCount(maleCount + 1)}>+</button>
                                </div>
                            </div>
                            <div className={styles.countItem}>
                                <IoWomanOutline size={20} color="#EC4899" />
                                <span>Female</span>
                                <div className={styles.countControls}>
                                    <button className={styles.countBtn} onClick={() => setFemaleCount(Math.max(0, femaleCount - 1))}>-</button>
                                    <span className={styles.countValue}>{femaleCount}</span>
                                    <button className={styles.countBtn} onClick={() => setFemaleCount(femaleCount + 1)}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Payment Method</h3>
                        <div className={styles.paymentGrid}>
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method}
                                    className={`${styles.paymentChip} ${paymentMethod === method ? styles.paymentChipActive : ''}`}
                                    onClick={() => setPaymentMethod(method)}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className={styles.summaryPanel}>
                    <div className={styles.summaryCard}>
                        <h3 className={styles.summaryTitle}>Order Summary</h3>
                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                                <span>Discount</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                        )}
                        <div className={styles.summaryDivider} />
                        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                        <GradientButton
                            title="Checkout"
                            loading={loading}
                            onClick={handleCheckout}
                            style={{ marginTop: 16 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
