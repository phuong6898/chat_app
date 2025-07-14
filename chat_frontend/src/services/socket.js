// services/socket.js
import io from 'socket.io-client';
import { getToken } from '../utils/auth';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let privateMessageHandlers = [];

export const initializeSocket = (token) => {
    if (socket) return socket;

    console.log('Initializing socket with token:', token ? token.substring(0, 20) + '...' : 'missing');
    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('Socket connected');
        console.log('Socket userId:', socket.userId);
        // Gửi thông tin người dùng đang online
        socket.emit('userOnline', socket.userId);
    });

    socket.on('userOnline', (users) => {
        console.log('Online users:', users);
    });

    socket.on('privateMessage', (message) => {
        console.log('Private message received in socket service:', message);
        privateMessageHandlers.forEach(handler => handler(message));
    });

    return socket;

};

export const registerPrivateMessageHandler = (handler) => {
    console.log('Registering private message handler');
    privateMessageHandlers.push(handler);
    return () => {
        console.log('Unregistering private message handler');
        privateMessageHandlers = privateMessageHandlers.filter(h => h !== handler);
    };
};

export const unregisterPrivateMessageHandlers = () => {
    console.log('Unregistering all private message handlers');
    privateMessageHandlers = [];
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => {
    console.log('Getting socket:', socket);
    return socket;
};

export const sendPrivateMessage = (receiverId, content, tempId) => {
  if (!socket) return false;
  console.log('Sending private message:', { receiverId, content, tempId });
  return new Promise((resolve, reject) => {
    socket.emit('privateMessage', { receiverId, content, tempId }, (response) => {
      console.log('Private message response:', response);
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

// Tham gia phòng chat riêng
export const joinPrivateChat = (roomId) => {
    if (!socket) return false;
    console.log('Joining private chat room:', roomId);
    socket.emit('joinPrivateChat', roomId);
};