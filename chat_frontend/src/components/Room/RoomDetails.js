import React, { useState, useEffect } from 'react';
import { roomsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './RoomDetails.css';

const RoomDetails = ({ roomId, onClose, onRoomUpdate }) => {
    const { user } = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    useEffect(() => {
        if (roomId) {
            fetchRoomDetails();
        }
    }, [roomId]);

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const response = await roomsAPI.getRoomDetails(roomId);
            setRoom(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Không thể tải thông tin phòng');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn rời khỏi phòng này?')) return;
        
        try {
            await roomsAPI.leaveRoom(roomId);
            if (onRoomUpdate) onRoomUpdate();
            if (onClose) onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể rời phòng');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi phòng?')) return;
        
        try {
            await roomsAPI.removeMember(roomId, memberId);
            await fetchRoomDetails(); // Refresh room data
            if (onRoomUpdate) onRoomUpdate();
            toast.success('Đã xóa thành viên khỏi phòng thành công!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể xóa thành viên');
        }
    };

    const handleAddMember = async (userId) => {
        try {
            await roomsAPI.addMember(roomId, userId);
            await fetchRoomDetails(); // Refresh room data
            setShowAddMember(false);
            setSearchQuery('');
            setSearchResults([]);
            if (onRoomUpdate) onRoomUpdate();
            toast.success('Đã thêm thành viên vào phòng thành công!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể thêm thành viên');
        }
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const response = await usersAPI.searchUsers(query);
            // Filter out users who are already members
            const filteredResults = response.data.filter(user => 
                !room.members.some(member => member._id === user._id)
            );
            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Search users error:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim()) {
            searchUsers(query);
        } else {
            setSearchResults([]);
        }
    };

    const isRoomAdmin = () => {
        return room && room.createdBy._id === user.userId;
    };

    const isCurrentUser = (memberId) => {
        return memberId === user.userId;
    };

    const handleAvatarUpload = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setSelectedImage(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreview(e.target.result);
                    setShowImageModal(true);
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };

    const handleSaveAvatar = async () => {
        if (!selectedImage) return;
        
        try {
            const formData = new FormData();
            formData.append('avatar', selectedImage);
            
            // API call to upload avatar
            await roomsAPI.updateRoomAvatar(roomId, formData);
            await fetchRoomDetails(); // Refresh room data
            if (onRoomUpdate) onRoomUpdate();
            toast.success('Đã cập nhật ảnh nhóm thành công!');
            
            setShowImageModal(false);
            setSelectedImage(null);
            setImagePreview(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Không thể cập nhật ảnh nhóm');
        }
    };

    const handleCancelUpload = () => {
        setShowImageModal(false);
        setSelectedImage(null);
        setImagePreview(null);
    };

    if (loading) {
        return <div className="loading">Đang tải thông tin phòng...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
                <button onClick={onClose}>Đóng</button>
            </div>
        );
    }

    if (!room) {
        return <div className="error-message">Không tìm thấy phòng</div>;
    }

    return (
        <>
            {/* Overlay for desktop to show semi-transparent background */}
            <div className="room-details-overlay" onClick={onClose}></div>
            
            <div className="room-details">
                <div className="room-details-header">
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                {/* Room Avatar Section */}
                <div className="room-avatar-section">
                    <div className="room-avatar-container" onClick={handleAvatarUpload}>
                        <div className="room-avatar">
                            {room.avatar ? (
                                <img src={room.avatar} alt={room.name} />
                            ) : (
                                <div className="default-avatar">
                                    <span>📷</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <h2 className="room-name">{room.name || 'Phòng không tên'}</h2>
                    <div className="separator"></div>
                    <p className="room-description">
                        {room.description || <span className="placeholder-text">Thêm mô tả nhóm</span>}
                    </p>
                </div>

                {/* Add Member Section */}
                <div className="separator"></div>
                <div className="room-action-item" onClick={() => setShowAddMember(true)}>
                    <span className="action-text">Thêm thành viên</span>
                </div>

                {/* View Members Section */}
                <div className="separator"></div>
                <div className="room-action-item" onClick={() => setShowMembers(!showMembers)}>
                    <span className="action-text">Xem thành viên ({room.members.length})</span>
                    <span className="arrow-icon">
                        {showMembers ? '▼' : '▶'}
                    </span>
                </div>

                {showMembers && (
                    <div className="members-list">
                        {room.members.map(member => (
                            <div key={member._id} className="member-item">
                                <div className="member-info">
                                    <img 
                                        src={member.avatar} 
                                        alt={member.username}
                                        className="member-avatar"
                                    />
                                    <div className="member-details">
                                        <span className="member-name">{member.username}</span>
                                        <span className="member-status">{member.status}</span>
                                        {member._id === room.createdBy._id && (
                                            <span className="admin-badge">Quản trị viên</span>
                                        )}
                                    </div>
                                </div>
                                <div className="member-actions">
                                    {isRoomAdmin() && !isCurrentUser(member._id) && (
                                        <button 
                                            className="btn btn-small btn-danger"
                                            onClick={() => handleRemoveMember(member._id)}
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Leave Room Section */}
                <div className="separator"></div>
                <div className="room-action-item leave-room" onClick={handleLeaveRoom}>
                    <span className="action-text">
                        <span className="leave-icon">🚪</span>
                        Rời phòng
                    </span>
                </div>

                {/* Image Preview Modal */}
                {showImageModal && (
                    <div className="modal-overlay" onClick={handleCancelUpload}>
                        <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Cập nhật ảnh nhóm</h3>
                                <button onClick={handleCancelUpload}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="image-preview-container">
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                    </div>
                                </div>
                                <div className="image-modal-actions">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleSaveAvatar}
                                    >
                                        Lưu
                                    </button>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={handleCancelUpload}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Member Modal */}
                {showAddMember && (
                    <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Thêm thành viên</h3>
                                <button onClick={() => setShowAddMember(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="search-section">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm người dùng..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                    />
                                    {searching && <div className="searching">Đang tìm kiếm...</div>}
                                </div>
                                
                                <div className="search-results">
                                    {searchResults.map(user => (
                                        <div key={user._id} className="search-result-item">
                                            <div className="user-info">
                                                <img 
                                                    src={user.avatar} 
                                                    alt={user.username}
                                                    className="user-avatar"
                                                />
                                                <span className="user-name">{user.username}</span>
                                            </div>
                                            <button 
                                                className="btn btn-small btn-primary"
                                                onClick={() => handleAddMember(user._id)}
                                            >
                                                Thêm
                                            </button>
                                        </div>
                                    ))}
                                    {searchQuery && searchResults.length === 0 && !searching && (
                                        <div className="no-results">Không tìm thấy người dùng</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RoomDetails;