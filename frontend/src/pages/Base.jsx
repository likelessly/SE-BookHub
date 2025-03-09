import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Base.css'; // ไฟล์ CSS สำหรับ navbar

const Base = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // รายการเส้นทางสำหรับหน้า Login/Signup (auth pages)
  const authRoutes = ['/', '/login', '/signup/reader', '/signup/publisher'];
  const isAuthPage = authRoutes.includes(location.pathname);

  const handleLogout = () => {
    // เคลียร์ token และ role จาก localStorage แล้วรีไดเร็กต์ไปหน้า login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId'); // ลบ userId ออกจาก localStorage
    navigate('/login');
  };

  // ดึง role ของผู้ใช้จาก localStorage (คาดว่าจะเป็น 'reader' หรือ 'publisher')
  const userRole = useState(localStorage.getItem('role'));
  const userId = useState(localStorage.getItem('userId'));

  useEffect(() => {
    // ตรวจสอบว่า userRole และ userId มีค่าแล้วหรือยัง
    if (userRole && userId) {
      if (userRole === 'reader') {
        navigate(`/account/reader/${userId}`);
      } else if (userRole === 'publisher') {
        navigate(`/account/publisher/${userId}`);
      }
    }
  }, [userRole, userId, navigate]); // เพิ่ม dependency ใน useEffect

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/">
            <img src="/path/to/logo.png" alt="BookHub Logo" className="logo" />
          </Link>
        </div>
        <div className="navbar-right">
          {isAuthPage ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup/reader" className="nav-link">Signup as Reader</Link>
              <Link to="/signup/publisher" className="nav-link">Signup as Publisher</Link> {/* เพิ่มลิงก์สำหรับ Signup Publisher */}
            </>
          ) : (
            <>
              <Link to="/main" className="nav-link">Search</Link>
              {/* ใช้ role เพื่อเลือกเส้นทาง account */}
              {userRole === 'reader' ? (
                <Link to={`/account/reader/${userId}`} className="nav-link">Account</Link> 
              ) : userRole === 'publisher' ? (
                <Link to={`/account/publisher/${userId}`} className="nav-link">Account</Link> 
              ) : (
                <Link to="/account" className="nav-link">Account</Link>
              )}
              <button onClick={handleLogout} className="nav-link logout-button">Logout</button>
            </>
          )}
        </div>
      </nav>
      <main>
        {children}
      </main>
    </>
  );
};

export default Base;
