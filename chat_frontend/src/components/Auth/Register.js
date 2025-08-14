import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Chỉ preview avatar, không gửi lên server ngay
  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    let avatarUrl = '';
    if (avatarFile) {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('avatar', avatarFile);
      try {
        const res = await fetch('http://localhost:5000/api/upload/avatar', {
          method: 'POST',
          body: uploadData
        });
        const data = await res.json();
        avatarUrl = data.url;
      } catch (err) {
        toast.error('Lỗi khi upload ảnh đại diện');
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
    }

    // Gửi form đăng ký kèm avatarUrl
    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        avatar: avatarUrl
      });
      toast.success('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Đăng ký</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username & Email */}
          <div className="form-group">
            <label>Tên đăng nhập:</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          {/* Avatar Preview Only */}
          <div className="form-group">
            <label>Ảnh đại diện (preview):</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            {avatarPreview && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={avatarPreview}
                  alt="preview"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                />
              </div>
            )}
          </div>

          {/* Password Fields */}
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
          <div className="form-group">
            <label>Xác nhận mật khẩu:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading || uploading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
