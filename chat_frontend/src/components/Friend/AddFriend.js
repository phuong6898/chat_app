import React, { useState, useEffect } from 'react';
import {friendsAPI, usersAPI} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
            alert('Đã gửi lời mời kết bạn!');
            setSentRequests([...sentRequests, selectedUser._id]);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi gửi lời mời kết bạn');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Thêm bạn bè</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-group">
                        <label>Tìm kiếm người dùng:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên người dùng (ít nhất 2 ký tự)"
                            required
                        />
                        {searchResults.length > 0 && (
                            <div className="search-results" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', marginTop: '10px' }}>
                                {searchResults.map(userItem => (
                                    <div
                                        key={userItem._id}
                                        onClick={() => handleUserSelect(userItem)}
                                        style={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: selectedUser?._id === userItem._id ? '#f0f8ff' : 'white'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = selectedUser?._id === userItem._id ? '#f0f8ff' : 'white'}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{userItem.username}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{userItem.email}</div>
                                        {userItem._id === user._id && (
                                            <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '4px' }}>
                                                Không thể gửi lời mời cho chính bạn
                                            </div>
                                        )}
                                        {sentRequests.includes(userItem._id) && userItem._id !== user._id && (
                                            <div style={{ color: 'green', fontSize: '0.9rem', marginTop: '4px' }}>
                                                Đã gửi lời mời
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedUser && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px', border: '1px solid #4caf50' }}>
                                <strong>Đã chọn:</strong> {selectedUser.username}
                                {selectedUser._id === user._id && (
                                    <span style={{ color: 'red', marginLeft: '10px' }}>Không thể gửi lời mời cho chính bạn</span>
                                )}
                                {sentRequests.includes(selectedUser._id) && selectedUser._id !== user._id && (
                                    <span style={{ color: 'green', marginLeft: '10px' }}>Đã gửi lời mời</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Hủy</button>
                        <button type="submit" disabled={loading || !selectedUser || sentRequests.includes(selectedUser?._id) || (selectedUser && selectedUser._id === user._id)}>
                            {loading ? 'Đang thêm...' : 'Thêm bạn'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFriend;