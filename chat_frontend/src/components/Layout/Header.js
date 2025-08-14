import React, {useState, useRef, useEffect} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { friendsAPI } from '../../services/api';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);
  const { notifications, unreadCount, markAllRead, removeNotification } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClickOutside = (e) => {
    if (profileRef.current && !profileRef.current.contains(e.target)) {
      setShowProfileMenu(false);
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.5rem 1rem',borderBottom:'1px solid #e1e8ed' }}>
      <h1 style={{ margin:0,fontSize:'1.5rem' }}>Chat App</h1>
      <div style={{ display:'flex',alignItems:'center',gap:'1rem',position:'relative' }}>

        {/* Notification Bell */}
        <button
            onClick={() => { setShowNotifications(!showNotifications); markAllRead(); }}
                    style={{
                    position: 'relative',       // <<< add this
                    width:36,
                    height:36,
                    border:'2px solid #000',
                    borderRadius:'50%',
                    background:'none',
                    fontSize:'1.2rem',
                    color:'#000',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    cursor:'pointer'
                }}
        >
          🔔
          {unreadCount>0 && (
            <span style={{
              position:'absolute',top:4,right:4,
              background:'red',color:'#fff',width:16,height:16,
              fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'
            }}>{unreadCount}</span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div style={{ position:'absolute',top:48,right:60,width:300,background:'#fff',border:'1px solid #ccc',borderRadius:6,boxShadow:'0 2px 8px rgba(0,0,0,0.1)',zIndex:100 }}>
            <div style={{ padding:10,borderBottom:'1px solid #e1e8ed',fontWeight:'bold' }}>Thông báo</div>
            <div style={{ maxHeight:300,overflowY:'auto' }}>
              {notifications.length===0
                ? <div style={{ padding:10,color:'#666' }}>Không có thông báo mới</div>
                : notifications.map(n => (
                  <div key={n.id} style={{ position:'relative',padding:10,borderBottom:'1px solid #f0f0f0',background:n.read?'#fff':'#f9fbff',cursor:'pointer' }}>
                    <div style={{ fontWeight:'bold' }}>
                      {n.type==='friendRequest'
                        ? <><span>{n.from}</span> đã gửi lời mời kết bạn <button style={{ marginLeft:8 }} onClick={()=>friendsAPI.respondToRequest(n.id,'accept')}>Xác nhận</button></>
                        : <><span>{n.by}</span> đã chấp nhận lời mời</>
                      }
                    </div>
                    <div style={{ fontSize:12,color:'#888' }}>{n.timestamp.toLocaleTimeString()}</div>
                    <button onClick={()=>removeNotification(n.id)} style={{ position:'absolute',top:8,right:8,border:'none',background:'none',cursor:'pointer',fontSize:12 }}>×</button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Avatar + Dropdown */}
        <div ref={profileRef} style={{ position:'relative' }}>
          <button onClick={()=>setShowProfileMenu(!showProfileMenu)} style={{ display:'flex',alignItems:'center',gap:4,border:'none',background:'none',cursor:'pointer' }}>
            <img src={user.avatar} alt="avatar" style={{ width:36,height:36,borderRadius:'50%',border:'2px solid #000' }} />
            <span style={{ fontWeight:500 }}>{user.username}</span>
            <span style={{ fontSize:12 }}>▾</span>
          </button>

          {showProfileMenu && (
            <div style={{ position:'absolute',top:48,right:0,width:200,background:'#fff',border:'1px solid #ccc',borderRadius:6,boxShadow:'0 2px 8px rgba(0,0,0,0.1)',zIndex:100 }}>
              <div style={{ padding:10,borderBottom:'1px solid #e1e8ed',cursor:'pointer' }} onClick={()=>navigate(`/profile/${user.userId}`)}>Thông tin cá nhân</div>
              <div style={{ padding:10,cursor:'pointer' }} onClick={handleLogout}>Đăng xuất</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
