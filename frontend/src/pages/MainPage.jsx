// src/pages/MainPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/api/books/', {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    })
    .then(response => setBooks(response.data))
    .catch(err => setError('Failed to load books.'));
  }, []);

  if (error) return <div>{error}</div>;

  return (
    <div className="main-page">
      <h1>All Books</h1>
      <div className="book-list">
        {books.map(book => (
          <div key={book.id} className="book-item">
            <img src={book.cover_image} alt={book.title} />
            <h3>{book.title}</h3>
            <p>Tags: {book.tags.join(', ')}</p>
            <p>Publisher: {book.publisher_name}</p>
            <p>Remaining Borrows: {book.remaining_borrows}</p>
            <Link to={`/book/${book.id}`}>Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainPage;
