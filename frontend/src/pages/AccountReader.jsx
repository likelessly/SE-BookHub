// src/pages/AccountReader.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaCalendarAlt, FaClock, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { BiErrorCircle } from 'react-icons/bi';

const AccountReader = () => {
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returningBookId, setReturningBookId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'reader') {
      navigate('/login', { state: { from: '/account' } });
      return;
    }

    fetchAccountData();
  }, [navigate]);

  const fetchAccountData = () => {
    setLoading(true);
    axios
      .get('http://127.0.0.1:8000/api/account/reader/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(response => {
        console.log('Account Data:', response.data);
        setAccountData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching account data:', err);
        setError('Failed to load account data. Please try again later.');
        setLoading(false);
      });
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleReturn = async (borrowId, bookTitle) => {
    if (returnLoading) return;
    
    setReturnLoading(true);
    setReturningBookId(borrowId);

    try {
      const response = await axios({
        method: 'post',
        url: `http://127.0.0.1:8000/api/books/return/${borrowId}/`,
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        // Update local state
        setAccountData(prev => {
          if (!prev || !prev.borrowed_books) return prev;
          
          const updatedBorrowedBooks = prev.borrowed_books.filter(borrow => borrow.id !== borrowId);
          return {
            ...prev,
            borrowed_books: updatedBorrowedBooks,
            user: {
              ...prev.user,
              borrow_count: Math.max(0, prev.user.borrow_count - 1)
            }
          };
        });

        showNotification('success', `You have successfully returned "${bookTitle}"`);
        fetchAccountData(); // Refresh data
      } else {
        console.error('Return book failed:', response.data);
        showNotification('error', response.data.message || 'Failed to return book. Please try again.');
      }
    } catch (error) {
      console.error('Error returning book:', error.response ? error.response.data : error.message);

      let errorMessage = 'Unable to return the book. Please try again later.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showNotification('error', errorMessage);
    } finally {
      setReturnLoading(false);
      setReturningBookId(null);
    }
  };

  // Calculate days remaining until due date
  const calculateDaysRemaining = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get status class based on days remaining
  const getDueStatusClass = (daysRemaining) => {
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 2) return 'due-soon';
    return 'on-time';
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading your account information...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <BiErrorCircle size={50} color="#ff6b00" />
      <h3>Something went wrong</h3>
      <p>{error}</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
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
        <div className="profile-header">
          <img 
            src={accountData.user.profile_image || "/reader_default.jpg"} 
            alt="Profile"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/reader_default.jpg";
            }}
          />
          <h2>{accountData.user.name}</h2>
          <div className="account-badge reader">Reader</div>
        </div>
        
        <div className="account-stats">
          <div className="stat-item">
            <div className="stat-label">Joined</div>
            <div className="stat-value">
              {new Date(accountData.user.registered_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Currently Borrowing</div>
            <div className="stat-value">{accountData.user.borrow_count} books</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Total Books Read</div>
            <div className="stat-value">{accountData.user.total_books_read || 0}</div>
          </div>
        </div>
        
        <div className="account-actions">
          <button 
            className="account-button secondary"
            onClick={() => navigate('/main')}
          >
            Browse Books
          </button>
          <button 
            className="account-button logout"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="account-right">
        <div className="section-header">
          <h3>My Borrowed Books</h3>
          {accountData.borrowed_books.length > 0 && (
            <span className="book-count">
              {accountData.borrowed_books.filter(borrow => !borrow.returned_at).length} active
            </span>
          )}
        </div>
        
        {accountData.borrowed_books.filter(borrow => !borrow.returned_at).length > 0 ? (
          <div className="borrowed-books-grid">
            {accountData.borrowed_books
              .filter(borrow => !borrow.returned_at)
              .map(borrow => {
                const daysRemaining = calculateDaysRemaining(borrow.due_date);
                const dueStatusClass = getDueStatusClass(daysRemaining);
                
                return (
                  <div key={borrow.id} className="book-item">
                    <div className="book-cover">
                      <img
                        src={borrow.book.cover_image}
                        alt={borrow.book.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/cover_default.jpg";
                        }}
                      />
                      <div className={`due-badge ${dueStatusClass}`}>
                        {daysRemaining < 0 ? 'Overdue' : 
                         daysRemaining === 0 ? 'Due Today' : 
                         `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
                      </div>
                    </div>
                    <div className="book-info">
                      <h4>{borrow.book.title}</h4>
                      
                      <div className="book-meta">
                        <p className="borrow-date">
                          <FaCalendarAlt />
                          <span>Borrowed:</span> 
                          {new Date(borrow.borrow_date).toLocaleDateString()}
                        </p>
                        
                        <p className="due-date">
                          <FaClock />
                          <span>Due:</span> 
                          {new Date(borrow.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {borrow.book.tags && borrow.book.tags.length > 0 && (
                        <div className="book-tags">
                          {borrow.book.tags.map((tag, index) => (
                            <span key={index} className="tag-pill">{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      <div className="book-actions">
                        <button 
                          className="read-button"
                          onClick={() => navigate(`/read/${borrow.id}`)}
                        >
                          <FaBook />
                          Read Now
                        </button>
                        
                        <button 
                          className={`return-button ${returnLoading && returningBookId === borrow.id ? 'loading' : ''}`}
                          onClick={() => handleReturn(borrow.id, borrow.book.title)}
                          disabled={returnLoading}
                        >
                          {returnLoading && returningBookId === borrow.id ? (
                            <>
                              <FaSpinner className="spinning" />
                              Returning...
                            </>
                          ) : (
                            <>
                              <FaArrowRight />
                              Return Book
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="no-books-message">
            <img src="/empty-books.svg" alt="No books" />
            <h3>Your bookshelf is empty!</h3>
            <p>You haven't borrowed any books yet. Start exploring our library to find your next great read.</p>
            <button onClick={() => navigate('/main')}>Browse Library</button>
          </div>
        )}
        
        {accountData.reading_history && accountData.reading_history.length > 0 && (
          <div className="reading-history">
            <h3>Reading History</h3>
            <div className="history-list">
              {accountData.reading_history.map(item => (
                <div key={item.id} className="history-item">
                  <img 
                    src={item.book.cover_image || "/cover_default.jpg"} 
                    alt={item.book.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/cover_default.jpg";
                    }}
                  />
                  <div className="history-details">
                    <h4>{item.book.title}</h4>
                    <p>Returned on {new Date(item.returned_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountReader;
