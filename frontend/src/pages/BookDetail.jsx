import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './BookDetail.css';

const BookDetail = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/books/${bookId}/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setBook(response.data);
        setLoading(false);
      })
      // eslint-disable-next-line no-unused-vars
      .catch((err) => {
        setError('Failed to load book details.');
        setLoading(false);
      });
  }, [bookId]);

  const handleBorrowBook = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to borrow a book.');
      navigate('/login');
      return;
    }

    if (!book.is_available) {
      alert('No available copies of this book to borrow.');
      return;
    }

    axios
      .post(
        `http://127.0.0.1:8000/api/books/borrow/`,
        { book_id: book.id },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then((response) => {
        alert('Book borrowed successfully!');
        navigate(`/account/reader/${response.data.user_id}`);
      })
      .catch((err) => {
        console.error('Error borrowing book:', err.response?.data);
        alert('Failed to borrow book.');
      });
  };

  const handleRemoveBook = () => {
    axios
      .delete(`http://127.0.0.1:8000/api/books/remove/${bookId}/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(() => {
        alert('Book removed successfully!');
        navigate('/account/publisher');
      })
      .catch((err) => {
        console.error('Error removing book:', err.response?.data);
        alert('Failed to remove book.');
      });
  };

  const handleEditBook = () => {
    navigate(`/edit-book/${bookId}`);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="book-detail">
      <div className="book-detail-left">
        <img
          src={
            book.cover_image
              ? `${book.cover_image}`
              : '/cover_default.jpg'
          }
          alt={book.title}
        />
      </div>
      <div className="book-detail-right">
        <h2>{book.title}</h2>
        <p>{book.description}</p>
        <p>
          <strong>Max Borrowers: </strong>
          {book.max_borrowers}
        </p>
        <p>
          <strong>Lending Period: </strong>
          {book.lending_period} days
        </p>
        <p>
          <strong>Available Copies: </strong>
          {book.remaining_borrows}
        </p>
        {role === 'reader' && (
          <button onClick={handleBorrowBook}>Borrow Book</button>
        )}
        {role === 'publisher' && (
          <>
            <button onClick={handleEditBook}>Edit Book</button>
            <button onClick={handleRemoveBook}>Remove Book</button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
