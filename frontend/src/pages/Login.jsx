// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/login/', { email, password });
      // เก็บ token ใน localStorage หรือ context ตามความต้องการ
      localStorage.setItem('token', response.data.token);
      console.log(response.data);
      // Redirect ไปยังหน้าอื่นหลัง login สำเร็จ
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account?&nbsp;
        <Link to="/signup/reader">Signup as Reader</Link> |&nbsp;
        <Link to="/signup/publisher">Signup as Publisher</Link>
      </p>
    </div>
  );
};

export default Login;
