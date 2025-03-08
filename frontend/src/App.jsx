// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SignupReader from './pages/SignupReader';
import SignupPublisher from './pages/SignupPublisher';
import AccountReader from './pages/AccountReader';
import AccountPublisher from './pages/AccountPublisher';
import ReadBook from './pages/ReadBook';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/reader" element={<SignupReader />} />
        <Route path="/signup/publisher" element={<SignupPublisher />} />
        <Route path="/account/reader" element={<AccountReader />} />
        <Route path="/account/publisher" element={<AccountPublisher />} />
        <Route path="/read/:borrowId" element={<ReadBookWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
