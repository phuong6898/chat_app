import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { token, isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated && token && user && user.userId) {
            // Đã có socket thì không khởi tạo lại
            if (socket) return;

            const socketInstance = initializeSocket(token);
            setSocket(socketInstance);

            socketInstance.userId = user.userId;

            // Lắng nghe sự kiện onlineUsers (đúng tên backend gửi)
            socketInstance.on('onlineUsers', (users) => {
                setOnlineUsers(users);
            });
            socketInstance.on('connect', () => {
                socketInstance.emit('join', { room: `user_${user.userId}` });
            });

            // Xử lý khi ngắt kết nối
            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            return () => {
                // Chỉ ngắt kết nối, không setState trong cleanup để tránh vòng lặp
                disconnectSocket();
                setOnlineUsers([]);
            };
        } else {
            // Khi không authenticated hoặc không có user, disconnect socket nếu đang tồn tại
            if (socket) {
                disconnectSocket();
                setSocket(null);
                setOnlineUsers([]);
            }
        }
    }, [isAuthenticated, token, user]);

    const value = {
        socket,
        setSocket,
        onlineUsers,
        isConnected: socket? socket.connected : false
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};