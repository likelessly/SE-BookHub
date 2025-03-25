// src/pages/AccountReader.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';
import { useNavigate } from 'react-router-dom';

const AccountReader = () => {
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ตรวจสอบ role ก่อนแสดงหน้า account
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'reader') {
      navigate('/login'); // หากไม่ใช่ reader ให้ redirect ไปที่หน้า login
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://127.0.0.1:8000/api/account/reader/', {
          headers: { Authorization: `Token ${token}` },
        });
        setAccountData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load account data.');
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReturn = async (borrowId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login again.');
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/api/books/return/${borrowId}/`, {}, {
        headers: { Authorization: `Token ${token}` },
      });
      // อัปเดตข้อมูล borrowed_books หลังจากคืนหนังสือสำเร็จ
      setAccountData(prev => ({
        ...prev,
        borrowed_books: prev.borrowed_books.filter(b => b.id !== borrowId)
      }));
      alert('Book returned successfully!');
    } catch (err) {
      console.error(err);
      alert('Return failed.');
    }
  };

  if (loading) return <p>Loading...</p>; // แสดงข้อความ Loading
  if (error) return <p>{error}</p>;

  return (
    <div className="account-page">
      <div className="account-left">
        <img src={accountData.user.profile_image || "/reader_default.jpg"} alt="Profile" />
        <h2>{accountData.user.name}</h2>
        <p>Role: {accountData.user.role}</p>
        <p>Registered: {new Date(accountData.user.registered_at).toLocaleDateString()}</p>
        <p>Borrowed Books: {accountData.user.borrow_count}</p>
        <button onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/';
        }}>Logout</button>
      </div>
      <div className="account-right">
        <h3>Borrowed Books</h3>
        {accountData.borrowed_books.length > 0 ? (
          accountData.borrowed_books.map(borrow => (
            <div key={borrow.id} className="book-item">
              <img src={borrow.book.cover_image} alt={borrow.book.title} />
              <div className="book-info">
                <h4>{borrow.book.title}</h4>
                <p>Borrowed Date: {new Date(borrow.borrow_date).toLocaleDateString()}</p>
                <p>Due Date: {new Date(borrow.due_date).toLocaleDateString()}</p>
                <p>Status: {borrow.returned_at ? 'Returned' : 'Not Returned'}</p>
                <button onClick={() => navigate(`/read/${borrow.id}`)}>Read Book</button>
                {!borrow.returned_at && (
                  <button onClick={() => handleReturn(borrow.id)}>Return</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No borrowed books.</p>
        )}
      </div>
    </div>
  );
};

export default AccountReader;