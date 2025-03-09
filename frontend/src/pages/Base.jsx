import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Base.css';

const Base = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');

  // Auth pages don't need the account button
  const authRoutes = ['/', '/login', '/signup/reader', '/signup/publisher'];
  const isAuthPage = authRoutes.includes(location.pathname);

  // Remove the automatic redirection from home page
  // This allows the logo click to always navigate to home

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    if (userRole === 'reader') {
      navigate(`/account/reader/${userId}`);
    } else if (userRole === 'publisher') {
      navigate(`/account/publisher/${userId}`);
    } else {
      navigate('/login');
    }
  };

  // New function to handle logo click
  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          {/* Use onClick handler for logo instead of Link */}
          <a href="#" onClick={handleLogoClick} className="logo">
            BookHub
          </a>
        </div>
        <div className="navbar-right">
          {isAuthPage && !token ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup/reader" className="nav-link">Signup as Reader</Link>
              <Link to="/signup/publisher" className="nav-link">Signup as Publisher</Link>
            </>
          ) : (
            <>
              <Link to="/main" className="nav-link">Search</Link>
              <a href="#" onClick={handleAccountClick} className="nav-link">Account</a>
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
