import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdvertPlayerCard } from '../components/AdvertPlayer';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuth(true);
        localStorage.setItem('auth_token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4 align-items-center justify-content-center">
        <div className="col-lg-5 col-md-6">
          <div className="card bg-dark border-secondary shadow-lg">
            <div className="card-body p-4">
              <h2 className="text-center mb-4 fw-bold">Lawyer Tinder Login</h2>
              {error && <div className="alert alert-danger p-2">{error}</div>}
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label text-slate-300 text-white">Username</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark text-white border-secondary"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-slate-300 text-white">Password</label>
                  <input 
                    type="password" 
                    className="form-control bg-dark text-white border-secondary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <div className="mt-3 text-center text-muted small">
                Hint: Use <strong>admin</strong> / <strong>admin</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
