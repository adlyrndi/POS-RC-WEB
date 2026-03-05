'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';
import { voucherService, transactionService, getImageUrl } from '@/services/api';
import { IoRemove, IoAdd, IoCloseCircle, IoManOutline, IoWomanOutline, IoCashOutline, IoCardOutline, IoQrCodeOutline, IoTicketOutline, IoCheckmarkCircle } from 'react-icons/io5';
import GradientButton from '@/components/GradientButton';
import Modal from '@/components/Modal';
import styles from './cart.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;
const PAYMENT_METHODS = [
    { id: 'Cash', label: 'Cash', icon: IoCashOutline },
    { id: 'Debit', label: 'Debit', icon: IoCardOutline },
    { id: 'CC', label: 'Credit Card', icon: IoCardOutline },
    { id: 'QRIS', label: 'QRIS', icon: IoQrCodeOutline },
];

export default function CartPage() {
    const { tenantId } = useContext(AuthContext);
    const {
        items, removeItem, updateQuantity, clearCart,
        voucher, eventVoucher, applyVoucher, removeVoucher,
        maleCount, setMaleCount, femaleCount, setFemaleCount,
        paymentMethod, setPaymentMethod,
        subtotal, regularDiscount, eventDiscount, discount, total, itemCount,
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
                event_voucher_id: eventVoucher?.id || null,
            };
            const res = await transactionService.createTransaction(txData);
            const transaction = res.data;
            const summary = items.map(i => `${i.quantity} ${i.title}`).join(', ');

            // Navigate first, clearing will happen on success page or we can do it here after push
            router.push(`/dashboard/checkout-success?code=${transaction.transaction_code}&method=${paymentMethod}&subtotal=${subtotal}&discount=${discount}&reg_discount=${regularDiscount}&event_discount=${eventDiscount}&total=${total}&male=${maleCount}&female=${femaleCount}&items=${itemCount}&summary=${encodeURIComponent(summary)}`);
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
            {loading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.loaderBox}>
                        <div className={styles.spinner} />
                        <p>Processing Transaction...</p>
                    </div>
                </div>
            )}
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
                                            <img src={getImageUrl(item.image_url)} alt={item.title} className={styles.itemImage} />
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

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Vouchers</h3>

                        <div className={styles.voucherSelectionGrid}>
                            {/* Regular Voucher Selection */}
                            <div className={styles.voucherBox}>
                                <div className={styles.voucherBoxHeader}>
                                    <span className={styles.voucherTypeTag}>REGULAR</span>
                                </div>
                                {voucher ? (
                                    <div className={styles.voucherMinimalCard}>
                                        <div className={styles.minimalIcon}>
                                            <IoCheckmarkCircle size={20} />
                                        </div>
                                        <div className={styles.minimalInfo}>
                                            <p className={styles.minimalCode}>{voucher.code}</p>
                                            <p className={styles.minimalDiscount}>
                                                {voucher.discount_type === 'percentage' ? `${voucher.discount_amount}%` : formatCurrency(voucher.discount_amount)} OFF
                                            </p>
                                        </div>
                                        <button className={styles.minimalRemove} onClick={() => removeVoucher('regular')}>
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={`${styles.pickerBtn} ${showVoucherPicker === 'regular' ? styles.pickerBtnActive : ''}`}
                                        onClick={() => setShowVoucherPicker(showVoucherPicker === 'regular' ? null : 'regular')}
                                    >
                                        <IoTicketOutline size={18} />
                                        Select Regular Voucher
                                    </button>
                                )}
                            </div>

                            {/* Event Voucher Selection */}
                            <div className={styles.voucherBox}>
                                <div className={styles.voucherBoxHeader}>
                                    <span className={`${styles.voucherTypeTag} ${styles.eventTag}`}>EVENT</span>
                                </div>
                                {eventVoucher ? (
                                    <div className={`${styles.voucherMinimalCard} ${styles.minimalEvent}`}>
                                        <div className={styles.minimalIcon}>
                                            <IoCheckmarkCircle size={20} />
                                        </div>
                                        <div className={styles.minimalInfo}>
                                            <p className={styles.minimalCode}>{eventVoucher.code}</p>
                                            <p className={styles.minimalDiscount}>
                                                {eventVoucher.discount_type === 'percentage' ? `${eventVoucher.discount_amount}%` : formatCurrency(eventVoucher.discount_amount)} OFF
                                            </p>
                                        </div>
                                        <button className={styles.minimalRemove} onClick={() => removeVoucher('event')}>
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={`${styles.pickerBtn} ${showVoucherPicker === 'event' ? styles.pickerBtnActive : ''}`}
                                        onClick={() => setShowVoucherPicker(showVoucherPicker === 'event' ? null : 'event')}
                                    >
                                        <IoTicketOutline size={18} />
                                        Select Event Voucher
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Premium Voucher Modal */}
                    <Modal
                        isOpen={!!showVoucherPicker}
                        onClose={() => setShowVoucherPicker(null)}
                        title={`Select ${showVoucherPicker === 'event' ? 'Event' : 'Regular'} Voucher`}
                    >
                        <div className={styles.modalVoucherList}>
                            {vouchers.filter(v => v.category === (showVoucherPicker === 'event' ? 'event' : 'regular')).length === 0 ? (
                                <p className={styles.noVouchers}>No active {showVoucherPicker} vouchers found</p>
                            ) : (
                                <div className={styles.modalOptionsContainer}>
                                    {vouchers
                                        .filter(v => v.category === (showVoucherPicker === 'event' ? 'event' : 'regular'))
                                        .map((v) => (
                                            <button
                                                key={v.id}
                                                className={styles.modalVoucherItem}
                                                onClick={() => { applyVoucher(v); setShowVoucherPicker(null); }}
                                            >
                                                <div className={styles.modalItemInfo}>
                                                    <span className={styles.modalItemCode}>{v.code}</span>
                                                    <span className={styles.modalItemName}>{v.name}</span>
                                                </div>
                                                <div className={styles.modalItemRight}>
                                                    <span className={styles.modalItemAmount}>
                                                        {v.discount_type === 'percentage' ? `${v.discount_amount}%` : formatCurrency(v.discount_amount)}
                                                    </span>
                                                    <div className={styles.selectCircle}>
                                                        <IoAdd size={16} />
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </Modal>

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
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.id}
                                        className={`${styles.paymentCard} ${paymentMethod === method.id ? styles.paymentCardActive : ''}`}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <div className={styles.paymentIconWrap}>
                                            <Icon size={24} />
                                        </div>
                                        <span className={styles.paymentLabel}>{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className={styles.summaryPanel}>
                    <div className={styles.summaryCard}>
                        <h3 className={styles.summaryTitle}>Order Summary</h3>
                        <div className={styles.summaryRow}>
                            <span>Subtotal ({itemCount} items)</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Products</span>
                            <span style={{ fontSize: '12px', textAlign: 'right', fontWeight: 500, maxWidth: '60%' }}>
                                {items.map(i => i.title).join(', ')}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Demographics</span>
                            <span>{maleCount}M, {femaleCount}F</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Payment</span>
                            <span>{paymentMethod}</span>
                        </div>
                        {regularDiscount > 0 && (
                            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                                <span>Regular Discount</span>
                                <span>-{formatCurrency(regularDiscount)}</span>
                            </div>
                        )}
                        {eventDiscount > 0 && (
                            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                                <span>Event Discount</span>
                                <span>-{formatCurrency(eventDiscount)}</span>
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
