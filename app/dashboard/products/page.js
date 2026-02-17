'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { productService } from '@/services/api';
import { IoAdd, IoClose, IoTrashOutline, IoImageOutline, IoCube } from 'react-icons/io5';
import Modal from '@/components/Modal';
import GradientButton from '@/components/GradientButton';
import styles from './products.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;
const IS_DEV = process.env.NODE_ENV === 'development';
const RAILWAY_URL = 'https://pos-rc-backend-production.up.railway.app';
const BACKEND_URL = IS_DEV && typeof window !== 'undefined'
    ? `http://${window.location.hostname}:3000`
    : RAILWAY_URL;

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) {
        return url.replace(/http:\/\/localhost:(8080|3000)/, BACKEND_URL)
            .replace('http://pos-rc-backend-production.up.railway.app', BACKEND_URL);
    }
    return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProductManagementPage() {
    const { tenantId } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const fetchProducts = useCallback(async () => {
        if (!tenantId) return;
        try {
            const res = await productService.getProducts(tenantId);
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const openAdd = () => {
        setEditingProduct(null);
        setTitle(''); setDescription(''); setPrice(''); setStock('0'); setImageUrl('');
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditingProduct(p);
        setTitle(p.title);
        setDescription(p.description || '');
        setPrice(String(p.price));
        setStock(String(p.stock));
        setImageUrl(p.image_url || '');
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!title || !price) { alert('Title and price are required'); return; }
        setSaving(true);
        try {
            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, { title, description, price: Number(price), stock: Number(stock), image_url: imageUrl });
            } else {
                await productService.createProduct({ title, description, price: Number(price), stock: Number(stock || 0), tenant_id: tenantId, image_url: imageUrl });
            }
            setModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const handleDelete = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        setSaving(true);
        const id = productToDelete.id || productToDelete._id;
        try {
            await productService.deleteProduct(id);
            if (editingProduct && (editingProduct.id === id || editingProduct._id === id)) {
                setModalOpen(false); // Close edit modal if open
            }
            setDeleteModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
            setProductToDelete(null);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('image', file); // Field name must match backend multer config
            const res = await productService.uploadImage(formData);
            // Backend might return { imageUrl } or { data: { imageUrl } } depending on wrapper
            const url = res.data?.imageUrl || res.data?.url || res.data;
            setImageUrl(url);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload image: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <h1 className={styles.headerTitle}>Manage Products</h1>
                <p className={styles.headerSub}>{products.length} products</p>
            </div>

            <div className={styles.content}>
                {products.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📦</span>
                        <p>No products yet</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {products.map((product) => (
                            <div key={product.id} className={styles.productCard}>
                                <div className={styles.imageContainer}>
                                    {product.image_url ? (
                                        <img src={getImageUrl(product.image_url)} alt={product.title} className={styles.productImage} />
                                    ) : (
                                        <div className={styles.imagePlaceholder}><IoCube size={32} color="#CBD5E1" /></div>
                                    )}
                                    <span className={styles.stockBadge}>
                                        Stock : {product.stock}
                                    </span>
                                    <button className={styles.deleteFloat} onClick={() => handleDelete(product)}>
                                        <IoClose size={18} color="#FFF" />
                                    </button>
                                </div>
                                <button className={styles.productDetails} onClick={() => openEdit(product)}>
                                    <p className={styles.vProductName}>{product.title}</p>
                                    <p className={styles.vProductPrice}>{formatCurrency(product.price)}</p>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button className={styles.fab} onClick={openAdd}>
                <IoAdd size={28} color="#FFF" />
            </button>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
                <div className={styles.formGroup}>
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product name" />
                </div>

                {imageUrl ? (
                    <div className={styles.previewWrap}>
                        <img src={imageUrl} alt="Preview" className={styles.previewImage} />
                        <button className={styles.removeImageBtn} onClick={() => setImageUrl('')}>
                            <IoTrashOutline size={16} color="#EF4444" />
                        </button>
                    </div>
                ) : (
                    <label className={styles.uploadArea}>
                        <IoImageOutline size={24} color="#2563EB" />
                        <span>Upload Image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    </label>
                )}

                <div className={styles.formGroup}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className="form-label">Price *</label>
                        <input className="form-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className="form-label">Stock</label>
                        <input className="form-input" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className="form-label">Image URL</label>
                    <input className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="http://example.com/image.jpg" />
                </div>

                <GradientButton title="Save Product" onClick={handleSave} loading={saving} />
                {editingProduct && (
                    <button className={styles.deleteBtnFull} onClick={() => handleDelete(editingProduct)} disabled={saving}>
                        <IoTrashOutline size={18} color="#EF4444" />
                        <span>Delete Product</span>
                    </button>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%', background: '#FEE2E2',
                        color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <IoTrashOutline size={30} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', marginBottom: '8px' }}>Delete Product?</h3>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
                        Are you sure you want to delete <strong>{productToDelete?.title}</strong>? This action cannot be undone.
                    </p>
                    <div className={styles.formRow}>
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px', background: '#F3F4F6',
                                color: '#4B5563', fontWeight: '700', fontSize: '14px', transition: 'background 0.2s'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={saving}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px', background: '#EF4444',
                                color: '#FFF', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            {saving ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
