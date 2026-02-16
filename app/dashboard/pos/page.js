'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';
import { productService } from '@/services/api';
import { IoSearchOutline, IoAdd, IoRemove, IoCartOutline, IoCube } from 'react-icons/io5';
import styles from './pos.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;

export default function POSPage() {
    const { tenantId } = useContext(AuthContext);
    const { items, addItem, updateQuantity, removeItem, subtotal, itemCount } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

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

    const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    const getCartQuantity = (productId) => {
        const item = items.find((i) => i.product_id === productId);
        return item ? item.quantity : 0;
    };

    if (loading) {
        return <div className={styles.loader}><div className={styles.spinner} /></div>;
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerDecor} />
                <h1 className={styles.headerTitle}>Point of Sale</h1>
                <div className={styles.searchWrap}>
                    <IoSearchOutline size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Products Grid */}
            <div className={styles.content}>
                {filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📦</span>
                        <p>No products found</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filtered.map((product) => {
                            const qty = getCartQuantity(product.id);
                            return (
                                <div key={product.id} className={styles.productCard}>
                                    <div className={styles.imageWrap}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.title} className={styles.productImage} />
                                        ) : (
                                            <div className={styles.imagePlaceholder}>
                                                <IoCube size={32} color="#94A3B8" />
                                            </div>
                                        )}
                                        <span className={`${styles.stockBadge} ${product.stock <= 5 && product.stock > 0 ? styles.stockLow : ''} ${product.stock === 0 ? styles.stockOut : ''}`}>
                                            Stock: {product.stock}
                                        </span>
                                    </div>
                                    <div className={styles.productInfo}>
                                        <p className={styles.productName}>{product.title}</p>
                                        <p className={styles.productPrice}>{formatCurrency(product.price)}</p>
                                    </div>
                                    <div className={styles.qtyControls}>
                                        {qty > 0 ? (
                                            <>
                                                <button
                                                    className={styles.qtyBtn}
                                                    onClick={() => qty === 1 ? removeItem(product.id) : updateQuantity(product.id, qty - 1)}
                                                >
                                                    <IoRemove size={16} />
                                                </button>
                                                <span className={styles.qtyValue}>{qty}</span>
                                                <button
                                                    className={`${styles.qtyBtn} ${styles.qtyBtnAdd}`}
                                                    onClick={() => updateQuantity(product.id, qty + 1)}
                                                    disabled={qty >= product.stock}
                                                >
                                                    <IoAdd size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className={styles.addBtn}
                                                onClick={() => addItem(product)}
                                                disabled={product.stock === 0}
                                            >
                                                <IoAdd size={18} />
                                                <span>Add</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart FAB */}
            {itemCount > 0 && (
                <Link href="/dashboard/cart" className={styles.cartFab}>
                    <div className={styles.cartFabContent}>
                        <div className={styles.cartFabLeft}>
                            <IoCartOutline size={22} color="#FFF" />
                            <span className={styles.cartBadge}>{itemCount}</span>
                        </div>
                        <span className={styles.cartFabText}>View Cart</span>
                        <span className={styles.cartFabTotal}>{formatCurrency(subtotal)}</span>
                    </div>
                </Link>
            )}
        </div>
    );
}
