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
    
    console.log('SocketProvider - Received from AuthContext:', { 
        token: token ? 'present' : 'missing', 
        isAuthenticated, 
        user: user ? 'present' : 'missing' 
    });

    useEffect(() => {
        console.log('SocketContext - Effect triggered:', { 
            isAuthenticated, 
            token: token ? 'present' : 'missing', 
            user: user ? 'present' : 'missing',
            tokenValue: token ? token.substring(0, 20) + '...' : 'missing'
        });
        
        if (isAuthenticated && token && user) {
            console.log('SocketContext - Initializing socket for user:', user);
            console.log('SocketContext - Token being passed to initializeSocket:', token ? 'present' : 'missing');
            const socketInstance = initializeSocket(token);
            console.log('SocketContext - Socket instance created:', socketInstance ? 'success' : 'failed');
            setSocket(socketInstance);

            socketInstance.userId = user.userId;
            console.log('SocketContext - Set socket userId:', user.userId);

            socketInstance.on('userOnline', (users) => {
                console.log('SocketContext - Users online:', users);
                setOnlineUsers(users);
            });
            socketInstance.on('connect', () => {
                console.log('SocketContext - Socket connected, joining room:', `user_${user.userId}`);
                socketInstance.emit('join', { room: `user_${user.userId}` });
            });

            // Xử lý khi ngắt kết nối
            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            return () => {
                console.log('SocketContext - Cleaning up socket');
                disconnectSocket();
                setSocket(null);
                setOnlineUsers([]);
            };
        } else {
            console.log('SocketContext - Not initializing socket because:', {
                isAuthenticated,
                hasToken: !!token,
                hasUser: !!user
            });
        }
    }, [isAuthenticated, token, user]);

    const value = {
        socket,
        setSocket,
        onlineUsers,
        isConnected: socket? socket.connected : false
    };

    console.log('SocketContext - Rendering with value:', {
        socket: socket ? 'present' : 'missing',
        onlineUsersCount: onlineUsers.length,
        isConnected: socket? socket.connected : false
    });
    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};