'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [tenantName, setTenantName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth on mount
    useEffect(() => {
        const loadStoredAuth = () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedTenantId = localStorage.getItem('tenantId');
                const storedTenantName = localStorage.getItem('tenantName');
                const storedUser = localStorage.getItem('userEmail');

                if (storedToken && storedTenantId) {
                    setToken(storedToken);
                    setTenantId(storedTenantId);
                    setTenantName(storedTenantName || '');
                    setUser(storedUser || '');
                }
            } catch (err) {
                console.error('Failed to load auth state:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await authService.login(email, password);
        const { session, tenant } = response.data;

        const newToken = session.access_token;
        const newTenantId = tenant.id;
        const newTenantName = tenant.business_name || '';

        setToken(newToken);
        setTenantId(newTenantId);
        setTenantName(newTenantName);
        setUser(email);

        localStorage.setItem('token', newToken);
        localStorage.setItem('tenantId', newTenantId);
        localStorage.setItem('tenantName', newTenantName);
        localStorage.setItem('userEmail', email);

        return response;
    }, []);

    const signup = useCallback(async (businessName, tenantCode, email, password) => {
        const response = await authService.signup({
            business_name: businessName,
            tenant_code: tenantCode,
            email,
            password,
        });
        return response;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setTenantId(null);
        setTenantName('');

        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantName');
        localStorage.removeItem('userEmail');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                tenantId,
                tenantName,
                isLoading,
                login,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
