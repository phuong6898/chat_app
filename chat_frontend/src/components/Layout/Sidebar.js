import React, {useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import FriendsList from '../Friend/FriendList';
import RoomList from '../Room/RoomList';
import AddFriend from '../Friend/AddFriend';
import CreateRoom from '../Room/CreateRoom';

const Sidebar = ({onChatSelect}) => {
    const [activeTab, setActiveTab] = useState('friends');
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const {user} = useAuth();

    console.log('Sidebar - Rendering with:', { activeTab, user: user ? 'present' : 'missing' });
    
    return (
        <div className="sidebar">
            <div className="sidebar-tabs">
                <button
                    className={activeTab === 'friends' ? 'active' : ''}
                    onClick={() => setActiveTab('friends')}>
                    Bạn bè
                </button>
                <button
                    className={activeTab === 'rooms' ? 'active' : ''}
                    onClick={() => setActiveTab('rooms')}>
                    Phòng chat
                </button>
            </div>

            <div className="sidebar-content">
                {activeTab === 'friends' && (
                    <>
                        <div className="sidebar-header">
                            <h3>Danh sách bạn bè</h3>
                            <button className="add-btn" onClick={() => setShowAddFriend(true)}>
                                + Thêm bạn
                            </button>
                        </div>
                        <FriendsList onFriendSelect={(friend) => onChatSelect(friend, 'private')}/>
                    </>
                )}

                {activeTab === 'rooms' && (
                    <>
                        <div className="sidebar-header"
                             style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h3>Phòng chat</h3>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateRoom(true)}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                + Tạo phòng
                            </button>
                        </div>
                        <RoomList onRoomSelect={(room) => onChatSelect(room, 'room')}/>
                    </>
                )}
            </div>

            {showAddFriend && (
                <AddFriend onClose={() => setShowAddFriend(false)}/>
            )}

            {showCreateRoom && (
                <CreateRoom
                    onClose={(create) => {
                        setShowCreateRoom(false);
                        // Không cần fetchRooms vì RoomList sẽ tự động refresh
                    }}
                    currentUser={user}
                />
            )}
        </div>
    );
};

export default Sidebar;