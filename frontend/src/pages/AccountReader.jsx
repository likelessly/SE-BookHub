// src/pages/AccountReader.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../hooks/useAccount';
import { useNotification } from '../hooks/useNotification';
import { useBookActions } from '../hooks/useBookActions';
import ProfileHeader from '../components/ProfileHeader';
import AccountStats from '../components/AccountStats';
import AccountActions from '../components/AccountActions';
import BorrowedBookItem from '../components/BorrowedBookItem';
import NotificationBar from '../components/NotificationBar';

const AccountReader = () => {
  const navigate = useNavigate();
  const { accountData, loading, error, fetchAccountData } = useAccount('reader');
  const { notification, showNotification } = useNotification();
  const { handleReturn, returnLoading, returningBookId } = useBookActions(fetchAccountData, showNotification);

  useEffect(() => {
    // เรียก fetchAccountData เมื่อ component ถูก mount
    fetchAccountData();
  }, [fetchAccountData]);

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="account-page">
      <NotificationBar notification={notification} />
      <div className="account-left">
        <ProfileHeader user={accountData.user} role="reader" />
        <AccountStats user={accountData.user} />
        <AccountActions role="reader" />
      </div>
      <div className="account-right">
        <div className="section-header">
          <h3>My Borrowed Books</h3>
        </div>
        <div className="borrowed-books-grid">
          {accountData.borrowed_books && accountData.borrowed_books.length > 0 ? (
            accountData.borrowed_books.map((borrow) => (
              <BorrowedBookItem
                key={borrow.id}
                borrow={borrow}
                handleReturn={handleReturn}
                returnLoading={returnLoading}
                returningBookId={returningBookId}
                navigate={navigate}
              />
            ))
          ) : (
            <div className="no-books-message">No books borrowed yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountReader;
