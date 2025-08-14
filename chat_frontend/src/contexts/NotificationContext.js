// contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { friendsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};

export const NotificationProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    
    // Fetch các lời mời kết bạn đang chờ khi login
    useEffect(() => {
        if (!user) return; // Chỉ fetch khi đã đăng nhập
        const fetchFriendRequests = async () => {
            try {
                const res = await friendsAPI.getReceivedRequests();
                setNotifications(n => {
                    const existingIds = n.map(x => x.id);
                    const newNoti = res.data
                        .filter(r => !existingIds.includes(r._id))
                        .map(r => ({
                            id: r._id,
                            type: 'friendRequest',
                            from: r.from.username,
                            fromId: r.from._id,
                            timestamp: new Date(r.createdAt),
                            read: false
                        }));
                    return [...n, ...newNoti];
                });
            } catch (err) {
                console.error('NotificationContext - Error fetching friend requests:', err);
            }
        };
        fetchFriendRequests();
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        // Khi có request đến
        socket.on('friendRequestReceived', (payload) => {
            setNotifications(n => {
                if (n.some(x => x.id === payload.requestId)) return n;
                const newNotification = {
                    id: payload.requestId,
                    type: 'friendRequest',
                    from: payload.fromUsername,
                    fromId: payload.fromId,
                    timestamp: new Date(),
                    read: false
                };
                return [...n, newNotification];
            });
        });

        // Khi request của mình được chấp nhận
        socket.on('friendRequestAccepted', (payload) => {
            const newNotification = {
                id: `acc-${Date.now()}`,
                type: 'accepted',
                by: payload.byUsername,
                timestamp: new Date(),
            };
            setNotifications(n => [...n, newNotification]);
        });

        return () => {
            socket.off('friendRequestReceived');
            socket.off('friendRequestAccepted');
        };
    }, [socket]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            markAllRead,
            removeNotification,
            unreadCount: notifications.filter(n => !n.read).length
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
