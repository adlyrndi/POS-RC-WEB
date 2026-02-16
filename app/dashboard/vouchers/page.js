'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { voucherService } from '@/services/api';
import { IoTicketOutline, IoCloseCircle } from 'react-icons/io5';
import Modal from '@/components/Modal';
import GradientButton from '@/components/GradientButton';
import styles from './vouchers.module.css';

const DISCOUNT_TYPES = ['percentage', 'fixed'];

export default function VoucherManagementPage() {
    const { tenantId } = useContext(AuthContext);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [discountType, setDiscountType] = useState('percentage');

    const fetchVouchers = useCallback(async () => {
        if (!tenantId) return;
        try {
            const res = await voucherService.getVouchers(tenantId);
            setVouchers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

    const openAdd = () => {
        setEditingVoucher(null);
        setCode(''); setName(''); setDiscountAmount(''); setDiscountType('percentage');
        setModalOpen(true);
    };

    const openEdit = (v) => {
        setEditingVoucher(v);
        setCode(v.code); setName(v.name);
        setDiscountAmount(String(v.discount_amount));
        setDiscountType(v.discount_type);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!code || !name || !discountAmount) { alert('All fields are required'); return; }
        setSaving(true);
        try {
            if (editingVoucher) {
                await voucherService.updateVoucher(editingVoucher.id, { code, name, discount_amount: Number(discountAmount), discount_type: discountType });
            } else {
                await voucherService.createVoucher({ code, name, discount_amount: Number(discountAmount), discount_type: discountType, tenant_id: tenantId });
            }
            setModalOpen(false);
            fetchVouchers();
        } catch (err) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (v) => {
        try {
            await voucherService.updateVoucher(v.id, { is_active: !v.is_active });
            fetchVouchers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (v) => {
        if (!confirm(`Delete "${v.name}"?`)) return;
        try {
            await voucherService.deleteVoucher(v.id);
            fetchVouchers();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <h1 className={styles.headerTitle}>Vouchers</h1>
                <p className={styles.headerSub}>{vouchers.length} vouchers</p>
            </div>

            <div className={styles.content}>
                {vouchers.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🎟️</span>
                        <p>No vouchers yet</p>
                    </div>
                ) : (
                    <div className={styles.voucherGrid}>
                        {vouchers.map((v) => (
                            <div key={v.id} className={`${styles.coupon} ${!v.is_active ? styles.couponDisabled : ''}`}>
                                {/* Sawtooth edges via CSS */}
                                <div className={styles.couponMain}>
                                    <button className={styles.couponContent} onClick={() => openEdit(v)}>
                                        <span className={styles.couponCodeBadge}>{v.code}</span>
                                        <div className={styles.couponNameWrap}>
                                            <div className={styles.couponLine} />
                                            <p className={styles.couponName}>{v.name.toUpperCase()}</p>
                                            <div className={styles.couponLine} />
                                        </div>
                                    </button>
                                    <div className={styles.couponDivider}>
                                        <div className={styles.notchTop} />
                                        <div className={styles.dottedLine} />
                                        <div className={styles.notchBottom} />
                                    </div>
                                    <div className={styles.couponStub}>
                                        <span className={styles.stubValue}>
                                            {v.discount_type === 'percentage' ? `${v.discount_amount}%` : `${Number(v.discount_amount / 1000)}k`}
                                        </span>
                                        <span className={styles.stubLabel}>OFF</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className={styles.couponActions}>
                                    <label className={styles.toggleLabel}>
                                        <input type="checkbox" checked={v.is_active} onChange={() => handleToggle(v)} className={styles.toggleInput} />
                                        <span className={styles.toggleTrack}><span className={styles.toggleThumb} /></span>
                                    </label>
                                    <button className={styles.deleteSmall} onClick={() => handleDelete(v)}>
                                        <IoCloseCircle size={20} color="#EF4444" />
                                    </button>
                                </div>

                                {!v.is_active && (
                                    <div className={styles.inactiveOverlay}>
                                        <span className={styles.inactiveStamp}>INACTIVE</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className={styles.fab} onClick={openAdd}>
                <IoTicketOutline size={26} color="#FFF" />
            </button>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingVoucher ? 'Edit Voucher' : 'Add Voucher'}>
                <div className={styles.formGroup}>
                    <label className="form-label">Voucher Code *</label>
                    <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE10" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className={styles.formGroup}>
                    <label className="form-label">Name *</label>
                    <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Voucher name" />
                </div>
                <div className={styles.formGroup}>
                    <label className="form-label">Discount Type</label>
                    <div className={styles.typeRow}>
                        {DISCOUNT_TYPES.map((t) => (
                            <button key={t} className={`${styles.typeChip} ${discountType === t ? styles.typeChipActive : ''}`} onClick={() => setDiscountType(t)}>
                                {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className="form-label">Discount Amount {discountType === 'percentage' ? '(%)' : '(IDR)'} *</label>
                    <input className="form-input" type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0" />
                </div>
                <GradientButton title="Save Voucher" onClick={handleSave} loading={saving} />
            </Modal>
        </div>
    );
}
