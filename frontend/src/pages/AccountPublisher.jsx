import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../api';
import { FaPlus, FaEdit, FaTrash, FaBook, FaTag, FaUpload } from 'react-icons/fa';
import { BiErrorCircle } from 'react-icons/bi';

const AccountPublisher = () => {
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    lending_period: 14,
    max_borrowers: 1,
    cover_image: '',
    pdf_file: null,
    selectedTags: [],
    custom_tag: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'publisher') {
      navigate('/login', { state: { from: '/account' } });
      return;
    }

    setLoading(true);
    axios
      .get('http://127.0.0.1:8000/api/account/publisher/', {
        headers: { Authorization: `Token ${token}` },
      })
      .then(response => {
        setAccountData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching account data:", err.response?.data);
        setError('Failed to load account data.');
        setLoading(false);
      });
  }, [navigate]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleRemoveBook = (bookId, bookTitle) => {
    if (window.confirm(`Are you sure you want to remove "${bookTitle}"?`)) {
      axios
        .delete(`http://127.0.0.1:8000/api/books/remove/${bookId}/`, {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        })
        .then(() => {
          setAccountData(prev => ({
            ...prev,
            published_books: prev.published_books.filter(b => b.id !== bookId)
          }));
          showNotification('success', `"${bookTitle}" has been removed successfully`);
        })
        .catch(err => {
          console.error("Error removing book:", err.response?.data);
          showNotification('error', 'Failed to remove book. Please try again.');
        });
    }
  };

  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    try {
      let coverImageUrl = null;

      if (newBook.cover_image instanceof File) {
        coverImageUrl = await uploadImage(newBook.cover_image);
      }

      const formData = new FormData();

      formData.append('title', newBook.title);
      formData.append('description', newBook.description);
      formData.append('lending_period', newBook.lending_period);
      formData.append('max_borrowers', newBook.max_borrowers);

      if (newBook.selectedTags.length > 0) {
        formData.append('selectedTags', newBook.selectedTags[0]);
      } else if (newBook.custom_tag) {
        formData.append('custom_tag', newBook.custom_tag);
      }

      if (coverImageUrl) {
        formData.append('cover_image', coverImageUrl);
      }
      
      if (newBook.pdf_file instanceof File) {
        formData.append('pdf_file', newBook.pdf_file);
      }

      const response = await axios.post('http://127.0.0.1:8000/api/books/add/', formData, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setAccountData(prev => ({
        ...prev,
        published_books: [...prev.published_books, response.data]
      }));

      showNotification('success', `"${newBook.title}" has been added successfully`);

      setShowAddBookModal(false);
      setNewBook({
        title: '',
        description: '',
        lending_period: 14,
        max_borrowers: 1,
        cover_image: '',
        pdf_file: null,
        selectedTags: [],
        custom_tag: '',
      });
    } catch (err) {
      console.error("Error adding book:", err.response?.data);
      showNotification('error', 'Failed to add book. Please check your inputs and try again.');
    }
  };

  const fetchAvailableTags = () => {
    axios
      .get('http://127.0.0.1:8000/api/tags/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(response => {
        setAvailableTags(response.data);
      })
      .catch(err => {
        console.error("Error fetching tags:", err.response?.data);
        showNotification('error', 'Failed to load tags.');
      });
  };

  const openTagModal = () => {
    fetchAvailableTags();
    setShowTagModal(true);
  };

  const handleTagSelection = (tagName) => {
    if (newBook.custom_tag) {
      showNotification('error', 'Please choose either an existing tag or create a new one');
      return;
    }
    setNewBook({ 
      ...newBook, 
      selectedTags: [tagName],
    });
  };

  const handleCustomTagChange = (e) => {
    if (newBook.selectedTags.length > 0) {
      showNotification('error', 'Please choose either an existing tag or create a new one');
      e.target.value = '';
      return;
    }
    setNewBook({ 
      ...newBook, 
      custom_tag: e.target.value,
      selectedTags: []
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please upload an image file (PNG, JPEG)');
        return;
      }
      setNewBook(prev => ({
        ...prev,
        cover_image: file
      }));
    }
  };

  const handlePDFUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showNotification('error', 'Please upload a PDF file');
        return;
      }
      setNewBook(prev => ({
        ...prev,
        pdf_file: file
      }));
    }
  };

  const handleRemoveTag = () => {
    setNewBook({
      ...newBook,
      selectedTags: []
    });
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading your publisher account...</p>
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
            src={accountData.user.profile_image || "/publisher_default.jpg"} 
            alt="Profile"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/publisher_default.jpg";
            }}
          />
          <h2>{accountData.user.name}</h2>
          <div className="account-badge publisher">Publisher</div>
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
            <div className="stat-label">Published Books</div>
            <div className="stat-value">{accountData.user.book_count} books</div>
          </div>
          
          {/* <div className="stat-item">
            <div className="stat-label">Total Downloads</div>
            <div className="stat-value">{accountData.user.total_downloads || 0}</div>
          </div> */}
        </div>
        
        <div className="account-actions">
          <button 
            className="account-button primary"
            onClick={() => setShowAddBookModal(true)}
          >
            Add New Book
          </button>
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
          <h3>My Published Books</h3>
          {accountData.published_books.length > 0 && (
            <span className="book-count">
              {accountData.published_books.length} books
            </span>
          )}
        </div>
        
        {accountData.published_books.length > 0 ? (
          <div className="books-list">
            {accountData.published_books.map(book => (
              <div key={book.id} className="book-item">
                <div className="book-cover">
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/cover_default.jpg";
                    }}
                  />
                </div>
                <div className="book-info">
                  <h4>{book.title}</h4>
                  <div className="book-meta">
                    <p className="borrow-count">
                      <FaBook />
                      <span>Borrowed:</span> {book.borrow_count} times
                    </p>
                  </div>
                  
                  {book.tags && book.tags.length > 0 && (
                    <div className="book-tags">
                      {book.tags.map((tag, index) => (
                        <span key={index} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="book-actions">
                    <button 
                      className="edit-button"
                      onClick={() => navigate(`/edit-book/${book.id}`)}
                    >
                      <FaEdit />
                      Edit
                    </button>
                    <button 
                      className="remove-button"
                      onClick={() => handleRemoveBook(book.id, book.title)}
                    >
                      <FaTrash />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-books-message">
            <img src="/empty-publisher.svg" alt="No books" />
            <h3>You haven't published any books yet</h3>
            <p>Share your knowledge with the world by publishing your first book.</p>
            <button onClick={() => setShowAddBookModal(true)}>Publish Your First Book</button>
          </div>
        )}
      </div>

      {showAddBookModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Book</h3>
            <form onSubmit={handleAddBookSubmit} className="book-form">
              <div className="form-group">
                <label>Book Title</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  placeholder="Enter book description"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Maximum Borrowers</label>
                  <input
                    type="number"
                    min="1"
                    value={newBook.max_borrowers}
                    onChange={(e) => setNewBook({ ...newBook, max_borrowers: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Lending Period (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newBook.lending_period}
                    onChange={(e) => setNewBook({ ...newBook, lending_period: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Book Tag</label>
                <div className="tag-selection">
                  <button type="button" onClick={openTagModal}>
                    <FaTag /> Select Book Tag
                  </button>
                  <div className="selected-tags">
                    {newBook.selectedTags.map((tag, index) => (
                      <span key={index} className="tag-item">
                        {tag}
                        <button 
                          type="button" 
                          onClick={handleRemoveTag}
                          className="remove-tag"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Create New Tag</label>
                <input
                  type="text"
                  value={newBook.custom_tag}
                  onChange={handleCustomTagChange}
                  placeholder="Type to create a new tag"
                />
              </div>

              <div className="form-group">
                <label>Cover Image</label>
                <div className="file-upload">
                  <FaUpload />
                  <p>Click to select an image file</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>PDF File</label>
                <div className="file-upload">
                  <FaUpload />
                  <p>Click to select a PDF file</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePDFUpload}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit">Add Book</button>
                <button type="button" onClick={() => setShowAddBookModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTagModal && (
        <div className="modal tag-modal">
          <div className="modal-content">
            <h3>Select Book Tag</h3>
            <div className="tags-list">
              {availableTags.length > 0 ? (
                availableTags.map(tag => (
                  <div key={tag.id} className="tag-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={newBook.selectedTags.includes(tag.name)}
                        onChange={() => handleTagSelection(tag.name)}
                      />
                      {tag.name}
                    </label>
                  </div>
                ))
              ) : (
                <p>No tags available. Create a new tag instead.</p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowTagModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPublisher;
