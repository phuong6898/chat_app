import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import {useSocket} from '../../contexts/SocketContext';
import {
    sendPrivateMessage,
} from '../../services/socket';
import {useNavigate} from 'react-router-dom';
import {messagesAPI, roomsAPI} from '../../services/api';
import Sidebar from '../Layout/Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import RoomDetails from '../Room/RoomDetails';
import { toast } from 'react-toastify';

const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [chatType, setChatType] = useState('private');
    const [isMounted, setIsMounted] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showRoomDetails, setShowRoomDetails] = useState(false);

    const {user, loading} = useAuth();
    const {socket, setSocket} = useSocket();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const loadMessages = useCallback(async () => {
        if (!currentChat || !currentChat._id || !user) {
            return;
        }
        try {
            setLoadingMessages(true);
            let response;

            if (chatType === 'room') {
                response = await messagesAPI.getRoomMessages(currentChat._id);
            } else {
                response = await messagesAPI.getPrivateMessages(currentChat._id);
            }

            const loadedMessages = response.data.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
                sender: msg.sender || {_id: msg.senderId, username: 'Người dùng'}
            }));
            if (isMounted) {
                setMessages(loadedMessages);
                
                const unreadIds = loadedMessages
                    .filter(m => m.sender._id !== user.userId && (!m.readBy || !m.readBy.includes(user.userId)))
                    .map(m => m._id);
                    
                if (unreadIds.length > 0) {
                    await messagesAPI.markMessagesAsRead(unreadIds);
                }
            }
        } catch (error) {
            console.error('Load messages error:', error);
        } finally {
            if (isMounted) setLoadingMessages(false);
        }
    }, [currentChat, chatType, user, isMounted]);

    const handleIncomingMessage = useCallback((message) => {
        if (!currentChat || !user || !isMounted || !user.userId) return;
    
        const senderId   = message.sender?._id?.toString()   ?? message.sender?.toString();
        const receiverId = message.receiver?._id?.toString() ?? message.receiver?.toString();
        const currentChatId = currentChat._id?.toString();
        const userId = user.userId?.toString();
    
        if (chatType === 'private') {
            const isCurrentPrivateChat = 
                (senderId === currentChatId && receiverId === userId) ||
                (senderId === userId        && receiverId === currentChatId);
    
            if (!isCurrentPrivateChat) return;
    
            setMessages(prev => {
                if (message.tempId) {
                    const idx = prev.findIndex(m => m._id === message.tempId);
                    if (idx !== -1) {
                        const newArr = [...prev];
                        newArr[idx] = message;
                        return newArr;
                    }
                }
                if (!prev.some(m => m._id === message._id)) {
                    return [...prev, message];
                }
                return prev;
            });
    
        } else if (chatType === 'room') {
            const roomId = message.room?._id?.toString() ?? message.room?.toString();
            if (roomId !== currentChatId) return;
    
            setMessages(prev => {
                if (message.tempId) {
                    const idx = prev.findIndex(m => m._id === message.tempId);
                    if (idx !== -1) {
                        const newArr = [...prev];
                        newArr[idx] = message;
                        return newArr;
                    }
                }
                return [...prev, message];
            });
        }
    }, [chatType, currentChat, user, isMounted]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket || !isMounted) return;

        const handleRoomMsg = (msg) => {
            if (isMounted) handleIncomingMessage(msg);
        };
        
        const handlePrivateMsg = (msg) => {
            if (isMounted) handleIncomingMessage(msg);
        };
        socket.on('roomMessage', handleRoomMsg);
        socket.on('privateMessage', handlePrivateMsg);

        return () => {
            if (socket) {
                socket.off('roomMessage', handleRoomMsg);
                socket.off('privateMessage', handlePrivateMsg);
            }
        };
    }, [ socket, handleIncomingMessage, isMounted]);

    useEffect(() => {
        return () => {
            if (socket && currentChat && chatType === 'room') {
                socket.emit('leaveRoom', currentChat._id);
            }
        };
    }, [socket, currentChat, chatType]);

    const handleSendMessage = async (content) => {
        if (!currentChat || !socket || !content.trim() || !user || !user.userId) return;

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            _id: tempId,
            sender: user.userId,
            content,
            timestamp: new Date(),
            isTemp: true
        };

        setMessages(prev => [...prev, tempMessage]);

        if (chatType === 'room') {
            socket.emit('roomMessage', {
                roomId: currentChat._id,
                content,
                tempId
            });
        } else if (chatType === 'private') {
            try {
                const response = await sendPrivateMessage(currentChat._id, content, tempId);
                if (response.message) {
                    setMessages(prev => prev.map(m =>
                        m._id === tempId ? { ...response.message, timestamp: new Date(response.message.timestamp) } : m
                    ));
                }
            } catch (err) {
                setMessages(prev => prev.filter(m => m._id !== tempId));
            }
        }
    };

    const handleLeaveRoom = async () => {
        if (!currentChat || chatType !== 'room') return;
        
        if (!window.confirm('Bạn có chắc chắn muốn rời khỏi phòng này?')) return;
        
        try {
            await roomsAPI.leaveRoom(currentChat._id);
            
            // Clear current chat
            setCurrentChat(null);
            setChatType('private');
            setMessages([]);
            
            // Leave room socket
            if (socket) {
                socket.emit('leaveRoom', currentChat._id);
            }
            
            toast.success('Đã rời khỏi phòng thành công!');
        } catch (error) {
            console.error('Leave room error:', error);
            toast.error(error.response?.data?.error || 'Không thể rời phòng');
        }
    };

    const isRoomAdmin = () => {
        return currentChat && currentChat.createdBy && currentChat.createdBy._id === user?.userId;
    };

    const handleChatSelect = async (chat, type) => {
        try {
            setCurrentChat(chat);
            setChatType(type);
            setMessages([]);
            
            if (type === 'private') {
                const { data } = await messagesAPI.getPrivateMessages(chat._id);
                setMessages(data.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                    sender: msg.sender || { _id: msg.senderId, username: 'Người dùng' }
                })));
            } else if (type === 'room') {
                if (socket) {
                    socket.emit('joinRoom', chat._id);
                }
                
                const { data } = await messagesAPI.getRoomMessages(chat._id);
                setMessages(data.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                    sender: msg.sender || { _id: msg.senderId, username: 'Người dùng' }
                })));
            }
        } catch (error) {
            setCurrentChat(null);
            setMessages([]);
        }
    };

    const handleRecallOrDelete = async (message) => {
        try {
            await messagesAPI.recallOrDeleteMessage(message._id);
            await loadMessages();
        } catch (err) {
            toast.error('Lỗi khi thu hồi/xóa tin nhắn!');
        }
    };
   
    const handleCopy = (message) => {
        if (message.recalled) return;
        navigator.clipboard.writeText(message.content || '');
    };

    // Render loading state
    if (loading) {
        return <div>Đang kiểm tra đăng nhập...</div>;
    }

    // Render null if no user
    if (!user) {
        return null;
    }
    
    return (
        <>
            {user && <Sidebar onChatSelect={handleChatSelect}/>} 
            <div className="chat-content">
                <div className="main-chat">
                    {currentChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <h3>{currentChat.name || currentChat.username}</h3>
                                    <span className="chat-type">
                                        {chatType === 'private' ? 'Chat riêng' : 'Phòng chat'}
                                    </span>
                                </div>
                                <div className="chat-header-actions">
                                    {chatType === 'room' && (
                                        <button 
                                            className="btn-room-settings"
                                            onClick={() => setShowRoomDetails(true)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: 'transparent',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '16px'
                                            }}
                                            title="Cài đặt phòng"
                                        >
                                            ⚙️
                                        </button>
                                    )}
                                </div>
                            </div>
                            {loadingMessages ? (
                                <div className="loading-messages">Đang tải tin nhắn...</div>
                            ) : (
                                <>
                                    <div className="message-list">
                                        <MessageList
                                            messages={messages}
                                            currentUserId={user?.userId}
                                            onRecall={handleRecallOrDelete}
                                            onDelete={handleRecallOrDelete}
                                            onCopy={handleCopy}
                                        />
                                        <div ref={messagesEndRef}/>
                                    </div>
                                    <MessageInput onSendMessage={handleSendMessage}/>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Room Details Modal */}
            {showRoomDetails && currentChat && chatType === 'room' && (
                <RoomDetails
                    roomId={currentChat._id}
                    onClose={() => setShowRoomDetails(false)}
                    onRoomUpdate={() => {
                        // Refresh current chat data
                        handleChatSelect(currentChat, 'room');
                    }}
                />
            )}
        </>
    );
};

export default ChatWindow;