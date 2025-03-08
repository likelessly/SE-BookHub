// src/pages/SignupReader.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const SignupReader = () => {
  const [step, setStep] = useState(1); // 1: กรอกข้อมูล, 2: ยืนยันโค้ด
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/signup/reader/', { name, email, password });
      setStep(2);
      setMessage('Verification code sent to your email. Please check your inbox.');
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/signup/reader/verify/', { email, verification_code: verificationCode });
      setMessage('Your account has been verified and registered as a Reader.');
      // Optionally redirect to login
    } catch (err) {
      setError('Verification failed. Please check the code and try again.');
    }
  };

  return (
    <div className="auth-page">
      <h2>Signup as Reader</h2>
      {error && <p className="error">{error}</p>}
      
      {step === 1 && (
        <form onSubmit={handleFormSubmit}>
          <div>
            <label>Name:</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>Email:</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>Password:</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>Confirm Password:</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit">Signup</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerificationSubmit}>
          <div>
            <label>Verification Code:</label>
            <input 
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required 
            />
          </div>
          <button type="submit">Verify</button>
        </form>
      )}
      
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default SignupReader;
