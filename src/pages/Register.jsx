import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // reuse same styling

function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !phone || !password) return alert('Please fill all fields!');
    try {
      await axios.post('http://localhost:5000/api/auth/register', { name, phone, password });
      alert('User registered!');
      navigate('/'); // navigate to login after successful registration
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="avatar-container">
          <div className="avatar">👤</div>
        </div>
        <h2>Create Account</h2>

        <div className="input-group">
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder=" " 
            required 
          />
          <label>Name</label>
        </div>

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

        <button className="login-btn" onClick={handleRegister}>Register</button>

        {/* Login link */}
        <p className="register-text">
          Already have an account?{' '}
          <span className="register-link" onClick={() => navigate('/')}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
