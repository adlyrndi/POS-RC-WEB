import axios from 'axios';

const RAILWAY_URL = 'https://pos-rc-backend-production.up.railway.app/api';

// Always use Railway backend — Next.js dev server also runs on :3000
const BASE_URL = RAILWAY_URL;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

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
