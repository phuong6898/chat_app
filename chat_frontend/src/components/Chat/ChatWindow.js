import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import {useSocket} from '../../contexts/SocketContext';
import {
    initializeSocket,
    registerPrivateMessageHandler,
    sendPrivateMessage,
    joinPrivateChat
} from '../../services/socket';
import {useNavigate} from 'react-router-dom';
import {messagesAPI} from '../../services/api';
import Header from '../Layout/Header';
import Sidebar from '../Layout/Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [chatType, setChatType] = useState('private');
    const [loadingMessages, setLoadingMessages] = useState(false);

    const {user,loading} = useAuth();
    const {socket, setSocket} = useSocket();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // Lắng nghe tin nhắn riêng
    const handlePrivateMessage = useCallback((message) => {
        if (chatType === 'private' && currentChat) {
            console.log('Private message received:', message);
            console.log('Private message IDs:', {
                messageReceiver: message.receiver,
                messageSender: message.sender,
                currentChatId: currentChat._id,
                messageReceiverId: message.receiver?._id,
                messageSenderId: message.sender?._id
            });
            
            // Kiểm tra cả dạng string và ObjectId
            const isCurrentChat = 
                (message.sender === currentChat._id || 
                 message.receiver === currentChat._id ||
                 (message.sender && message.sender._id === currentChat._id) || 
                 (message.receiver && message.receiver._id === currentChat._id));

            if (isCurrentChat) {
                setMessages(prev => {
                    if (message.tempId) {
                        const existingIndex = prev.findIndex(m => m._id === message.tempId);
                        if (existingIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[existingIndex] = message;
                            return newMessages;
                        }
                    }

                    // Kiểm tra xem tin nhắn đã tồn tại chưa
                    if (!prev.some(m => m._id === message._id)) {
                        return [...prev, message];
                    }

                    return prev;
                });
            }
        }
    }, [currentChat, chatType]);

    const loadMessages = useCallback(async () => {
        if (!currentChat || !currentChat._id) {
            console.log('Skipping message load: currentChat is null or missing _id');
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

            setMessages(response.data.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
                sender: msg.sender || {_id: msg.senderId, username: 'Người dùng'}
            })));
            console.log('Loaded messages:', response.data);
        } catch (error) {
            console.error('Load messages error:', error);
        } finally {
            setLoadingMessages(false);
        }
    }, [currentChat, chatType]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        console.log('ChatWindow - Effect triggered:', { loading, user: user ? 'present' : 'missing', socket: socket ? 'present' : 'missing' });
        
        if (!loading && !user) {
            navigate('/login');
            return;
        }

        const unregister = registerPrivateMessageHandler(handlePrivateMessage);

        if (!socket) return;

        const handleIncomingMessage = useCallback((message) => {
            console.log('Incoming message:', message, 'Current chat:', currentChat, 'Chat type:', chatType);
            console.log('Message IDs:', {
                messageReceiver: message.receiver,
                messageSender: message.sender,
                currentChatId: currentChat?._id,
                messageReceiverId: message.receiver?._id,
                messageSenderId: message.sender?._id
            });
            
            // Kiểm tra cả dạng string và ObjectId
            const isCurrentChat = currentChat && 
                (message.receiver === currentChat._id || 
                 message.sender === currentChat._id ||
                 (message.receiver && message.receiver._id === currentChat._id) || 
                 (message.sender && message.sender._id === currentChat._id));

            if (chatType === 'private' && isCurrentChat) {
                setMessages(prev => {
                    if (message.tempId) {
                        const existingIndex = prev.findIndex(m => m._id === message.tempId);
                        if (existingIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[existingIndex] = message;
                            return newMessages;
                        }
                    }
                    if (!prev.some(m => m._id === message._id)) {
                        return [...prev, message];
                    }
                    return prev;
                });
            } else if (chatType === 'room' && currentChat && message.room === currentChat._id) {
                setMessages(prev => {
                    if (message.tempId) {
                        const existingIndex = prev.findIndex(m => m._id === message.tempId);
                        if (existingIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[existingIndex] = message;
                            return newMessages;
                        }
                    }
                    return [...prev, message];
                });
            }
        }, [currentChat, chatType]);

        useEffect(() => {
            if (!socket) return;
            socket.on('roomMessage', handleIncomingMessage);
            socket.on('privateMessage', handleIncomingMessage);
            return () => {
                socket.off('roomMessage', handleIncomingMessage);
                socket.off('privateMessage', handleIncomingMessage);
            };
        }, [socket, handleIncomingMessage]);

    }, [user, loading, navigate, socket, setSocket, handlePrivateMessage]);

    useEffect(() => {
        console.log('ChatWindow - Current chat effect triggered:', { currentChat });
        if (currentChat) {
            (async () => {
                await loadMessages();
            })();
        }
    }, [currentChat]);

    const handleSendMessage = async (content) => {
        if (!currentChat || !socket || !content.trim()) return;
        
        console.log('Sending message to:', currentChat._id, 'Type:', typeof currentChat._id);
        console.log('Current user ID:', user.userId, 'Type:', typeof user.userId);

        // Tạo tin nhắn tạm trước khi gui
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
                console.error('Gửi privateMessage thất bại', err);
                // Xóa tempMessage nếu gửi thất bại
                setMessages(prev => prev.filter(m => m._id !== tempId));
            }
        }
    };

    const transformMessages = (rawMsgs) => {
        console.log('Transforming messages:', rawMsgs);
        return rawMsgs.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            sender: msg.sender || { _id: msg.senderId, username: 'Người dùng' }
        }));
    };

    const handleChatSelect = async (friend, type) => {
        try {
            console.log('Selecting chat with friend:', friend);
            console.log('Friend ID type:', typeof friend._id, 'Value:', friend._id);
            setCurrentChat(friend);
            setChatType('private');
            setMessages([]);
            // Load tin nhắn từ API
            const { data } = await messagesAPI.getPrivateMessages(friend._id);
            console.log('Chat messages loaded:', data);
            setMessages(transformMessages(data));
        } catch (error) {
            console.error('Error selecting chat:', error);
            setCurrentChat(null);
            setMessages([]);
        }
    };

    console.log('ChatWindow - Rendering with:', { 
        user: user ? 'present' : 'missing', 
        currentChat, 
        messagesCount: messages.length,
        chatType 
    });
    
    return (
        <div className="chat-window">
            <Header/>
            <div className="chat-content">
                {user && <Sidebar onChatSelect={handleChatSelect}/>} {/* Chỉ render Sidebar khi đã đăng nhập */}
                <div className="main-chat">
                    {currentChat ? (
                        <>
                            <div className="chat-header">
                                <h3>{currentChat.name || currentChat.username}</h3>
                                <span className="chat-type">
                                    {chatType === 'private' ? 'Chat riêng' : 'Phòng chat'}
                                </span>
                            </div>

                            {loadingMessages ? (
                                <div className="loading-messages">Đang tải tin nhắn...</div>
                            ) : (
                                <>
                                    <MessageList messages={messages} currentUserId={user?.userId}/>
                                    <div ref={messagesEndRef}/>
                                </>
                            )}

                            <MessageInput onSendMessage={handleSendMessage}/>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;