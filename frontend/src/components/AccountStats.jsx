import React from 'react';

const AccountStats = ({ user }) => {
  return (
    <div className="account-stats">
      <h2>Account Statistics</h2>
      <p>
        <span>Name:</span> {user.name}
      </p>
      <p>
        <span>Email:</span> {user.email}
      </p>
      <p>
        <span>Role:</span> {user.role}
      </p>
      <p>
        <span>Total Books Borrowed:</span> {user.borrow_count}
      </p>
      {user.active_borrows !== undefined && (
        <p>
          <span>Currently Borrowing:</span> {user.active_borrows}
        </p>
      )}
    </div>
  );
};

export default AccountStats;