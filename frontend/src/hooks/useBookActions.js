import { useState, useCallback } from 'react';
import axios from 'axios';

export const useBookActions = (fetchAccountData, showNotification) => {
  const [returnLoading, setReturnLoading] = useState(false);
  const [returningBookId, setReturningBookId] = useState(null);
  const token = localStorage.getItem('token');

  const handleReturn = useCallback(async (borrowId, bookTitle) => {
    if (returnLoading) return;
    setReturnLoading(true);
    setReturningBookId(borrowId);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/books/return/${borrowId}/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.status === 'success') {
        showNotification('success', `You have successfully returned "${bookTitle}"`);
        // เรียก fetchAccountData เพื่ออัปเดตข้อมูล
        fetchAccountData();
      } else {
        showNotification('error', response.data.message || 'Failed to return book.');
      }
    } catch (error) {
      showNotification('error', 'Unable to return the book. Please try again later.');
      console.error(error);
    } finally {
      setReturnLoading(false);
      setReturningBookId(null);
    }
  }, [fetchAccountData, showNotification, token, returnLoading]);

  return { handleReturn, returnLoading, returningBookId };
};