import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';
import { useNavigate } from 'react-router-dom';

const AccountPublisher = () => {
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  // const [editingBook, setEditingBook] = useState(null);
  const [newBook, setNewBook] = useState({
    title: '',
    description: '',
    lending_period: 14,
    max_borrowers: 1,
    cover_image: null,
    pdf_file: null,
    selectedTags: [],  // เก็บชื่อแท็กที่เลือก (จากฐานข้อมูล)
    custom_tag: '',    // เพิ่มแท็กใหม่ได้เพียง 1 แท็กต่อหนังสือ
  });
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  // ดึงข้อมูลบัญชี Publisher เมื่อ component mount
  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/account/publisher/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(response => setAccountData(response.data))
      .catch(err => {
        console.error("Error fetching account data:", err.response?.data);
        setError('Failed to load account data.');
      });
  }, []);

  // ฟังก์ชันลบหนังสือของ Publisher
  const handleRemoveBook = (bookId) => {
    axios
      .delete(`http://127.0.0.1:8000/api/books/remove/${bookId}/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      // eslint-disable-next-line no-unused-vars
      .then(response => {
        setAccountData(prev => ({
          ...prev,
          published_books: prev.published_books.filter(b => b.id !== bookId)
        }));
      })
      .catch(err => {
        console.error("Error removing book:", err.response?.data);
        alert('Failed to remove book.');
      });
  };

  // ฟังก์ชันสำหรับส่งข้อมูลหนังสือใหม่เพื่อเพิ่มหนังสือ
  const handleAddBookSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newBook.title);
    formData.append('description', newBook.description);
    formData.append('lending_period', newBook.lending_period);
    formData.append('max_borrowers', newBook.max_borrowers);
    // ส่ง selectedTags เป็น JSON string
    formData.append('selectedTags', JSON.stringify(newBook.selectedTags));
    if (newBook.custom_tag) formData.append('custom_tag', newBook.custom_tag);
    if (newBook.cover_image) formData.append('cover_image', newBook.cover_image);
    if (newBook.pdf_file) formData.append('pdf_file', newBook.pdf_file);

    axios
      .post('http://127.0.0.1:8000/api/books/add/', formData, {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        setAccountData(prev => ({
          ...prev,
          published_books: [...prev.published_books, response.data]
        }));
        setShowAddBookModal(false);
        // Reset newBook state
        setNewBook({
          title: '',
          description: '',
          lending_period: 14,
          max_borrowers: 1,
          cover_image: null,
          pdf_file: null,
          selectedTags: [],
          custom_tag: ''
        });
      })
      .catch(err => {
        console.error("Error adding book:", err.response?.data);
        alert('Failed to add book.');
      });
  };

  // const handleEditBook = (book) => {
  //   setEditingBook(book);
  // };

  // const handleEditSubmit = (e) => {
  //   e.preventDefault();
  //   axios.put(`http://127.0.0.1:8000/api/books/edit/${editingBook.id}/`, editingBook, {
  //     headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  //   })
  //   .then(response => {
  //     setAccountData(prev => ({
  //       ...prev,
  //       published_books: prev.published_books.map(b => (b.id === editingBook.id ? response.data : b))
  //     }));
  //     setEditingBook(null);
  //   })
  //   .catch(err => {
  //     console.error("Error updating book:", err.response?.data);
  //     alert('Failed to update book.');
  //   });
  // };

  // ฟังก์ชันดึงแท็กทั้งหมดจากฐานข้อมูล
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
        alert('Failed to load tags.');
      });
  };

  // เปิด modal สำหรับเลือกแท็กหนังสือ
  const openTagModal = () => {
    fetchAvailableTags();
    setShowTagModal(true);
  };

  // จัดการการเลือก/ยกเลิกแท็ก
  const handleTagSelection = (tagName) => {
    let updatedTags = [...newBook.selectedTags];
    if (updatedTags.includes(tagName)) {
      updatedTags = updatedTags.filter(tag => tag !== tagName);
    } else {
      updatedTags.push(tagName);
    }
    setNewBook({ ...newBook, selectedTags: updatedTags });
  };

  if (error) return <p>{error}</p>;
  if (!accountData) return <p>Loading...</p>;

  return (
    <div className="account-page">
      {/* ด้านซ้าย: แสดงข้อมูลบัญชี Publisher */}
      <div className="account-left">
        <img src={accountData.user.profile_image || "/publisher_default.jpg"} alt="Profile" />
        <h2>{accountData.user.name}</h2>
        <p>Role: {accountData.user.role}</p>
        <p>Registered: {new Date(accountData.user.registered_at).toLocaleDateString()}</p>
        <p>Published Books: {accountData.user.book_count}</p>
        <button onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/';
        }}>Logout</button>
      </div>

      {/* ด้านขวา: ปุ่มเพิ่มหนังสือและรายการหนังสือ */}
      <div className="account-right">
        <div className="top-controls">
          <button onClick={() => setShowAddBookModal(true)}>เพิ่มหนังสือ</button>
        </div>
        <h3>รายการหนังสือที่ลง</h3>
        <div className="books-list">
          {accountData.published_books.map(book => (
            <div key={book.id} className="book-item">
              <img src={book.cover_image ? "https://csqtsflaklabqsnjlioy.supabase.co/storage/v1/object/public/Bookhub_media/cover/${book.cover_image}" : "/cover_default.jpg"} 
                alt={book.title} />
              <div className="book-info">
                <h4>{book.title}</h4>
                <p>จำนวนถูกยืม: {book.borrow_count}</p>
                <div className="book-actions">
                  <button onClick={() => handleRemoveBook(book.id)}>ถอนหนังสือ</button>
                  {/* <button onClick={() => handleEditBook(book)}>แก้ไขหนังสือ</button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal สำหรับเพิ่มหนังสือ */}
      {showAddBookModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>เพิ่มหนังสือใหม่</h3>
            <form onSubmit={handleAddBookSubmit}>
              <div>
                <label>ชื่อหนังสือ:</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>คำอธิบาย:</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>จำนวนสูงสุดที่ยืมได้:</label>
                <input
                  type="number"
                  value={newBook.max_borrowers}
                  onChange={(e) => setNewBook({ ...newBook, max_borrowers: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>เวลาที่สามารถยืมได้ (วัน):</label>
                <input
                  type="number"
                  value={newBook.lending_period}
                  onChange={(e) => setNewBook({ ...newBook, lending_period: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>แท็กหนังสือ:</label>
                <div className="tag-selection">
                  <button type="button" onClick={openTagModal}>เลือกแท็กหนังสือ</button>
                  <div className="selected-tags">
                    {newBook.selectedTags.map((tag, index) => (
                      <span key={index} className="tag-item">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label>เพิ่มแท็กใหม่ (ถ้าต้องการ):</label>
                <input
                  type="text"
                  value={newBook.custom_tag}
                  onChange={(e) => setNewBook({ ...newBook, custom_tag: e.target.value })}
                />
              </div>
              <div>
                <label>เพิ่มรูป:</label>
                <input
                  type="file"
                  onChange={(e) => setNewBook({ ...newBook, cover_image: e.target.files[0] })}
                  required
                />
              </div>
              <div>
                <label>เพิ่ม PDF:</label>
                <input
                  type="file"
                  onChange={(e) => setNewBook({ ...newBook, pdf_file: e.target.files[0] })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit">ยืนยันการลงหนังสือ</button>
                <button type="button" onClick={() => setShowAddBookModal(false)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal สำหรับเลือกแท็กหนังสือ */}
      {showTagModal && (
        <div className="modal tag-modal">
          <div className="modal-content">
            <h3>เลือกแท็กหนังสือ</h3>
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
                <p>No tags available.</p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowTagModal(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* {editingBook && (
        <div className="modal">
          <div className="modal-content">
            <h3>แก้ไขหนังสือ</h3>
            <form onSubmit={handleEditSubmit}>
              <label>ชื่อหนังสือ:</label>
              <input type="text" value={editingBook.title} onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })} required />
              <label>คำอธิบาย:</label>
              <textarea value={editingBook.description} onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })} required />
              <div className="modal-actions">
                <button type="submit">บันทึก</button>
                <button type="button" onClick={() => setEditingBook(null)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div> */}
    </div>
  );
};

export default AccountPublisher;
