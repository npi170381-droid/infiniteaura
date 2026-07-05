import React, { useState } from 'react';
import { X, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, API_BASE }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cleanInputs = () => {
    setName('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!phoneNumber || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isRegister) {
      if (!name) {
        setError('Name is required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
    }

    setLoading(false);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name, phoneNumber, password }
      : { phoneNumber, password };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data);
        cleanInputs();
        onClose();
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Failed to reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))', boxShadow: '0 0 15px rgba(244, 63, 94, 0.3)' }}>
            <Lock size={20} color="#fff" />
          </div>
          <h2 className="payment-title" style={{ margin: 0 }}>
            {isRegister ? 'Create Account' : 'Account Login'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
            {isRegister 
              ? 'Join Infinity Aura to save and view your movie bookings at any time.'
              : 'Log in to your account to purchase tickets and view your booking history.'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-pink)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="payment-form">
          {isRegister && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={12} style={{ color: 'var(--accent-purple)' }} />
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={12} style={{ color: 'var(--accent-purple)' }} />
              Phone Number
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 7708371161"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} style={{ color: 'var(--accent-purple)' }} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                placeholder="••••••"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className="checkout-btn"
            style={{ marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={handleToggleMode}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
          >
            {isRegister ? 'Login Here' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
