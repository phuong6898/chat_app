import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';

const UserSelector = ({ selectedUsers, onChange, excludeUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await usersAPI.searchUsers(searchTerm);
                setUsers(response.data.filter(user =>
                    user._id !== excludeUser?._id &&
                    !selectedUsers.some(selected => selected._id === user._id)
                ));
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        if (searchTerm) {
            const timer = setTimeout(fetchUsers, 300);
            return () => clearTimeout(timer);
        } else {
            setUsers([]);
        }
    }, [searchTerm]);

    const handleSelect = (user) => {
        onChange([...selectedUsers, user]);
        setSearchTerm('');
    };

    const handleRemove = (userId) => {
        onChange(selectedUsers.filter(user => user._id !== userId));
    };

    return (
        <div className="user-selector">
            {/* Hiển thị thành viên đã chọn */}
            <div className="selected-users">
                {selectedUsers.map(user => (
                    <div key={user._id} className="selected-user">
                        <span>{user.username}</span>
                        <button type="button" onClick={() => handleRemove(user._id)}>×</button>
                    </div>
                ))}
            </div>

            {/* Tìm kiếm thành viên */}
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm người dùng..."
            />

            {/* Danh sách kết quả tìm kiếm */}
            {loading ? (
                <div>Đang tải...</div>
            ) : users.length > 0 ? (
                <ul className="user-results">
                    {users.map(user => (
                        <li key={user._id} onClick={() => handleSelect(user)}>
                            <img
                                src={user.avatarUrl || '/default-avatar.png'}
                                alt={user.username}
                                className="user-avatar"
                            />
                            <span>{user.username}</span>
                        </li>
                    ))}
                </ul>
            ) : searchTerm ? (
                <div className="no-results">Không tìm thấy người dùng</div>
            ) : null}
        </div>
    );
};

export default UserSelector;