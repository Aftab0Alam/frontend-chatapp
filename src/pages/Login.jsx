import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!phone || !password) return alert('Please fill all fields!');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { phone, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/chats');
    } catch (err) {
      alert(err.response?.data?.message || "Login failed!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="avatar-container">
          <div className="avatar">👤</div>
        </div>
        <h2>Welcome Back</h2>

        <div className="input-group">
          <input 
            type="text" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder=" " 
            required 
          />
          <label>Phone</label>
        </div>

        <div className="input-group">
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder=" " 
            required 
          />
          <label>Password</label>
        </div>

        <button className="login-btn" onClick={handleLogin}>Login</button>

        {/* Register link/button */}
        <p className="register-text">
          Don't have an account?{' '}
          <span className="register-link" onClick={() => navigate('/register')}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
