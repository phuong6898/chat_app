import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Enter username, 2: Enter code, 3: New password
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const navigate = useNavigate();

    // Bước 1: Nhập username
    const handleUsernameSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            // Gọi API để gửi mã xác nhận
            const response = await authAPI.sendResetCode(username);
            setMessage('Mã xác nhận đã được gửi đến email của bạn');
            setStep(2);
        } catch (err) {
            console.error('Send reset code error:', err);
            setError(err.response?.data?.error || 'Không thể gửi mã xác nhận');
        } finally {
            setLoading(false);
        }
    };

    // Bước 2: Nhập mã xác nhận
    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            // Gọi API để xác nhận mã
            const response = await authAPI.verifyResetCode(username, code);
            setMessage('Mã xác nhận đúng! Vui lòng nhập mật khẩu mới');
            setStep(3);
        } catch (err) {
            console.error('Verify code error:', err);
            setError(err.response?.data?.error || 'Mã xác nhận không đúng');
        } finally {
            setLoading(false);
        }
    };

    // Bước 3: Nhập mật khẩu mới
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setLoading(false);
            return;
        }
        
        if (passwords.newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            setLoading(false);
            return;
        }
        
        try {
            // Gọi API để đặt lại mật khẩu
            const response = await authAPI.resetPassword(username, code, passwords.newPassword);
            setMessage('Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.error || 'Đặt lại mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-form">
                <h2>Quên mật khẩu</h2>
                
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
                
                {/* Bước 1: Nhập username */}
                {step === 1 && (
                    <form onSubmit={handleUsernameSubmit}>
                        <div className="form-group">
                            <label>Tên đăng nhập:</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Nhập tên đăng nhập của bạn"
                            />
                        </div>
                        
                        <button type="submit" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                        </button>
                    </form>
                )}
                
                {/* Bước 2: Nhập mã xác nhận */}
                {step === 2 && (
                    <form onSubmit={handleCodeSubmit}>
                        <div className="form-group">
                            <label>Mã xác nhận:</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                placeholder="Nhập mã xác nhận từ email"
                            />
                        </div>
                        
                        <button type="submit" disabled={loading}>
                            {loading ? 'Đang xác nhận...' : 'Xác nhận mã'}
                        </button>
                        
                        <div className="resend-code">
                            <button 
                                type="button" 
                                onClick={() => setStep(1)}
                                className="link-button"
                            >
                                Gửi lại mã xác nhận
                            </button>
                        </div>
                    </form>
                )}
                
                {/* Bước 3: Nhập mật khẩu mới */}
                {step === 3 && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label>Mật khẩu mới:</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Nhập mật khẩu mới"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Xác nhận mật khẩu:</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>
                        
                        <button type="submit" disabled={loading}>
                            {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                        </button>
                    </form>
                )}
                
                <div className="back-to-login">
                    <Link to="/login">Quay lại đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;