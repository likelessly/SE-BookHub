import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './BookDetail.css';

const BookDetail = () => {
  const { bookId } = useParams(); // รับ bookId จาก URL
  const [book, setBook] = useState(null); // เก็บข้อมูลหนังสือ
  const [error, setError] = useState(null); // เก็บ error ถ้ามี
  const [loading, setLoading] = useState(true); // ตรวจสอบสถานะการโหลดข้อมูล
  const navigate = useNavigate(); // สำหรับการเปลี่ยนเส้นทางหลังจากยืมหนังสือสำเร็จ

  // ดึงข้อมูลหนังสือจาก API
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/books/${bookId}/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setBook(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load book details.');
        setLoading(false);
      });
  }, [bookId]);

  const handleBorrowBook = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to borrow a book.');
      navigate('/login'); // เปลี่ยนเส้นทางไปที่หน้า Login
      return;
    }

    if (book.available_copies <= 0) {
      alert('No available copies of this book to borrow.');
      return;
    }

    // ส่งข้อมูลการยืมไปที่ API
    axios
      .post(
        `http://127.0.0.1:8000/api/borrow/`,
        { book_id: book.id }, // ส่ง ID ของหนังสือ
        { headers: { Authorization: `Token ${token}` } }
      )
      .then((response) => {
        alert('Book borrowed successfully!');
        // อัพเดตจำนวนสำเนาหลังจากยืม
        setBook((prevBook) => ({
          ...prevBook,
          available_copies: prevBook.available_copies - 1,
        }));
      })
      .catch((err) => {
        console.error('Error borrowing book:', err.response?.data);
        alert('Failed to borrow book.');
      });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="book-detail">
      <div className="book-detail-left">
        <img
          src={
            book.cover_image
              ? `https://csqtsflaklabqsnjlioy.supabase.co/storage/v1/object/public/Bookhub_media/cover/${book.cover_image}`
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
          {book.available_copies}
        </p>
        <button onClick={handleBorrowBook} disabled={!book.is_available}>
          {book.is_available ? "Borrow Book" : "Not Available"}
        </button>
      </div>
    </div>
  );
};

export default BookDetail;
