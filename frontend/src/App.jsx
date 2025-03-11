// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Base from './pages/Base';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/MainPage';  // หรือ MainPage ที่เป็นหน้าหลังล็อกอิน
import SignupReader from './pages/SignupReader';
import SignupPublisher from './pages/SignupPublisher';
import AccountReader from './pages/AccountReader';
import AccountPublisher from './pages/AccountPublisher';
import ReadBookWrapper from './pages/ReadBookWrapper';
import MainPage from './pages/MainPage';
import BookDetail from './pages/BookDetail';


function App() {
  return (
    <Router>
      <Base>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signup/reader" element={<SignupReader />} />
          <Route path="/signup/publisher" element={<SignupPublisher />} />
          {/* เปลี่ยนเส้นทางไปยังหน้า account ให้เป็น dynamic โดยใช้ userId */}
          <Route path="/account/reader/:userId" element={<AccountReader />} />
          <Route path="/account/publisher/:userId" element={<AccountPublisher />} />
          <Route path="/read/:borrowId" element={<ReadBookWrapper />} />
          <Route path="/books/:bookId" element={<BookDetail />} />
          <Route path="/books/:bookId/borrow" element={<BookDetail />} />

        </Routes>
      </Base>
    </Router>
  );
}

export default App;
