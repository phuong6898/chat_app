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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isValidJWT = (token) => {
        if (!token || typeof token !== 'string') return false;
        
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            const isValid = decoded.exp > currentTime;
            return isValid;
        } catch (error) {
            return false;
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');

            if (storedToken && isValidJWT(storedToken)) {
                try {
                    const decoded = jwtDecode(storedToken);                    
                    api.defaults.headers['x-auth-token'] = storedToken;
                    
                    // Sử dụng đúng endpoint /auth/profile
                    const response = await api.get('/auth/profile');
                    setUser({ ...response.data, userId: decoded.userId });
                    setToken(storedToken);
                } catch (error) {
                    clearAuth();
                }
            } else if (storedToken) {
                clearAuth();
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (newToken) => {
        if (!newToken || !isValidJWT(newToken)) {
            return false;
        }
        
        try {
            localStorage.setItem('token', newToken);
            api.defaults.headers['x-auth-token'] = newToken;

            const { data } = await api.get('/auth/profile');
            const decoded = jwtDecode(newToken);
            setUser({ 
                ...data, 
                userId: data._id,
                username: data.username,
                avatar: data.avatar
            });
            setToken(newToken);
            return true;
        } catch (err) {
            logout();
            return false;
        }
    };

    const logout = () => {
        console.log("AuthContext - Logout initiated");
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers['x-auth-token'];
    };

    // Tách riêng hàm logout để tránh vòng lặp vô hạn
    const clearAuth = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers['x-auth-token'];
    };

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