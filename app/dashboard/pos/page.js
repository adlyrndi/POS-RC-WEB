'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';
import { productService } from '@/services/api';
import { IoSearchOutline, IoAdd, IoRemove, IoCartOutline, IoCube } from 'react-icons/io5';
import styles from './pos.module.css';

const formatCurrency = (n) => `IDR ${Number(n || 0).toLocaleString('id-ID')}`;
const IS_DEV = process.env.NODE_ENV === 'development';
const RAILWAY_URL = 'https://pos-rc-backend-production.up.railway.app';
const BACKEND_URL = IS_DEV && typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5000`
    : RAILWAY_URL;

const getImageUrl = (url) => {
    if (!url) return '';
    // If it's already a full URL, ensure it uses HTTPS and the production domain if it's pointing to localhost
    if (url.startsWith('http')) {
        return url.replace(/http:\/\/localhost:(8080|3000)/, BACKEND_URL)
            .replace('http://pos-rc-backend-production.up.railway.app', BACKEND_URL);
    }
    // For relative paths, prepend the backend production URL
    return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

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
                                    <div className={styles.imageContainer}>
                                        {product.image_url ? (
                                            <img src={getImageUrl(product.image_url)} alt={product.title} className={styles.productImage} />
                                        ) : (
                                            <div className={styles.imagePlaceholder}>
                                                <IoCube size={32} color="#CBD5E1" />
                                            </div>
                                        )}

                                        {/* Stock Badge - Top Left */}
                                        <span className={`${styles.stockBadge} ${product.stock <= 5 ? styles.stockLow : ''} ${product.stock === 0 ? styles.stockOut : ''}`}>
                                            Stock : {product.stock}
                                        </span>

                                        {/* Action Button - Top Right */}
                                        <div className={styles.actionOverlay}>
                                            {qty > 0 ? (
                                                <div className={styles.qtyControls}>
                                                    <button
                                                        className={styles.miniBtn}
                                                        onClick={() => updateQuantity(product.id, qty + 1)}
                                                        disabled={qty >= product.stock}
                                                    >
                                                        <IoAdd size={14} />
                                                    </button>
                                                    <span className={styles.qtyCount}>{qty}</span>
                                                    <button
                                                        className={styles.miniBtn}
                                                        onClick={() => qty === 1 ? removeItem(product.id) : updateQuantity(product.id, qty - 1)}
                                                    >
                                                        <IoRemove size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className={styles.floatingAddBtn}
                                                    onClick={() => addItem(product)}
                                                    disabled={product.stock === 0}
                                                >
                                                    <IoAdd size={22} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.productDetails}>
                                        <p className={styles.vProductName}>{product.title}</p>
                                        <p className={styles.vProductPrice}>{formatCurrency(product.price)}</p>
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
