// src/pages/AccountReader.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';
import { useNavigate } from 'react-router-dom';

const AccountReader = () => {
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returningBookId, setReturningBookId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  // ตรวจสอบ role ก่อนแสดงหน้า account
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'reader') {
      navigate('/login'); // หากไม่ใช่ reader ให้ redirect ไปที่หน้า login
    }
  }, [navigate]);

  const fetchAccountData = () => {
    axios
      .get('http://127.0.0.1:8000/api/account/reader/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(response => setAccountData(response.data))
      .catch(err => {
        console.error('Error fetching account data:', err);
        setError('Failed to load account data.');
      });
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleReturn = (borrowId, bookTitle) => {
    setReturnLoading(true);
    setReturningBookId(borrowId);
    
    // Immediately update UI to remove the book
    setAccountData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        user: {
          ...prevData.user,
          borrow_count: Math.max(0, prevData.user.borrow_count - 1)
        },
        borrowed_books: prevData.borrowed_books.filter(book => book.id !== borrowId)
      };
    });
    
    axios
      .post(`http://127.0.0.1:8000/api/books/return/${borrowId}/`, {}, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(response => {
        // Refresh data from server to ensure everything is in sync
        fetchAccountData();
        showNotification('success', `"${bookTitle}" returned successfully!`);
      })
      .catch(err => {
        console.error('Error returning book:', err);
        showNotification('error', 'Failed to return book. Please try again.');
        
        // Revert the optimistic update if there's an error
        fetchAccountData();
      })
      .finally(() => {
        setReturnLoading(false);
        setReturningBookId(null);
      });
  };

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
  
  if (!accountData) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading account data...</p>
    </div>
  );

  return (
    <div className="account-page">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="account-left">
        <img 
          src={accountData.user.profile_image || "/reader_default.jpg"} 
          alt="Profile"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/reader_default.jpg";
          }}
        />
        <h2>{accountData.user.name}</h2>
        <p>Role: {accountData.user.role}</p>
        <p>Registered: {new Date(accountData.user.registered_at).toLocaleDateString()}</p>
        <p>Borrowed Books: {accountData.user.borrow_count}</p>
        <button className="logout-button" onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/';
        }}>Logout</button>
      </div>
      
      <div className="account-right">
        <h3>Borrowed Books</h3>
        {accountData.borrowed_books.length > 0 ? (
          <div className="borrowed-books-container">
            <div className="borrowed-books-grid">
              {accountData.borrowed_books.map(borrow => (
                <div key={borrow.id} className="book-card">
                  <div className="book-cover">
                    <img
                      src={borrow.book.cover_image}
                      alt={borrow.book.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/cover_default.jpg";
                      }}
                    />
                    <div className="due-date-badge">
                      <span className="due-label">Due</span>
                      <span className="due-value">{new Date(borrow.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="book-info">
                    <h4 title={borrow.book.title}>{borrow.book.title}</h4>
                    <div className="book-tags">
                      {borrow.book.tags && borrow.book.tags.length > 0 ? 
                        borrow.book.tags.map((tag, index) => (
                          <span key={index} className="tag-pill">{tag}</span>
                        )) : 
                        <span className="no-tags">No Tags</span>
                      }
                    </div>
                    <p className="publisher"><span>Publisher:</span> {borrow.book.publisher_name}</p>
                    <div className="book-actions">
                      <button 
                        className="read-button" 
                        onClick={() => navigate(`/read/${borrow.id}`)}
                      >
                        Read Book
                      </button>
                      <button 
                        className={`return-button ${returnLoading && returningBookId === borrow.id ? 'loading' : ''}`}
                        onClick={() => handleReturn(borrow.id, borrow.book.title)}
                        disabled={returnLoading}
                      >
                        {returnLoading && returningBookId === borrow.id ? (
                          <>
                            <span className="button-loader"></span>
                            <span>Returning...</span>
                          </>
                        ) : 'Return Book'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-books-message">
            <img src="/no-books.svg" alt="No borrowed books" />
            <p>You haven't borrowed any books yet.</p>
            <button onClick={() => navigate('/')}>Browse Books</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountReader;
