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
        if (!token || typeof token !== 'string') return false;
        
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            const isValid = decoded.exp > currentTime;
            console.log('AuthContext - JWT validation:', { 
                token: token ? 'present' : 'missing', 
                isValid,
                exp: decoded.exp,
                currentTime,
                isExpired: decoded.exp <= currentTime
            });
            return isValid;
        } catch (error) {
            console.log('AuthContext - JWT validation failed:', error.message);
            return false;
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            console.log('AuthContext - Initialize auth with token:', storedToken ? 'present' : 'missing');

            if (storedToken && isValidJWT(storedToken)) {
                try {
                    const decoded = jwtDecode(storedToken);
                    console.log('AuthContext - Decoded token:', decoded);
                    
                    // Set token header trước khi gọi API
                    api.defaults.headers['x-auth-token'] = storedToken;
                    
                    // Sử dụng đúng endpoint /auth/profile
                    const response = await api.get('/auth/profile');
                    console.log('AuthContext - User data:', response.data);
                    setUser({ ...response.data, userId: decoded.userId });
                    setToken(storedToken);
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                    // Nếu fetch thất bại, clear auth
                    clearAuth();
                }
            } else if (storedToken) {
                console.log('AuthContext - Invalid or expired token, clearing auth');
                clearAuth();
            }
            setLoading(false);
        };

        initializeAuth();
    }, []); // Chỉ chạy 1 lần khi mount, không phụ thuộc [token]

    const login = async (newToken) => {
        if (!newToken || !isValidJWT(newToken)) {
            console.error('AuthContext - Invalid token provided to login');
            return false;
        }

        console.log('AuthContext - Login with token:', newToken ? 'present' : 'missing');
        
        try {
            // 1. Lưu token & cập nhật header ngay
            localStorage.setItem('token', newToken);
            setToken(newToken);
            api.defaults.headers['x-auth-token'] = newToken;

            // 2. Fetch profile luôn ở đây, setUser xong mới return
            const { data } = await api.get('/auth/profile');
            const decoded = jwtDecode(newToken);
            setUser({ ...data, userId: decoded.userId });
            console.log('AuthContext - Login successful, user set:', data);
            return true;   // <-- trả về thành công
        } catch (err) {
            console.error('Login: Failed to fetch profile', err);
            // nếu profile ko lấy đc, logout luôn
            logout();
            return false;  // <-- trả về thất bại
        }
    };

    const logout = () => {
        console.log('AuthContext - Logout');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers['x-auth-token'];
    };

    // Tách riêng hàm logout để tránh vòng lặp vô hạn
    const clearAuth = () => {
        console.log('AuthContext - Clearing auth');
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