import React from 'react';

const AccountStats = ({ user }) => (
  <div className="account-stats">
    <div className="stat-item">
      <div className="stat-label">Joined</div>
      <div className="stat-value">
        {new Date(user.registered_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </div>
    </div>
    <div className="stat-item">
      <div className="stat-label">Published Books</div>
      <div className="stat-value">{user.book_count} books</div>
    </div>
  </div>
);

export default AccountStats;