import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { uploadImage, uploadPDF } from '../api';
import './EditBook.css';

const EditBook = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [bookData, setBookData] = useState({
    title: '',
    description: '',
    lending_period: 14,
    max_borrowers: 1,
    cover_image: '',
    pdf_file: null,
    selectedTags: [],
    custom_tag: ''
  });

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/books/${bookId}/`,
          {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` }
          }
        );
        
        setBookData({
          ...response.data,
          selectedTags: response.data.tags || []
        });
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load book data');
        setLoading(false);
      }
    };

    fetchBookData();
  }, [bookId]);

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/tags/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      setAvailableTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
      alert('ไม่สามารถโหลดแท็กได้');
    }
  };

  const handleTagSelection = (tagName) => {
    setBookData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(tag => tag !== tagName)
        : [...prev.selectedTags, tagName]
    }));
  };

  const handleAddCustomTag = () => {
    if (!bookData.custom_tag.trim()) {
      alert('กรุณากรอกชื่อแท็ก');
      return;
    }

    const newTag = bookData.custom_tag.trim();
    if (bookData.selectedTags.includes(newTag)) {
      alert('แท็กนี้ถูกเลือกไว้แล้ว');
      return;
    }

    setBookData(prev => ({
      ...prev,
      selectedTags: [...prev.selectedTags, newTag],
      custom_tag: ''
    }));
  };

  const handleRemoveTag = (tagName) => {
    setBookData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.filter(tag => tag !== tagName)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let coverImageUrl = bookData.cover_image;
      let pdfFileUrl = bookData.pdf_file;

      // Handle new cover image upload
      if (bookData.new_cover_image instanceof File) {
        try {
          coverImageUrl = await uploadImage(bookData.new_cover_image);
        } catch (error) {
          console.error('Error uploading cover image:', error);
          alert('ไม่สามารถอัพโหลดรูปปกได้');
          setLoading(false);
          return;
        }
      }

      // Handle new PDF upload
      if (bookData.new_pdf_file instanceof File) {
        try {
          pdfFileUrl = await uploadPDF(bookData.new_pdf_file);
        } catch (error) {
          console.error('Error uploading PDF:', error);
          alert('ไม่สามารถอัพโหลดไฟล์ PDF ได้');
          setLoading(false);
          return;
        }
      }

      // Prepare update data
      const updateData = {
        title: bookData.title.trim(),
        description: bookData.description.trim(),
        lending_period: parseInt(bookData.lending_period),
        max_borrowers: parseInt(bookData.max_borrowers),
        tags: bookData.selectedTags,
        ...(coverImageUrl && { cover_image: coverImageUrl }),
        ...(pdfFileUrl && { pdf_file: pdfFileUrl })
      };

      // Debug log
      console.log('Sending update data:', updateData);

      const response = await axios({
        method: 'put',
        url: `http://127.0.0.1:8000/api/books/update/${bookId}/`,
        data: updateData,
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data) {
        alert('อัพเดตหนังสือสำเร็จ!');
        navigate(`/books/${bookId}`);
      }
    } catch (err) {
      console.error('Error updating book:', {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.detail || 
                          Object.values(err.response?.data || {}).join('\n') ||
                          'ไม่สามารถอัพเดตหนังสือได้';
      alert(`ข้อผิดพลาด: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">กำลังโหลด...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-book-page">
      <h2>แก้ไขหนังสือ</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ชื่อหนังสือ:</label>
          <input
            type="text"
            value={bookData.title}
            onChange={(e) => setBookData({...bookData, title: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>คำอธิบาย:</label>
          <textarea
            value={bookData.description}
            onChange={(e) => setBookData({...bookData, description: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>ระยะเวลาการยืม (วัน):</label>
          <input
            type="number"
            value={bookData.lending_period}
            onChange={(e) => setBookData({...bookData, lending_period: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>จำนวนผู้ยืมสูงสุด:</label>
          <input
            type="number"
            value={bookData.max_borrowers}
            onChange={(e) => setBookData({...bookData, max_borrowers: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>รูปปก:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBookData({...bookData, new_cover_image: e.target.files[0]})}
          />
          {bookData.cover_image && (
            <img
              src={bookData.cover_image}
              alt="ปกหนังสือปัจจุบัน"
              className="current-cover"
            />
          )}
        </div>

        <div className="form-group">
          <label>ไฟล์ PDF:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setBookData({...bookData, new_pdf_file: e.target.files[0]})}
          />
          {bookData.pdf_file && (
            <p className="current-pdf">PDF ปัจจุบัน: มีอยู่แล้ว</p>
          )}
        </div>

        <div className="form-group tag-section">
          <label>แท็ก:</label>
          <div className="tag-controls">
            <button 
              type="button" 
              className="show-tags-button"
              onClick={() => {
                fetchAvailableTags();
                setShowTagModal(true);
              }}
            >
              เลือกแท็ก
            </button>
            <div className="custom-tag-input">
              <input
                type="text"
                value={bookData.custom_tag}
                onChange={(e) => setBookData({...bookData, custom_tag: e.target.value})}
                placeholder="เพิ่มแท็กใหม่"
              />
              <button type="button" onClick={handleAddCustomTag}>
                เพิ่มแท็ก
              </button>
            </div>
          </div>

          <div className="selected-tags">
            {bookData.selectedTags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(tag)}
                  className="remove-tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {showTagModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>เลือกแท็ก</h3>
              <div className="tags-grid">
                {availableTags.map((tag) => (
                  <label key={tag.id} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={bookData.selectedTags.includes(tag.name)}
                      onChange={() => handleTagSelection(tag.name)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowTagModal(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="save-button">บันทึกการแก้ไข</button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate(-1)}
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBook;