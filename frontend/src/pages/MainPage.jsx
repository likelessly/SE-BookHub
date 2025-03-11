import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Unauthorized. Please login.');
      return;
    }

    // ดึงข้อมูลหนังสือทั้งหมด
    axios.get('http://127.0.0.1:8000/api/books/', {
      headers: { Authorization: `Token ${token}` },
    })
    .then(response => setBooks(response.data))
    .catch(err => {
      console.error("Error fetching books:", err);
      setError('Failed to load books. Please try again later.');
    });

    // ดึงข้อมูลแท็กทั้งหมดจาก Database
    axios.get('http://127.0.0.1:8000/api/tags/', {
      headers: { Authorization: `Token ${token}` },
    })
    .then(response => setTags(response.data))
    .catch(err => console.error("Error fetching tags:", err));

    // ดึงข้อมูลผู้ใช้
    
    axios.get('http://127.0.0.1:8000/api/account/info/', {
      headers: { Authorization: `Token ${token}` },
    })
    .then(response => setUser(response.data))
    .catch(err => console.error("Error fetching user info:", err));
  }, []);

  // ฟังก์ชันกรองหนังสือตาม search query และ selected tags
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      (Array.isArray(book.tags) ? selectedTags.some(tag => book.tags.includes(tag)) : book.tags.split(',').some(tag => selectedTags.includes(tag)));
    return matchesSearch && matchesTags;
  });

  if (error) return <div>{error}</div>;

  return (
    <div className="main-page">
      {/* คำทักทายด้านบน */}
      <header className="header">
        <h2>Welcome, {user ? user.name : 'Guest'}!</h2>
      </header>

      <div className="content-container">
        {/* Sidebar สำหรับเลือกแท็ก */}
        <div className="sidebar">
          <h3>Filter by Tags</h3>
          {tags.map(tag => (
            <div key={tag.id} className="tag-option">
              <input 
                type="checkbox"
                value={tag.name}
                checked={selectedTags.includes(tag.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTags(prev => [...prev, tag.name]);
                  } else {
                    setSelectedTags(prev => prev.filter(t => t !== tag.name));
                  }
                }}
              />
              <span>{tag.name}</span>
            </div>
          ))}
        </div>

        {/* ส่วนหลักของหน้าที่แสดงหนังสือ */}
        <div className="main-content">
          {/* Search Bar ด้านขวาบน */}
          <div className="search-container">
            <input 
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* รายการหนังสือ */}
          <div className="book-list">
            {filteredBooks.length > 0 ? (
              filteredBooks.map(book => (
                <div key={book.id} className="book-item">
                  <img src={book.cover_image} alt={book.title} />
                  <h3>{book.title}</h3>
                  <p>Tags: {book.tags ? book.tags.join(', ') : 'No Tags'}</p>
                  <p>Publisher: {book.publisher_name}</p>
                  <p>Remaining Borrows: {book.remaining_borrows}</p>
                  <Link to={`/books/${book.id}`}>Details</Link>
                </div>
              ))
            ) : (
              <p>No books available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
