import React, { useState } from 'react';
import './Login.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);
            const newToken = response.data.accessToken;
            
            // Đợi login hoàn thành và kiểm tra kết quả
            const loginSuccess = await login(newToken);
            
            if (loginSuccess) {
                navigate('/chat');
            } else {
                console.error('Login component - Login failed');
                setError('Đăng nhập thất bại - không thể lấy thông tin người dùng');
            }
        } catch (err) {
            console.error('Login component - Login error:', err);
            if (!err.response) {
                setError('Không thể kết nối tới máy chủ. Server đang bảo trì, vui lòng quay lại sau!');
            } else {
                setError(err.response?.data?.error || 'Đăng nhập thất bại');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Đăng nhập</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên đăng nhập:</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Mật khẩu:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="forgot-password">
                    <Link to="/forgot-password">Quên mật khẩu?</Link>
                    
                </div>
                
                <p>
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;