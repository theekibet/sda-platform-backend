// src/pages/auth/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import api from '../../services/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('📧 Sending password reset request for:', email);
    console.log('🔗 API base URL:', api.defaults.baseURL);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      console.log('✅ Response received:', response.data);
      setSuccess(true);
    } catch (err) {
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Make sure the backend is running on port 3000');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout 
        title="Check Your Email" 
        subtitle="We've sent you password reset instructions"
      >
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>📧</div>
          <p style={styles.successMessage}>
            We've sent an email to <strong>{email}</strong> with instructions to reset your password.
          </p>
          <p style={styles.infoMessage}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={styles.button}
          >
            Return to Login
          </button>
          <button
            onClick={() => setSuccess(false)}
            style={styles.linkButton}
          >
            Try a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot Password?" 
      subtitle="Enter your email to reset your password"
    >
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={styles.errorMessage}>
            ❌ {error}
          </div>
        )}
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
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
              <span>Sending...</span>
            </div>
          ) : (
            'Send Reset Instructions'
          )}
        </button>

        <p style={styles.backText}>
          Remember your password?{' '}
          <button onClick={() => navigate('/login')} style={styles.linkButton}>
            Back to Login
          </button>
        </p>
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
    color: '#333',
    marginBottom: '15px',
    lineHeight: '1.6',
  },
  infoMessage: {
    fontSize: '14px',
    color: '#666',
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
  backText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
    fontSize: '14px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
    marginLeft: '5px',
  },
};

export default ForgotPassword;