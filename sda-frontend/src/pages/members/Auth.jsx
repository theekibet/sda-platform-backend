// src/pages/members/Auth.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedCharacter from '../../components/auth/AnimatedCharacter';
import PasswordInput from '../../components/auth/PasswordInput';

function Auth() {
  const navigate = useNavigate();
  const { login, register, googleLogin } = useAuth();

  // Toggle between login and register
  const [isLogin, setIsLogin] = useState(true);

  // Login form data
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form data
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });

  // Shared states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [characterMessage, setCharacterMessage] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Password strength for register
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);

  // Date bounds
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];
  const maxDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const errors = [];
    let strength = 0;

    if (password.length < 8) {
      errors.push('At least 8 characters');
    } else {
      strength += 25;
    }

    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      errors.push('At least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      errors.push('At least one lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      strength += 25;
    } else {
      errors.push('At least one number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 25;
    }

    setPasswordStrength(Math.min(strength, 100));
    setPasswordErrors(errors);

    if (strength < 50) {
      setCharacterMessage('Keep going! 💪');
    } else if (strength < 75) {
      setCharacterMessage('Getting better! 🌟');
    } else {
      setCharacterMessage('Strong password! 🔐');
    }
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
    setStatus(null);
    setCharacterMessage(null);
    setFocusedField(null);
    setRegistrationSuccess(false);
  };

  // Login handlers
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('thinking');
    setCharacterMessage('Checking your credentials...');

    const result = await login({ email: loginData.email, password: loginData.password });

    if (result.success) {
      setStatus('success');
      setCharacterMessage('Welcome back! 🎉');
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setStatus('error');
      let errorMsg = result.error || 'Login failed';
      if (errorMsg.toLowerCase().includes('email not verified')) {
        errorMsg = 'Email not verified. Please check your inbox for the verification link.';
      }
      setError(errorMsg);
      setCharacterMessage('Oops! Something went wrong 😅');
      setTimeout(() => {
        setStatus(null);
        setCharacterMessage(null);
      }, 3000);
    }

    setLoading(false);
  };

  // Register handlers
  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setRegisterData({ ...registerData, password: newPassword });
    checkPasswordStrength(newPassword);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setStatus('error');
      setCharacterMessage("Passwords don't match! 🤔");
      setTimeout(() => {
        setStatus(null);
        setCharacterMessage(null);
      }, 3000);
      return;
    }

    if (passwordStrength < 50) {
      setError('Password is too weak. Please follow the requirements.');
      setStatus('error');
      setCharacterMessage('Password too weak! 😓');
      setTimeout(() => {
        setStatus(null);
        setCharacterMessage(null);
      }, 3000);
      return;
    }

    setLoading(true);
    setError('');
    setStatus('thinking');
    setCharacterMessage('Creating your account...');

    const submissionData = {
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      email: registerData.email,
      password: registerData.password,
      phone: registerData.phone,
      dateOfBirth: registerData.dateOfBirth,
    };

    if (registerData.gender && registerData.gender.trim() !== '') {
      submissionData.gender = registerData.gender;
    }

    const result = await register(submissionData);

    if (result.success) {
      setRegistrationSuccess(true);
      setStatus('success');
      setCharacterMessage('Check your email to verify! 📧');
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
      });
      setError('');
    } else {
      setError(result.error || 'Registration failed');
      setStatus('error');
      setCharacterMessage('Oops! Something went wrong 😅');
      setTimeout(() => {
        setStatus(null);
        setCharacterMessage(null);
      }, 3000);
    }

    setLoading(false);
  };

  // Focus handlers
  const handleFocus = (fieldId) => {
    setFocusedField(fieldId);
    const messages = {
      email: "I'm watching! 👀",
      password: 'Your secret is safe!',
      firstName: 'Nice to meet you! 👋',
      lastName: "What's your family name?",
      'reg-email': "I'm watching! 📧",
      phone: "Don't forget the area code!",
      dateOfBirth: "When's your birthday? 🎂",
      'reg-password': 'Make it strong! 💪',
      confirmPassword: 'Double-checking! ✓',
      gender: 'Optional, but helpful!',
    };
    setCharacterMessage(messages[fieldId] || "Let's do this!");
  };

  const handleBlur = () => {
    setFocusedField(null);
    setTimeout(() => {
      if (status !== 'thinking' && status !== 'success') {
        setCharacterMessage(null);
      }
    }, 1000);
  };

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
    if (!showPassword) {
      setCharacterMessage("I won't peek! 🙈");
    } else {
      setCharacterMessage('All clear! 👁️');
    }
    setTimeout(() => {
      if (!focusedField) setCharacterMessage(null);
    }, 2000);
  };

  const characterMode =
    status === 'success'
      ? 'celebrating'
      : status === 'error'
      ? 'error'
      : status === 'thinking'
      ? 'thinking'
      : showPassword && focusedField === 'password'
      ? 'hiding'
      : !isLogin && focusedField === 'reg-password' && passwordStrength > 75
      ? 'success'
      : 'watching';

  const submitButtonClass = `w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
    status === 'success'
      ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
      : status === 'error'
      ? 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
      : ''
  }`;

  const labelClass = 'block mb-1.5 text-sm font-medium text-gray-700';
  const Req = () => <span className="text-red-500 ml-0.5">*</span>;

  const GoogleButton = () => (
    <button
      type="button"
      onClick={googleLogin}
      className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-full font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="w-full max-w-6xl glass-card-enhanced rounded-3xl overflow-hidden relative shadow-2xl">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 z-20 text-sm text-gray-600 hover:text-primary-600 transition-all duration-300 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm hover:shadow-md hover:bg-white z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <div className="grid md:grid-cols-2">
          {/* Left side (info panel) */}
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-2xl font-bold">Imani Hub</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {isLogin ? 'Welcome Back! 👋' : 'Join Our Community! 🙏'}
              </h1>
              <p className="text-base lg:text-lg text-white/90 mb-8 leading-relaxed">
                {isLogin
                  ? 'Sign in to continue your faith journey and connect with believers across Kenya.'
                  : 'Create your account to start sharing prayers, joining discussions, and growing in faith together.'}
              </p>
              <div className="mb-8">
                <AnimatedCharacter
                  mode={characterMode}
                  focusedField={focusedField}
                  message={characterMessage}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all group-hover:scale-110">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Prayer Wall</h3>
                    <p className="text-sm text-white/80">Share and pray for requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all group-hover:scale-110">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Fellowship Circles</h3>
                    <p className="text-sm text-white/80">Join group discussions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all group-hover:scale-110">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Bible Study</h3>
                    <p className="text-sm text-white/80">Read and share verses</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 text-center mt-8 pt-6 border-t border-white/20">
              <p className="text-white/90 mb-3">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <button
                onClick={handleToggle}
                className="px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg bg-white text-primary-600 hover:bg-gray-50"
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Right side – forms */}
          <div className="p-8 lg:p-12 overflow-y-auto max-h-[80vh] lg:max-h-screen">
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-gray-500">
                {isLogin
                  ? 'Enter your credentials to access your account'
                  : 'Fill in your details to join our community'}
              </p>
            </div>

            {status === 'success' && !registrationSuccess && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm font-medium shadow-md animate-slide-up">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isLogin ? 'Login successful! Redirecting...' : 'Account created! Redirecting...'}</span>
              </div>
            )}

            {registrationSuccess && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm font-medium shadow-md animate-slide-up">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Registration successful! Please check your email to verify your account before logging in.</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm font-medium shadow-md animate-slide-up">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className={labelClass} htmlFor="email">
                    Email Address <Req />
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="password">
                    Password <Req />
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      onFocus={() => handleFocus('password')}
                      onBlur={handleBlur}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white pr-12"
                    />
                    <button
                      type="button"
                      onClick={handlePasswordToggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xl transition-all duration-300 hover:scale-110"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-primary-500 w-4 h-4 rounded"
                    />
                    <span className="group-hover:text-primary-600 transition">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || status === 'success'}
                  className={submitButtonClass}
                >
                  {loading || status === 'thinking' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : status === 'success' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Welcome back!
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
                <GoogleButton />
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      First Name <Req />
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First name"
                      value={registerData.firstName}
                      onChange={handleRegisterChange}
                      onFocus={() => handleFocus('firstName')}
                      onBlur={handleBlur}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Last Name <Req />
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last name"
                      value={registerData.lastName}
                      onChange={handleRegisterChange}
                      onFocus={() => handleFocus('lastName')}
                      onBlur={handleBlur}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address <Req /></label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    onFocus={() => handleFocus('reg-email')}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number <Req /></label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="0712345678"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    onFocus={() => handleFocus('phone')}
                    onBlur={handleBlur}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth <Req /></label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={registerData.dateOfBirth}
                    onChange={handleRegisterChange}
                    onFocus={() => handleFocus('dateOfBirth')}
                    onBlur={handleBlur}
                    required
                    min={maxDate}
                    max={minDate}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <PasswordInput
                    name="password"
                    value={registerData.password}
                    onChange={handlePasswordChange}
                    placeholder="Create a strong password"
                    label="Password"
                    required={true}
                    showStrength={true}
                    strength={passwordStrength}
                    errors={passwordErrors}
                    onFocus={() => handleFocus('reg-password')}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <PasswordInput
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Re-enter your password"
                    label="Confirm Password"
                    required={true}
                    showMatch={true}
                    matchValue={registerData.password}
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender (optional)</label>
                  <select
                    name="gender"
                    value={registerData.gender}
                    onChange={handleRegisterChange}
                    onFocus={() => handleFocus('gender')}
                    onBlur={handleBlur}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white text-gray-700 cursor-pointer"
                  >
                    <option value="">Select gender (optional)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading || status === 'success'}
                  className={submitButtonClass}
                >
                  {loading || status === 'thinking' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : status === 'success' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Welcome aboard!
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
                <GoogleButton />
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;