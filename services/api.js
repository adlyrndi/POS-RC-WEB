import axios from 'axios';

const IS_DEV = process.env.NODE_ENV === 'development';
const RAILWAY_URL = 'https://pos-rc-backend-production.up.railway.app/api';

// Use NEXT_PUBLIC_API_URL from .env.local in dev, otherwise fallback to Railway
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || RAILWAY_URL;

console.log('--- WEB-APP API CONFIG ---');
console.log('Environment:', process.env.NODE_ENV);
console.log('Target API:', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

export const getImageUrl = (url) => {
    if (!url) return '';

    // 1. Pass through legitimate external URLs (Supabase)
    if (url.includes('supabase.co')) return url;
    if (url.startsWith('https://') && !url.includes('up.railway.app')) return url;

    // 2. Extract path (already cleaned by migration, but handles old leftovers too)
    let path = url;
    if (url.includes('localhost:') || url.includes('up.railway.app')) {
        try {
            const urlObj = new URL(url);
            path = urlObj.pathname;
        } catch (e) {
            path = url.split('/uploads/')[1] ? `/uploads/${url.split('/uploads/')[1]}` : url;
        }
    }

    // 3. Ensure path starts with /uploads/
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const finalPath = cleanPath.startsWith('/uploads/') ? cleanPath : `/uploads${cleanPath}`;

    // 4. Combine with current backend URL (stripped of /api)
    const backendUrl = BASE_URL.replace(/\/api$/, '');
    return `${backendUrl}${finalPath}`;
};

// Auth header interceptor
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// ─── Auth ────────────────────────────────────────────
export const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    signup: (data) => api.post('/auth/signup', data),
};

// ─── Products ────────────────────────────────────────
export const productService = {
    getProducts: (tenantId) => api.get(`/products?tenant_id=${tenantId}`),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    uploadImage: (formData) =>
        api.post('/products/upload', formData, {
            headers: { 'Content-Type': undefined }
        }),
};

// ─── Vouchers ────────────────────────────────────────
export const voucherService = {
    getVouchers: (tenantId) => api.get(`/vouchers?tenant_id=${tenantId}`),
    createVoucher: (data) => api.post('/vouchers', data),
    updateVoucher: (id, data) => api.put(`/vouchers/${id}`, data),
    deleteVoucher: (id) => api.delete(`/vouchers/${id}`),
};

// ─── Transactions ────────────────────────────────────
export const transactionService = {
    getTransactions: (tenantId) => api.get(`/transactions?tenant_id=${tenantId}`),
    createTransaction: (data) => api.post('/transactions', data),
};

// ─── Analytics ───────────────────────────────────────
export const analyticsService = {
    getAnalytics: (tenantId) => api.get(`/analytics?tenant_id=${tenantId}`),
};

export default api;
