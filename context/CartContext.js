'use client';

import { createContext, useState, useMemo, useCallback } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [voucher, setVoucher] = useState(null);
    const [eventVoucher, setEventVoucher] = useState(null);
    const [maleCount, setMaleCount] = useState(0);
    const [femaleCount, setFemaleCount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const addItem = useCallback((product) => {
        if (!product || !product.id) return;
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
                    title: product.title || 'Product',
                    price: Number(product.price) || 0,
                    quantity: 1,
                    stock: product.stock || 0,
                    image_url: product.image_url || '',
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
        setEventVoucher(null);
        setMaleCount(0);
        setFemaleCount(0);
        setPaymentMethod('Cash');
    }, []);

    const applyVoucher = useCallback((v) => {
        if (v.category === 'event') {
            setEventVoucher(v);
        } else {
            setVoucher(v);
        }
    }, []);

    const removeVoucher = useCallback((category = 'regular') => {
        if (category === 'event') {
            setEventVoucher(null);
        } else {
            setVoucher(null);
        }
    }, []);

    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [items]
    );

    const regularDiscount = useMemo(() => {
        if (!voucher) return 0;
        if (voucher.discount_type === 'percentage') {
            return Math.round((subtotal * voucher.discount_amount) / 100);
        }
        return voucher.discount_amount;
    }, [voucher, subtotal]);

    const eventDiscount = useMemo(() => {
        if (!eventVoucher) return 0;
        const subtotalAfterRegular = Math.max(0, subtotal - regularDiscount);
        if (eventVoucher.discount_type === 'percentage') {
            return Math.round((subtotalAfterRegular * eventVoucher.discount_amount) / 100);
        }
        return eventVoucher.discount_amount;
    }, [eventVoucher, subtotal, regularDiscount]);

    const discount = useMemo(() => regularDiscount + eventDiscount, [regularDiscount, eventDiscount]);

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
                itemCount,
                subtotal,
                eventVoucher,
                regularDiscount,
                eventDiscount,
                discount,
                total,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
