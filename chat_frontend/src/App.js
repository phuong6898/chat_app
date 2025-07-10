import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import {SocketProvider} from './contexts/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatWindow from './components/Chat/ChatWindow';
import './App.css';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {NotificationProvider} from "./contexts/NotificationContext";

function App() {
    console.log('App - Rendering');
    
    return (
        <AuthProvider>
            <SocketProvider>
                <NotificationProvider>
                    <Router>
                        <div className="App">
                            <Routes>
                                <Route path="/login" element={<Login/>}/>
                                <Route path="/register" element={<Register/>}/>
                                <Route path="/chat" element={<ChatWindow/>}/>
                                <Route path="/" element={<Navigate to="/login"/>}/>
                            </Routes>
                            <ToastContainer position="top-right" autoClose={2000}/>
                        </div>
                    </Router>
                </NotificationProvider>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;