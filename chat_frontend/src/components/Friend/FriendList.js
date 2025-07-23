import React, { useState, useEffect } from 'react';
import { friendsAPI } from '../../services/api';
import {useSocket} from "../../contexts/SocketContext";
import {useAuth} from "../../contexts/AuthContext";

const FriendList = ({ onFriendSelect }) => {
    const { isAuthenticated } = useAuth();
    const [friend, setFriend] = useState([]);
    const [loading, setLoading] = useState(true);
    const { onlineUsers } = useSocket();

    useEffect(() => {
        if (isAuthenticated) {
            fetchFriend();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchFriend = async () => {
        try {
            const response = await friendsAPI.getFriends();
            console.log('Friends fetched:', response.data);
            setFriend(response.data);
        } catch (error) {
            console.error('Error fetching friend:', error);
        } finally {
            setLoading(false);
        }
    };

    const isUserOnline = (userId) => {
        console.log('Checking online status for user:', userId, 'Type:', typeof userId);
        console.log('Online users:', onlineUsers);
        return onlineUsers.includes(userId);
    };

    if (loading) {
        return <div className="loading">Đang tải danh sách bạn bè...</div>;
    }

    console.log('FriendList - Rendering with:', { 
        friendsCount: friend.length, 
        friends: friend.map(f => ({ id: f._id, username: f.username }))
    });
    
    return (
        <div className="friends-list">
            {friend.length === 0 ? (
                <div className="empty-list">Chưa có bạn bè nào</div>
            ) : (
                friend.map(friend => (
                    <div
                        key={friend._id}
                        className="friend-item"
                        onClick={() => {
                            console.log('Friend selected:', friend);
                            console.log('Friend ID type:', typeof friend._id, 'Value:', friend._id);
                            onFriendSelect(friend);
                        }}
                    >
                        <div className="friend-avatar">
                            {friend.avatar ? (
                                <img src={friend.avatar} alt={friend.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                            ) : (
                                friend.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className={`status-indicator ${isUserOnline(friend._id) ? 'online' : 'offline'}`}></div>
                        <div className="friend-info">
                            <div className="friend-name">{friend.username}</div>
                            <div className={`friend-status ${isUserOnline(friend._id) ? 'online' : 'offline'}`}>
                                {isUserOnline(friend._id) ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default FriendList;