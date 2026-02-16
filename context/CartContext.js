'use client';

import { createContext, useState, useMemo, useCallback } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [voucher, setVoucher] = useState(null);
    const [maleCount, setMaleCount] = useState(0);
    const [femaleCount, setFemaleCount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const addItem = useCallback((product) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: 1,
                    stock: product.stock,
                    image_url: product.image_url,
                },
            ];
        });
    }, []);

    const removeItem = useCallback((productId) => {
        setItems((prev) => prev.filter((i) => i.product_id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((i) => i.product_id !== productId));
            return;
        }
        setItems((prev) =>
            prev.map((i) =>
                i.product_id === productId ? { ...i, quantity } : i
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        setVoucher(null);
        setMaleCount(0);
        setFemaleCount(0);
        setPaymentMethod('Cash');
    }, []);

    const applyVoucher = useCallback((v) => {
        setVoucher(v);
    }, []);

    const removeVoucher = useCallback(() => {
        setVoucher(null);
    }, []);

    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [items]
    );

    const discount = useMemo(() => {
        if (!voucher) return 0;
        if (voucher.discount_type === 'percentage') {
            return Math.round((subtotal * voucher.discount_amount) / 100);
        }
        return voucher.discount_amount;
    }, [voucher, subtotal]);

    const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

    const itemCount = useMemo(
        () => items.reduce((sum, i) => sum + i.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                voucher,
                applyVoucher,
                removeVoucher,
                maleCount,
                setMaleCount,
                femaleCount,
                setFemaleCount,
                paymentMethod,
                setPaymentMethod,
                subtotal,
                discount,
                total,
                itemCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
