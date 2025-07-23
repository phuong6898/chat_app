import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { friendsAPI } from '../../services/api';

const UserList = ({ onUserSelect }) => {
    const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const { onlineUsers } = useSocket();

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.searchUsers('');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // useEffect(() => {
    //     fetchFriends();
    // }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await friendsAPI.getFriends();
            setFriends(response.data);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const isUserOnline = (userId) => {
        return onlineUsers.includes(userId);
    };

    if (loading) {
        return <div className="loading">Đang tải danh sách người dùng...</div>;
    }

    return (
        <div className="user-list">
            <div className="user-list-header">
                <h3>Tất cả người dùng ({users.length})</h3>
            </div>

            <div className="users-container">
                {users.length === 0 ? (
                    <div className="empty-list">Không có người dùng nào</div>
                ) : (
                    users.map(user => (
                        <div
                            key={user._id}
                            className="user-item"
                            onClick={() => onUserSelect(user,'private')}
                        >
                            <div className="user-avatar">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                                ) : (
                                    <div className="avatar-circle">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className={`status-indicator ${isUserOnline(user._id) ? 'online' : 'offline'}`}></div>
                            </div>

                            <div className="user-info">
                                <div className="user-name">{user.username}</div>
                                <div className={`user-status ${isUserOnline(user._id) ? 'online' : 'offline'}`}>
                                    {isUserOnline(user._id) ? 'Đang hoạt động' : 'Không hoạt động'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserList;