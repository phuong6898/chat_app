import React, { createContext, useContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    console.log('AuthContext - Initial token:', token ? 'present' : 'missing');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isValidJWT = (token) => {
        const isValid = typeof token === 'string' && token.split('.').length === 3;
        console.log('AuthContext - JWT validation:', { token: token ? 'present' : 'missing', isValid });
        return isValid;
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            console.log('AuthContext - Initialize auth with token:', storedToken ? 'present' : 'missing');

            if (storedToken && isValidJWT(storedToken)) {
                try {
                    const decoded = jwtDecode(storedToken);
                    console.log('AuthContext - Decoded token:', decoded);
                    const response = await api.get(`/users/${decoded.userId}`, {
                        headers: { 'x-auth-token': storedToken }
                    });
                    console.log('AuthContext - User data:', response.data);
                    setUser({ ...response.data, userId: decoded.userId });
                    setToken(storedToken); // Ensure token state is set
                    api.defaults.headers['x-auth-token'] = storedToken;
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (newToken) => {
        if (!newToken || !isValidJWT(newToken)) return;

        console.log('AuthContext - Login with token:', newToken ? 'present' : 'missing');
        console.log('AuthContext - Setting token in localStorage and state');
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Verify token was set correctly
        const storedToken = localStorage.getItem('token');
        console.log('AuthContext - Token verification after set:', storedToken ? 'present' : 'missing');

        try {
            const decoded = jwtDecode(newToken);
            console.log('AuthContext - Login decoded token:', decoded);
            const response = await api.get(`/users/${decoded.userId}`, {
                headers: { 'x-auth-token': newToken }
            });
            console.log('AuthContext - Login user data:', response.data);
            setUser({ ...response.data, userId: decoded.userId });
            api.defaults.headers['x-auth-token'] = newToken;
        } catch (error) {
            console.error('Failed to fetch user data after login:', error);
        }
    };

    const logout = () => {
        console.log('AuthContext - Logout');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers['x-auth-token'];
    };

    console.log('AuthContext - Rendering with user:', user);
    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                loading,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};