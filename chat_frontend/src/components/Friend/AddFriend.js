import React, { useState, useEffect } from 'react';
import {friendsAPI, usersAPI} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const AddFriend = ({ onClose }) => {
    const { user } = useAuth();
    const [username, setUsername] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [sentRequests, setSentRequests] = useState([]);

    // Lấy danh sách đã gửi khi mở modal
    useEffect(() => {
        const fetchSent = async () => {
            try {
                const res = await friendsAPI.getSentRequests();
                setSentRequests(res.data.map(r => r.to._id));
            } catch (err) {
                setSentRequests([]);
            }
        };
        fetchSent();
    }, []);

    // Tìm kiếm real-time khi user nhập
    useEffect(() => {
        const searchUsers = async () => {
            if (username.length >= 2) {
                try {
                    const response = await usersAPI.searchUsers(username);
                    setSearchResults(response.data);
                } catch (err) {
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
            }
        };
        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [username]);

    const handleUserSelect = (userItem) => {
        setSelectedUser(userItem);
        setUsername(userItem.username);
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            setError('Vui lòng chọn một người dùng từ danh sách');
            return;
        }
        if (selectedUser._id === user._id) {
            setError('Bạn không thể gửi lời mời kết bạn cho chính mình!');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await friendsAPI.addFriend(selectedUser._id);
            toast.success('Đã gửi lời mời kết bạn!');
            setSentRequests([...sentRequests, selectedUser._id]);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi gửi lời mời kết bạn');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: anchorWidth,
            maxHeight: 300,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 20,
            marginTop: 4,
          }}
        >
          <div style={{ padding: '8px' }}>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Gõ tên để tìm..."
                style={{ width: '100%', padding: '6px', marginBottom: 8, boxSizing: 'border-box' }}
                autoFocus
              />
            </form>
            {searchResults.map(u => (
              <div
                key={u._id}
                onClick={() => handleUserSelect(u)}
                style={{ padding: '6px', cursor: 'pointer' }}
              >
                {u.username} <span style={{ color: '#666', fontSize: '0.85em' }}>{u.email}</span>
              </div>
            ))}
            {searchResults.length === 0 && username.length >= 2 && (
              <div style={{ padding: '6px', color: '#999' }}>Không tìm thấy</div>
            )}
          </div>
        </div>
      );
    };
    
    export default AddFriend;