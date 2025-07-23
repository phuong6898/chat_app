import React, { useEffect, useRef, useState } from 'react';
import { FaEllipsisV } from 'react-icons/fa';
import './MessageList.css'; // Thêm file css nếu chưa có
import { messagesAPI } from '../../services/api';

const MessageList = ({ messages, currentUserId, onRecall, onDelete, onCopy }) => {
    const messagesEndRef = useRef(null);
    const [menuMessageId, setMenuMessageId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [menuAlign, setMenuAlign] = useState('right'); // 'right' hoặc 'left'
    const iconRefs = useRef({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (timestamp) => {
        if (typeof timestamp === 'string') {
            timestamp = new Date(timestamp);
        }
        return timestamp.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Kiểm tra xem tin nhắn có phải của người dùng hiện tại không
    const isOwnMessage = (message) => {
        const senderId = message.sender?._id || message.sender;
        // console.log('Checking message ownership:', { senderId, senderIdType: typeof senderId, currentUserId, currentUserIdType: typeof currentUserId, message });
        return senderId === currentUserId;
    };

    // Kiểm tra điều kiện thu hồi
    const canRecall = (message) => {
        if (!isOwnMessage(message)) return false;
        if (message.recalled) return false;
        // Chỉ cần chưa ai đọc (readBy chỉ có sender hoặc rỗng)
        const onlySenderRead = !message.readBy || message.readBy.length === 0 || (message.readBy.length === 1 && (message.readBy[0] === currentUserId || (message.readBy[0]?._id === currentUserId)));
        return onlySenderRead;
    };

    // Xử lý click ngoài menu để ẩn
    useEffect(() => {
        const handleClick = (e) => {
            setMenuMessageId(null);
        };
        if (menuMessageId) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [menuMessageId]);

    // Long press logic
    const longPressTimeout = useRef();
    const handlePressStart = (message, e) => {
        e.stopPropagation();
        longPressTimeout.current = setTimeout(() => {
            setMenuMessageId(message._id);
            setMenuPosition({ x: e.clientX, y: e.clientY });
        }, 500); // 500ms nhấn giữ
    };
    const handlePressEnd = () => {
        clearTimeout(longPressTimeout.current);
    };


    // console.log('MessageList - Rendering with:', { messagesCount: messages.length, currentUserId, messages: messages.map(m => ({ id: m._id, sender: m.sender?._id || m.sender, content: m.content?.substring(0, 20) + '...' })) });
    
    return (
        <div className="message-list">
            {messages.map((message, idx) => {
                console.log('🔍 message.sender:', message.sender);
                if (message.deletedBy && message.deletedBy.includes(currentUserId)) return null;
                const own = isOwnMessage(message);
                const handleMsgClick = async () => {
                    if (!own && (!message.readBy || !message.readBy.includes(currentUserId))) {
                        try {
                            await messagesAPI.markMessagesAsRead([message._id]);
                            // Cập nhật lại readBy trong state (tạm thời, không reload toàn bộ)
                            message.readBy = [...(message.readBy || []), currentUserId];
                        } catch {}
                    }
                };
                return (
                    <div
                        key={message._id || message.tempId}
                        className={`message ${own ? 'own-message' : 'other-message'} message-hover-group`}
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            justifyContent: own ? 'flex-end' : 'flex-start',
                            margin: '6px 0'
                        }}
                        onClick={handleMsgClick}
                    >
                        {/* Nếu là tin nhắn của mình, dấu ba chấm bên trái */}
                        {own && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div
                                    ref={el => iconRefs.current[message._id] = el}
                                    className={`message-menu-icon${menuMessageId === message._id ? ' visible' : ''}`}
                                    style={{ cursor: 'pointer', margin: '0 3px 0 0', userSelect: 'none', alignSelf: 'center' }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        const rect = iconRefs.current[message._id]?.getBoundingClientRect();
                                        setMenuMessageId(message._id);
                                        setMenuPosition({ x: rect?.left || 0, y: rect?.bottom || 0 });
                                        setMenuAlign('left');
                                    }}
                                >
                                    <FaEllipsisV size={16} color="#888" />
                                </div>
                            </div>
                        )}
                        <div className="message-avatar" style={{ marginRight: 8 }}>
                            {message.sender && message.sender.avatar ? (
                                <img src={message.sender.avatar} alt={message.sender.username} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                            ) : (
                                <div className="avatar-circle">{message.sender && message.sender.username ? message.sender.username.charAt(0).toUpperCase() : '?'}</div>
                            )}
                        </div>
                        <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
                            {!own && message.sender?.username && (
                                <div className="message-sender">
                                    {message.sender.username}
                                </div>
                            )}
                            <div className="message-content" style={{ background: own ? '#667eea' : '#f1f0f0', color: own ? '#fff' : '#222', borderRadius: 16, padding: '7px 14px', fontSize: 15, minWidth: 40, maxWidth: 420, wordBreak: 'break-word', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                                <div className="message-text">
                                    {message.recalled ? <i>Tin nhắn đã được thu hồi</i> : message.content}
                                </div>
                                <div className="message-time" style={{ fontSize: 12, color: own ? '#e0e0e0' : '#888', marginTop: 2, textAlign: own ? 'right' : 'left' }}>
                                    {formatTime(message.timestamp)}
                                    {message.isTemp && (
                                        <span className="sending-indicator"> (Đang gửi...)</span>
                                    )}
                                </div>
                                {own && message.readBy && message.readBy.some(id => id !== currentUserId && id !== message.sender?._id) && (
                                    <div style={{ fontSize: '0.8em', color: '#222', opacity: 0.5, marginTop: 2, textAlign: 'right' }}>Đã xem</div>
                                )}
                            </div>
                        </div>
                        {/* Nếu là tin nhắn của người khác, dấu ba chấm bên phải */}
                        {!own && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div
                                    ref={el => iconRefs.current[message._id] = el}
                                    className={`message-menu-icon${menuMessageId === message._id ? ' visible' : ''}`}
                                    style={{ cursor: 'pointer', margin: '0 0 0 3px', userSelect: 'none', alignSelf: 'center' }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        const rect = iconRefs.current[message._id]?.getBoundingClientRect();
                                        setMenuMessageId(message._id);
                                        setMenuPosition({ x: rect?.right || 0, y: rect?.bottom || 0 });
                                        setMenuAlign('right');
                                    }}
                                >
                                    <FaEllipsisV size={16} color="#888" />
                                </div>
                            </div>
                        )}
                        {menuMessageId === message._id && !message.recalled && (
                            <div
                                className="message-action-menu"
                                style={{
                                    position: 'fixed',
                                    top: menuPosition.y - 8 - 48, // 48px chiều cao menu, 8px margin
                                    left: menuAlign === 'right' ? menuPosition.x - 180 : menuPosition.x,
                                    zIndex: 1000,
                                    background: '#fff',
                                    border: '1px solid #ccc',
                                    borderRadius: 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: 180,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                                }}
                                onMouseDown={e => e.stopPropagation()}
                            >
                                {canRecall(message) && <div className="menu-item" style={{padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid #eee'}} onMouseDown={() => { onRecall && onRecall(message); setMenuMessageId(null); }}>Thu hồi</div>}
                                <div className="menu-item" style={{padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid #eee'}} onMouseDown={() => { onDelete && onDelete(message); setMenuMessageId(null); }}>Xóa</div>
                                <div className="menu-item" style={{padding: '12px 18px', cursor: 'pointer'}} onMouseDown={() => { onCopy && onCopy(message); setMenuMessageId(null); }}>Sao chép</div>
                            </div>
                        )}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;