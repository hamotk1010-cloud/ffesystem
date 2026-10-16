import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '24px', border: '2px solid #333' }}>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '12px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '20px' }}>WorkSpace FFE</h2>
        <div style={{ color: '#666', fontSize: '12px' }}>
          Asset &amp; Employee Tracking — Administrator Login
        </div>
      </div>

      {error && <div className="alert-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-username">Admin Username</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Admin Password</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {showPassword ? '[Hide]' : '[Show]'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
          >
            {isLoading ? 'Signing In...' : '[Sign In to Admin Console]'}
          </button>
        </div>
      </form>
    </div>
  );
};
