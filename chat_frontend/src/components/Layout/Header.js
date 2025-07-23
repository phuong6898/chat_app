import React, {useState} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {useNotifications} from "../../contexts/NotificationContext";
import { friendsAPI } from '../../services/api';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        markAllRead,
        removeNotification
    } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNotificationClick = (notification) => {
        // Xử lý khi click vào thông báo
        removeNotification(notification.id);
        // Có thể điều hướng đến trang chấp nhận lời mời
    };

    const handleAcceptRequest = async (notification) => {
        try {
            await friendsAPI.respondToRequest(notification.id, 'accept');
            removeNotification(notification.id);
            // Có thể cập nhật lại danh sách bạn bè ở đây nếu muốn
        } catch (err) {
            alert('Lỗi khi xác nhận kết bạn!');
        }
    };

    console.log('Header - Rendering with user:', user);
    
    return (
        <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>Chat App</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            markAllRead();
                        }}
                        style={{ position: 'relative' }}
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '10px',
                            width: '300px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            zIndex: 100
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <h4>Thông báo</h4>
                                <button onClick={markAllRead}>Đánh dấu đã đọc tất cả</button>
                            </div>

                            {notifications.length === 0 ? (
                                <div>Không có thông báo mới</div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        style={{
                                            padding: '10px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            backgroundColor: notification.read ? '#fff' : '#f0f8ff'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>
                                            {notification.type === 'friendRequest' && (
                                                <>
                                                    {notification.from} đã gửi lời mời kết bạn
                                                    <button style={{ marginLeft: 10 }} onClick={() => handleAcceptRequest(notification)}>
                                                        Xác nhận
                                                    </button>
                                                </>
                                            )}
                                            {notification.type === 'accepted' && (
                                                <>{notification.by} đã chấp nhận lời mời kết bạn của bạn</>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {notification.timestamp.toLocaleTimeString()}
                                        </div>
                                        <button style={{ float: 'right', fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => removeNotification(notification.id)}>X</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {user?.avatar ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                            src={user.avatar}
                            alt="avatar"
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                        />
                        <span>{user.username}</span>
                    </div>
                ) : (
                    <span>{user?.username || 'Đang tải...'}</span>
                )}
                <button onClick={handleLogout}>Đăng xuất</button>
            </div>
        </header>
    );
};

export default Header;