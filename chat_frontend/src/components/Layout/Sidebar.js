import React, {useState, useEffect} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import FriendsList from '../Friend/FriendList';
import RoomList from '../Room/RoomList';
import CreateRoom from '../Room/CreateRoom';
import { usersAPI, friendsAPI, roomsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Sidebar = ({ onChatSelect }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { user } = useAuth();
  const [searchRoomTerm, setSearchRoomTerm] = useState('');
  const [roomResults, setRoomResults] = useState([]);
  const [searchingRooms, setSearchingRooms] = useState(false);

  useEffect(() => {
    let timer;
    const fetchRoomResults = async () => {
      if (searchRoomTerm.length < 2) {
        setRoomResults([]);
        return;
      }
      try {
        setSearchingRooms(true);
        const res = await roomsAPI.getPublicRooms({ query: searchRoomTerm });
        setRoomResults(res.data.rooms || []);
      } catch (error) {
        console.error('Search rooms error:', error);
        setRoomResults([]);
      } finally {
        setSearchingRooms(false);
      }
    };
    timer = setTimeout(fetchRoomResults, 300);
    return () => clearTimeout(timer);
  }, [searchRoomTerm]);

  useEffect(() => {
    let timer;
    const fetchResults = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await usersAPI.searchUsers(searchTerm);
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      }
    };
    timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleJoinRoom = async (room) => {
    try {
      await roomsAPI.joinRoom(room._id);
      toast.success('Đã tham gia phòng thành công!');
      setSearchRoomTerm('');
      setRoomResults([]);
      // Trigger refresh of room list
      if (onChatSelect) {
        onChatSelect(room, 'room');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể tham gia phòng');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Bạn bè
        </button>
        <button
          className={activeTab === 'rooms' ? 'active' : ''}
          onClick={() => setActiveTab('rooms')}
        >
          Phòng chat
        </button>
      </div>

      <div className="sidebar-content" style={{ position: 'relative' }}>
        {activeTab === 'friends' && (
          <>
            <div className="sidebar-header" style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm bạn (ít nhất 2 ký tự)"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              />

              {searchTerm.length >= 2 && (
                <div
                  className="search-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10
                  }}
                >
                  {searchResults.map(u => (
                    <div
                      key={u._id}
                      onClick={async () => {
                        try {
                          await friendsAPI.addFriend(u._id);
                          toast.success('Đã gửi lời mời kết bạn!');
                        } catch (err) {
                          toast.error(err.response?.data?.error || 'Gửi lời mời thất bại');
                        }
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                      style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.username}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{ width: 32, height: 32, borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
                        >
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{u.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Always show FriendsList behind dropdown */}
            <div style={{ marginTop: searchTerm.length >= 2 ? '240px' : '0' }}>
              <FriendsList onFriendSelect={f => onChatSelect(f, 'private')} />
            </div>
          </>
        )}

        {activeTab === 'rooms' && (
          <>
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="🔍 Tìm phòng (ít nhất 2 ký tự)"
                value={searchRoomTerm}
                onChange={(e) => setSearchRoomTerm(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button
                className="create-room-btn"
                onClick={() => setShowCreateRoom(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>

            {searchRoomTerm.length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '80px',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  zIndex: 10,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {searchingRooms ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                    Đang tìm kiếm...
                  </div>
                ) : roomResults.length > 0 ? (
                  roomResults.map(room => (
                    <div
                      key={room._id}
                      style={{ 
                        padding: '0.75rem', 
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {room.name || 'Phòng không tên'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {room.members?.length || 0} thành viên
                          {room.isPrivate && ' • Riêng tư'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Tham gia
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', color: '#888', textAlign: 'center' }}>
                    Không tìm thấy phòng
                  </div>
                )}
              </div>
            )}

            <RoomList 
              onRoomSelect={(room) => onChatSelect(room, 'room')} 
              onRoomUpdate={() => {
                // Force re-render of RoomList
                setActiveTab('friends');
                setTimeout(() => setActiveTab('rooms'), 100);
              }}
            />
          </>
        )}
      </div>

      {showAddFriend && (
        <AddFriend onClose={() => setShowAddFriend(false)} />
      )}

      {showCreateRoom && (
        <CreateRoom onClose={() => setShowCreateRoom(false)} currentUser={user} />
      )}
    </div>
  );
};

export default Sidebar;