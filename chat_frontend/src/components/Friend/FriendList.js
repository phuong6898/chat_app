import React, { useState, useEffect } from 'react';
import { friendsAPI } from '../../services/api';
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";

/**
 * FriendList
 * - onFriendSelect(friend) được gọi khi click vào bạn => ChatWindow sẽ load tin nhắn
 * - hiển thị bold preview khi friend.unread === true
 * - khi có privateMessage: cập nhật lastMessage, lastMessageAt, unread=true và move friend lên đầu
 * - hiển thị dấu chấm xanh nhỏ dưới avatar khi online
 */
const FriendList = ({ onFriendSelect }) => {
  const { user, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const response = await friendsAPI.getFriends();
        // Nếu API trả dữ liệu với preview, dùng luôn; còn không thì đặt default
        const initial = (response.data || []).map(f => ({
          ...f,
          lastMessage: f.lastMessage || '',
          lastMessageAt: f.lastMessageAt ? new Date(f.lastMessageAt) : null,
          unread: !!f.unread // nếu server trả thông tin unread
        }));
        setFriends(initial);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchFriends();
    else setLoading(false);
  }, [isAuthenticated]);

  // Lắng nghe private messages từ socket
  useEffect(() => {
    if (!socket || !user || !user.userId) return;

    const handlePrivateMessage = (message) => {
      // message.sender can be id or object
      const senderId = message.sender?._id?.toString() ?? message.sender?.toString();
      const receiverId = message.receiver?._id?.toString() ?? message.receiver?.toString();

      // Nếu message gửi tới user hiện tại (user nhận)
      if (receiverId !== user.userId?.toString()) return;

      setFriends(prev => {
        // tìm friend trong danh sách
        const idx = prev.findIndex(f => f._id?.toString() === senderId?.toString());
        const updatedAt = message.timestamp ? new Date(message.timestamp) : new Date();

        // nếu không tìm thấy friend (edge case) -> không thêm tự động (bạn có thể thêm nếu muốn)
        if (idx === -1) {
          // Optionally: add the sender to list if your API allows
          return prev;
        }

        // tạo object friend mới
        const updatedFriend = {
          ...prev[idx],
          lastMessage: message.content || '',
          lastMessageAt: updatedAt,
          unread: true
        };

        // move friend to top
        const newList = [updatedFriend, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return newList;
      });
    };

    socket.on('privateMessage', handlePrivateMessage);
    return () => {
      socket.off('privateMessage', handlePrivateMessage);
    };
  }, [socket, user]);

  // Khi người dùng click mở chat với friend: đánh dấu unread false (local) và gọi onFriendSelect
  const handleOpenFriend = (f) => {
    setFriends(prev => prev.map(p => p._id === f._id ? { ...p, unread: false } : p));
    if (onFriendSelect) onFriendSelect(f);
  };

  // Kiểm tra online
  const isUserOnline = (userId) => {
    if (!onlineUsers) return false;
    // convert both to string for safety
    return onlineUsers.some(u => u?.toString() === userId?.toString());
  };

  // Tính offline minutes (nếu cần)
  const offlineMinutes = (f) => {
    if (isUserOnline(f._id) || !f.lastSeen) return null;
    const mins = Math.floor((Date.now() - new Date(f.lastSeen).getTime()) / 60000);
    return mins;
  };

  // Sắp xếp: online trước, sau đó theo lastMessageAt (mới nhất lên đầu), fallback theo tên
  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = isUserOnline(a._id) ? 1 : 0;
    const bOnline = isUserOnline(b._id) ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline; // online first
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime; // recent first
    return (a.username || '').localeCompare(b.username || '');
  });

  if (loading) return <div className="loading">Đang tải danh sách bạn bè...</div>;

  return (
    <div className="friends-list" style={{ padding: 8 }}>
      {sortedFriends.length === 0 ? (
        <div className="empty-list"> {/* để trống theo yêu cầu: không hiện 'Chưa có tin nhắn' */} </div>
      ) : (
        sortedFriends.map(f => {
          const online = isUserOnline(f._id);
          return (
            <div
              key={f._id}
              className="friend-item"
              onClick={() => handleOpenFriend(f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 6px',
                cursor: 'pointer',
                borderRadius: 6,
                transition: 'background 0.12s',
                // hover style by inline: (you can move to CSS)
              }}
            >
              <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                {f.avatar ? (
                  <img
                    src={f.avatar}
                    alt={f.username}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                  />
                ) : (
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {(f.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Dấu chấm xanh nhỏ dưới góc phải avatar khi online */}
                {online && (
                  <span style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#2ecc71', // xanh lá
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px rgba(46,204,113,0.12)'
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600 }}>{f.username}</div>
                  {(!online && offlineMinutes(f) !== null) && (
                    <div style={{ fontSize: 12, color: '#888' }} title="Thời gian offline">{offlineMinutes(f)} phút</div>
                  )}
                </div>

                {/* Preview: blank when no message, bold when unread */}
                <div
                  className={`friend-last-message ${f.unread ? 'unread' : ''}`}
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: f.unread ? '#111' : '#666',
                    fontWeight: f.unread ? 700 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {f.lastMessage ? f.lastMessage : '' /* để trống nếu chưa có tin nhắn */}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default FriendList;
