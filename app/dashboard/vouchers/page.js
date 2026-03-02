'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { voucherService } from '@/services/api';
import { IoTicketOutline, IoCloseCircle, IoCreateOutline } from 'react-icons/io5';
import Modal from '@/components/Modal';
import GradientButton from '@/components/GradientButton';
import styles from './vouchers.module.css';

const DISCOUNT_TYPES = ['percentage', 'fixed'];

// Subcomponent for Horizontal Ticket Card
function VoucherCard({ v, onEdit, onToggle, onDelete, variant = 'regular' }) {
    const isEvent = variant === 'event';
    const amountStr = v.discount_type === 'percentage'
        ? `${v.discount_amount}%`
        : `IDR ${Number(v.discount_amount).toLocaleString('id-ID')}`;

    return (
        <div className={`${styles.horizontalTicket} ${!v.is_active ? styles.ticketDisabled : ''} ${isEvent ? styles.eventTicket : ''}`}>
            {/* Stub Section */}
            <div className={styles.ticketStub}>
                <span className={styles.stubLabel}>
                    {isEvent ? 'EVENT REWARD' : 'MEMBER VOUCHER'}
                </span>
                <div className={styles.stubDot} />
            </div>

            {/* Main Section */}
            <div className={styles.ticketMain}>
                <div className={styles.ticketDecor} />
                <div className={styles.ticketHeader}>
                    <p className={styles.categoryLabel}>{v.category}</p>
                    <h2 className={styles.voucherTitle}>{v.name}</h2>
                </div>

                <div className={styles.discountSection}>
                    <span className={styles.discountVal}>
                        {amountStr}
                    </span>
                </div>

                <div className={styles.codeRow}>
                    <span className={styles.codeText}>CODE: {v.code}</span>
                </div>

                {/* Actions Overlay */}
                <div className={styles.ticketActions}>
                    <div className={styles.actionsTopRow}>
                        <label className={styles.ticketToggle}>
                            <input type="checkbox" checked={v.is_active} onChange={() => onToggle(v)} />
                            <span className={styles.toggleRound} />
                        </label>
                        <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); onDelete(v); }} title="Delete">
                            <IoCloseCircle size={22} />
                        </button>
                    </div>
                    <button className={styles.editIconBtn} onClick={() => onEdit(v)} title="Edit">
                        <IoCreateOutline size={20} />
                    </button>
                </div>
            </div>

            {/* Scallops */}
            <div className={styles.scallopLeft} />
            <div className={styles.scallopRight} />
        </div>
    );
}


export default function VoucherManagementPage() {
    const { tenantId } = useContext(AuthContext);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [activeTab, setActiveTab] = useState('regular');

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [discountType, setDiscountType] = useState('percentage');
    const [category, setCategory] = useState('regular');

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
        setCategory(activeTab);
        setModalOpen(true);
    };

    const openEdit = (v) => {
        setEditingVoucher(v);
        setCode(v.code); setName(v.name);
        setDiscountAmount(String(v.discount_amount));
        setDiscountType(v.discount_type);
        setCategory(v.category || 'regular');
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!code || !name || !discountAmount) { alert('All fields are required'); return; }
        setSaving(true);
        try {
            const payload = { code, name, discount_amount: Number(discountAmount), discount_type: discountType, category };
            if (editingVoucher) {
                await voucherService.updateVoucher(editingVoucher.id, payload);
            } else {
                await voucherService.createVoucher({ ...payload, tenant_id: tenantId });
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

    const filteredVouchers = vouchers.filter(v =>
        activeTab === 'event' ? v.category === 'event' : v.category !== 'event'
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <div className={styles.headerContent}>
                    <h1 className={styles.headerTitle}>Vouchers</h1>
                    <p className={styles.headerSub}>{vouchers.length} vouchers total</p>
                </div>
            </div>

            <div className={styles.content}>
                {/* Category Tabs */}
                <div className={styles.tabContainer}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'regular' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('regular')}
                    >
                        Regular Vouchers
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'event' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('event')}
                    >
                        Event Vouchers
                    </button>
                </div>

                {vouchers.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🎟️</span>
                        <p>No vouchers yet</p>
                    </div>
                ) : (
                    <div className={styles.vouchersWrapper}>
                        <div className={styles.voucherGrid}>
                            {filteredVouchers.map((v) => (
                                <VoucherCard
                                    key={v.id}
                                    v={v}
                                    onEdit={openEdit}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    variant={v.category === 'event' ? 'event' : 'regular'}
                                />
                            ))}
                            {filteredVouchers.length === 0 && (
                                <p className={styles.emptySmall}>No {activeTab} vouchers available</p>
                            )}
                        </div>
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
                    <label className="form-label">Category</label>
                    <div className={styles.typeRow}>
                        {['regular', 'event'].map((c) => (
                            <button key={c} className={`${styles.typeChip} ${category === c ? styles.typeChipActive : ''}`} onClick={() => setCategory(c)}>
                                {c.charAt(0).toUpperCase() + c.slice(1)}
                            </button>
                        ))}
                    </div>
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
