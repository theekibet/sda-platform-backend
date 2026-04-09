// src/pages/members/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import AnimatedCharacter from '../../components/auth/AnimatedCharacter';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [characterMessage, setCharacterMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginStatus('thinking');
    setCharacterMessage('Checking your credentials...');

    // ✅ FIX: Pass an object with email and password (not two separate arguments)
    const result = await login({ email: formData.email, password: formData.password });

    if (result.success) {
      setLoginStatus('success');
      setCharacterMessage('Welcome back! 🎉');
      // Optional: store "rememberMe" in localStorage to keep user logged in longer
      if (rememberMe) {
        // You could extend token expiry on backend, or just set a flag
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setLoginStatus('error');
      setError(result.error || 'Login failed');
      setCharacterMessage('Oops! Something went wrong 😅');
      setTimeout(() => {
        setLoginStatus(null);
        setCharacterMessage(null);
      }, 3000);
    }

    setLoading(false);
  };

  const handleFocus = (fieldId) => {
    setFocusedField(fieldId);
    if (fieldId === 'email-field') {
      setCharacterMessage("I'm watching! 👀");
    } else if (fieldId === 'password-field') {
      setCharacterMessage('Your secret is safe!');
    }
  };

  const handleBlur = () => {
    setFocusedField(null);
    setTimeout(() => setCharacterMessage(null), 1000);
  };

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
    if (!showPassword) {
      setCharacterMessage("I won't peek! 🙈");
    } else {
      setCharacterMessage("All clear! 👁️");
    }
    setTimeout(() => {
      if (!focusedField) setCharacterMessage(null);
    }, 2000);
  };

  // Determine character mode
  const characterMode = loginStatus === 'success' 
    ? 'celebrating' 
    : loginStatus === 'error' 
    ? 'error' 
    : loginStatus === 'thinking'
    ? 'thinking'
    : showPassword && focusedField === 'password-field'
    ? 'hiding'
    : 'watching';

  const submitBg =
    loginStatus === 'success'
      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
      : loginStatus === 'error'
      ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
      : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600';

  return (
    <AuthLayout title="Welcome Back! 👋" subtitle="Login to SDA Youth Connect">
      
      {/* Animated Character */}
      <AnimatedCharacter
        mode={characterMode}
        focusedField={focusedField}
        message={characterMessage}
      />

      {/* Status banners */}
      {loginStatus === 'success' && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm font-medium shadow-md animate-float">
          <span className="text-lg">✅</span>
          <span>Login successful! Redirecting...</span>
        </div>
      )}
      {loginStatus === 'error' && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm font-medium shadow-md animate-wiggle">
          <span className="text-lg">❌</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1 transform transition-all duration-300 hover:scale-[1.02]">
          <label className="text-sm font-medium text-gray-600" htmlFor="email-field">
            Email
          </label>
          <input
            id="email-field"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email-field')}
            onBlur={handleBlur}
            required
            className="input-fun transition-all duration-300 focus:scale-[1.02] focus:shadow-glow"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1 transform transition-all duration-300 hover:scale-[1.02]">
          <label className="text-sm font-medium text-gray-600" htmlFor="password-field">
            Password
          </label>
          <div className="relative">
            <input
              id="password-field"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password-field')}
              onBlur={handleBlur}
              required
              className="input-fun pr-12 transition-all duration-300 focus:scale-[1.02] focus:shadow-glow"
            />
            <button
              type="button"
              onClick={handlePasswordToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl transition-all duration-300 hover:scale-125 active:scale-95"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none transition-all duration-300 hover:text-primary-600 group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-primary-500 w-4 h-4 rounded transition-transform group-hover:scale-110"
            />
            <span className="group-hover:underline">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-all duration-300 hover:scale-105"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || loginStatus === 'success'}
          className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 ${submitBg} transform active:scale-95`}
        >
          {loading || loginStatus === 'thinking' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in...
            </span>
          ) : loginStatus === 'success' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🎉</span>
              Welcome back!
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all duration-300 hover:scale-105 inline-block"
        >
          Join the Community
        </button>
      </p>

      {/* Decorative floating elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-5 w-12 h-12 bg-accent-peach rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }} />
    </AuthLayout>
  );
}

export default Login;