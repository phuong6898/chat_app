import React, { useEffect, useRef } from 'react';

const MessageList = ({ messages, currentUserId }) => {
    const messagesEndRef = useRef(null);

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
        console.log('Checking message ownership:', { 
            senderId, 
            senderIdType: typeof senderId,
            currentUserId, 
            currentUserIdType: typeof currentUserId,
            message 
        });
        return senderId === currentUserId;
    };



    console.log('MessageList - Rendering with:', { 
        messagesCount: messages.length, 
        currentUserId,
        messages: messages.map(m => ({ 
            id: m._id, 
            sender: m.sender?._id || m.sender,
            content: m.content?.substring(0, 20) + '...'
        }))
    });
    
    return (
        <div className="message-list">
            {messages.map((message) => (
                <div
                    key={message._id || message.tempId}
                    className={`message ${isOwnMessage(message) ? 'own-message' : 'other-message'}`}
                >
                    {/* CHỈ HIỂN THỊ TÊN NẾU LÀ TIN NHẮN CỦA NGƯỜI KHÁC VÀ ĐÃ CÓ THÔNG TIN NGƯỜI GỬI */}
                    {!isOwnMessage(message) && message.sender?.username && (
                        <div className="message-sender">
                            {message.sender.username}
                        </div>
                    )}

                    <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">
                            {formatTime(message.timestamp)}
                            {message.isTemp && (
                                <span className="sending-indicator"> (Đang gửi...)</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;