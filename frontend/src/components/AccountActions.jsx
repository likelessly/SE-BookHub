import React from 'react';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line no-unused-vars
const AccountActions = ({ role, setShowAddBookModal }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="account-actions">
      <button
        className="account-button primary"
        onClick={() => setShowAddBookModal(true)}
      >
        Add New Book
      </button>
      <button className="account-button secondary" onClick={() => navigate('/main')}>
        Browse Books
      </button>
      <button className="account-button logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default AccountActions;