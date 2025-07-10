import React, { useState } from 'react';
import { roomsAPI } from '../../services/api';
import UserSelector from './UserSelector'; // Component mới để chọn thành viên

const CreateRoom = ({ onClose, currentUser }) => {
    const [roomName, setRoomName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {

            console.log('Creating room with payload:', {
                name: roomName,
                members: selectedUsers.map(u => u._id),
                isPrivate
            });

            // Tự động thêm người tạo vào members nếu chưa có
            const members = [...selectedUsers.map(u => u._id)];
            if (!members.includes(currentUser._id)) {
                members.push(currentUser._id);
            }

            const response = await roomsAPI.createRoom({
                name: roomName,
                members: selectedUsers.map(u => u._id),
                isPrivate
            });

            alert(`Tạo phòng thành công!`);
            onClose(true); // Truyền true để thông báo tạo thành công
        } catch (err) {
            console.error('Create room error:', err);

            // DEBUG: Log full error response
            if (err.response) {
                console.error('Error response data:', err.response.data);
                console.error('Error response status:', err.response.status);
            }
            setError(err.response?.data?.error || 'Không thể tạo phòng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Tạo phòng chat</h3>
                    <button className="close-btn" onClick={() => onClose(false)}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={!isPrivate}
                                onChange={() => setIsPrivate(!isPrivate)}
                            />
                            Tạo phòng nhóm
                        </label>

                        {!isPrivate && (
                            <>
                                <label>Tên phòng:</label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="Nhập tên phòng"
                                    required
                                />
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Thành viên:</label>
                        <UserSelector
                            selectedUsers={selectedUsers}
                            onChange={setSelectedUsers}
                            excludeUser={currentUser}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={() => onClose(false)}>Hủy</button>
                        <button type="submit" disabled={loading || selectedUsers.length === 0}>
                            {loading
                                ? 'Đang tạo...'
                                : isPrivate ? 'Tạo phòng riêng tư' : 'Tạo phòng nhóm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoom;