// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', { identifier, password });
      const { token, role, userId } = response.data;
  
      // เก็บ token, role และ userId ใน localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
  
      console.log("Token:", token);
      console.log("Role:", role);
  
      // ใช้ navigate เพื่อไปยังหน้า Account ที่เหมาะสมตาม role
      if (role === 'reader') {
        navigate(`/account/reader/${userId}`);
      } else if (role === 'publisher') {
        navigate(`/account/publisher/${userId}`);
      } else {
        navigate('/main');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    }
  };
  

  return (
    <div className="auth-page">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email or Username:</label>
          <input 
            type="text" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
