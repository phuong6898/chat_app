import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import {SocketProvider} from './contexts/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatWindow from './components/Chat/ChatWindow';
import Header from './components/Layout/Header';
import './App.css';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {NotificationProvider} from "./contexts/NotificationContext";
import ForgotPassword from './components/Auth/ForgotPassword';
import PublicRoute from './components/Auth/PublicRoute';
console.log({ 
    Login, Register, ChatWindow, Header, ForgotPassword, PublicRoute 
  });
function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <NotificationProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </NotificationProvider>
            </SocketProvider>
        </AuthProvider>
    );
}

function AppContent() {
    const { isAuthenticated, loading } = useAuth();
    return (
        <div className="App">
            {isAuthenticated && !loading && <Header />}
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>}/>
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>}/>
                <Route path="/chat" element={
                    <div className="chat-window">
                        <ChatWindow />
                    </div>
                }/>
                <Route path="/" element={<Navigate to="/login"/>}/>
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
            <ToastContainer position="top-right" autoClose={2000}/>
        </div>
    );
}

export default App;