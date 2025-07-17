// services/api.js
import axios from 'axios';
import { getToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
});

// Interceptor để thêm token vào header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});
// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
};

// Friends API
export const friendsAPI = {
    getFriends: () => api.get('/friends'),
    addFriend: (friendId) => api.post('/friend-requests', { to:friendId }),
    removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
    getFriendRequests: () => api.get('/friends/requests'),
    respondToRequest: (requestId, action) => api.post(`/friend-requests/${requestId}/respond`, { action }),
    getSentRequests: () => api.get('/friend-requests/sent'),
    getReceivedRequests: () => api.get('/friend-requests/received'),
};

// Rooms API
export const roomsAPI = {
    getRooms: (params) => api.get('/rooms',{params}),
    getPublicRooms: (params) => api.get('/rooms/public', {params}),
    createRoom: (roomData) => api.post('/rooms', roomData),
    joinRoom: (roomId) => api.post(`/rooms/${roomId}/join`),
    leaveRoom: (roomId) => api.delete(`/rooms/${roomId}/leave`),
    addMember: (roomId, userId) => api.post(`/rooms/${roomId}/members`, { userId }),
    removeMember: (roomId, userId) => api.delete(`/rooms/${roomId}/members/${userId}`),
    requestJoinRoom: (roomId) => api.post(`/rooms/${roomId}/request-join`),
};

// Users API (THÊM PHẦN NÀY)
export const usersAPI = {
    searchUsers: (query) => api.get('/users/search', { params: { query } }),
    getUser: (userId) => api.get(`/users/${userId}`),
    updateProfile: (data) => api.put('/users/profile', data),
    getOnlineUsers: () => api.get('/users/online'),
};

// Messages API
export const messagesAPI = {
    getMessages: (roomId) => api.get(`/messages/room/${roomId}`),
    getPrivateMessages: (friendId) => api.get(`/chat/private/${friendId}`),
    sendMessage: (data) => api.post('/messages', data),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    getRoomMessages: (roomId) => api.get(`/chat/room/${roomId}`),
    startPrivateChat: (receiverId) => api.post('/chat/private/start', { receiverId }),
    recallOrDeleteMessage: (messageId) => api.post(`/chat/message/${messageId}/recall-or-delete`),
    markMessagesAsRead: (messageIds) => api.post('/chat/message/mark-read', { messageIds }),
};

export default api;