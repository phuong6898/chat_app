import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RoomList = ({ onRoomSelect, onRoomUpdate }) => {
    const { user } = useAuth();
    const [roomData, setRoomData] = useState({
        rooms: [],
        page: 1,
        totalPages: 1,
        loading: true,
        error: null
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setRoomData(prev => ({ ...prev, loading: true, error: null }));

            const response = await roomsAPI.getRooms({
                page: roomData.page,
                limit: 20
            });

            setRoomData({
                rooms: response.data.rooms || [],
                page: response.data.page || 1,
                totalPages: response.data.totalPages || 1,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Error fetching rooms:', error);
            setRoomData(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || 'Lỗi khi tải danh sách phòng'
            }));
        }
    };

    const isRoomAdmin = (room) => {
        return room.createdBy._id === user.userId;
    };

    const { rooms, loading, error } = roomData;

    if (loading) {
        return <div className="loading">Đang tải danh sách phòng...</div>;
    }

    if (error) {
        return <div className="error">Lỗi: {error}</div>;
    }

    return (
        <div className="rooms-list">
            {rooms.length === 0 ? (
                <div className="empty-list" style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    <p>Chưa có phòng chat nào</p>
                    <p>Hãy tạo phòng mới hoặc tham gia phòng công khai</p>
                </div>
            ) : (
                rooms.map(room => (
                    <div
                        key={room._id}
                        className="room-item"
                        onClick={() => onRoomSelect(room, 'room')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div className="room-icon" style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#007bff',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                fontSize: '18px'
                            }}>
                                #
                            </div>

                            <div className="room-info" style={{ flex: 1 }}>
                                <div className="room-name" style={{
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    marginBottom: '4px'
                                }}>
                                    {room.name
                                        ? room.name
                                        : room.members
                                            .filter(member => member._id.toString() !== room.createdBy._id.toString())
                                            .map(member => member.username)
                                            .join(', ')}
                                </div>
                                <div className="room-meta" style={{
                                    fontSize: '14px',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>{room.members.length} thành viên</span>
                                    {room.isPrivate && <span style={{ color: '#e74c3c' }}>• Riêng tư</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RoomList;