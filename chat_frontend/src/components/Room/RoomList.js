import React, {useState, useEffect} from 'react';
import {roomsAPI} from '../../services/api';

const RoomList = ({onRoomSelect}) => {
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
            setRoomData(prev => ({...prev, loading: true, error: null}));

            // DEBUG: Log params
            console.log('Fetching rooms with params:', {
                page: roomData.page,
                limit: 20
            });

            const response = await roomsAPI.getRooms({
                page: roomData.page,
                limit: 20
            });

            console.log('Rooms API response:', response.data);

            setRoomData({
                rooms: response.data.rooms || [],
                page: response.data.page || 1,
                totalPages: response.data.totalPages || 1,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Error fetching rooms:', error);

            // DEBUG: Log full error response
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            }

            setRoomData(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || 'Lỗi khi tải danh sách phòng'
            }));
        }
    };

    const {rooms, loading, error} = roomData;

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
                            padding: '10px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            ':hover': {
                                backgroundColor: '#f5f5f5'
                            }
                        }}>
                        <div className="room-icon" style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '10px',
                            fontSize: '18px'
                        }}>
                            #
                        </div>

                        <div className="room-info">
                            <div className="room-name" tyle={{
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {room.name
                                    ? room.name
                                    : room.members
                                        .filter(member => member._id.toString() !== room.createdBy._id.toString())
                                        .map(member => member.username)
                                         .join(', ')}
                            </div>
                            <div className="room-members" style={{
                                fontSize: '14px',
                                color: '#666'
                            }}>
                                {room.members.length} thành viên
                                {room.isPrivate && ' (Riêng tư)'}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RoomList;