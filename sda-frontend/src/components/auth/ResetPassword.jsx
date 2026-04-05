// src/pages/auth/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import api from '../../services/api';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(null);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await api.get('/auth/validate-reset-token', {
          params: { token }
        });
        setValidToken(response.data.valid);
      } catch (err) {
        setValidToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show invalid token state
  if (validToken === false) {
    return (
      <AuthLayout title="Invalid Reset Link" subtitle="This link may have expired">
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>🔒</div>
          <p style={styles.errorText}>
            This password reset link is invalid or has already been used.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            style={styles.button}
          >
            Request New Reset Link
          </button>
          <button
            onClick={() => navigate('/login')}
            style={styles.linkButton}
          >
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Show loading while validating token
  if (validToken === null) {
    return (
      <AuthLayout title="Validating" subtitle="Please wait...">
        <div style={styles.loadingContainer}>
          <div style={styles.loaderLarge}></div>
        </div>
      </AuthLayout>
    );
  }

  // Show success state
  if (success) {
    return (
      <AuthLayout title="Password Reset!" subtitle="Your password has been updated">
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✅</div>
          <p style={styles.successMessage}>
            Your password has been successfully reset.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={styles.button}
          >
            Login Now
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create New Password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={styles.errorMessage}>
            ❌ {error}
          </div>
        )}
        
        <div style={styles.formGroup}>
          <label style={styles.label}>New Password</label>
          <div style={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              style={styles.passwordInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div style={styles.passwordHint}>
            Password must be at least 8 characters long
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            style={styles.input}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={styles.button}
        >
          {loading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.loader}></div>
              <span>Resetting...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontWeight: '500',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
  },
  passwordHint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  button: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#5a6fd8',
    },
  },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  loader: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loaderLarge: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '40px auto',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '20px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '16px',
    color: '#c33',
    marginBottom: '25px',
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  successMessage: {
    fontSize: '16px',
    color: '#28a745',
    marginBottom: '25px',
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
    marginTop: '15px',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
  },
};

// Add keyframe animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ResetPassword;