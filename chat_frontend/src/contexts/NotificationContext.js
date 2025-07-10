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
    
    console.log('NotificationProvider - Initializing with:', { 
        socket: socket ? 'present' : 'missing', 
        user: user ? 'present' : 'missing' 
    });

    // Fetch các lời mời kết bạn đang chờ khi login
    useEffect(() => {
        console.log('NotificationContext - User effect triggered:', { user: user ? 'present' : 'missing' });
        if (!user) return; // Chỉ fetch khi đã đăng nhập
        console.log('NotificationContext - Fetching friend requests for user:', user);
        const fetchFriendRequests = async () => {
            try {
                const res = await friendsAPI.getReceivedRequests();
                console.log('NotificationContext - Friend requests received:', res.data);
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
                    console.log('NotificationContext - New notifications:', newNoti);
                    return [...n, ...newNoti];
                });
            } catch (err) {
                console.error('NotificationContext - Error fetching friend requests:', err);
            }
        };
        fetchFriendRequests();
    }, [user]);

    useEffect(() => {
        console.log('NotificationContext - Socket effect triggered:', { socket: socket ? 'present' : 'missing' });
        if (!socket) return;

        // Khi có request đến
        socket.on('friendRequestReceived', (payload) => {
            console.log('NotificationContext - Friend request received:', payload);
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
                console.log('NotificationContext - Adding new notification:', newNotification);
                return [...n, newNotification];
            });
        });

        // Khi request của mình được chấp nhận
        socket.on('friendRequestAccepted', (payload) => {
            console.log('NotificationContext - Friend request accepted:', payload);
            const newNotification = {
                id: `acc-${Date.now()}`,
                type: 'accepted',
                by: payload.byUsername,
                timestamp: new Date(),
            };
            console.log('NotificationContext - Adding acceptance notification:', newNotification);
            setNotifications(n => [...n, newNotification]);
        });

        return () => {
            console.log('NotificationContext - Cleaning up socket listeners');
            socket.off('friendRequestReceived');
            socket.off('friendRequestAccepted');
        };
    }, [socket]);

    const markAllRead = () => {
        console.log('NotificationContext - Marking all notifications as read');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id) => {
        console.log('NotificationContext - Removing notification:', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    console.log('NotificationContext - Rendering with:', { 
        notificationsCount: notifications.length, 
        unreadCount: notifications.filter(n => !n.read).length 
    });
    
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
