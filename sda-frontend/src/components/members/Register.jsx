// src/pages/members/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import AnimatedCharacter from '../../components/auth/AnimatedCharacter';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerStatus, setRegisterStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [characterMessage, setCharacterMessage] = useState(null);
  const { register } = useAuth();

  // Date bounds: must be 13–120 years old
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];
  const maxDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

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

    // Character encouragement
    if (strength < 50) {
      setCharacterMessage('Keep going! 💪');
    } else if (strength < 75) {
      setCharacterMessage('Getting better! 🌟');
    } else {
      setCharacterMessage('Strong password! 🔐');
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    checkPasswordStrength(newPassword);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
    
    const messages = {
      firstName: "Nice to meet you! 👋",
      lastName: "What's your family name?",
      email: "I'm watching! 📧",
      phone: "Don't forget the area code!",
      dateOfBirth: "When's your birthday? 🎂",
      password: "Make it strong! 💪",
      confirmPassword: "Double-checking! ✓",
      gender: "Optional, but helpful!",
    };
    
    setCharacterMessage(messages[fieldName] || "Fill this out!");
  };

  const handleBlur = () => {
    setFocusedField(null);
    setTimeout(() => {
      if (registerStatus !== 'thinking' && registerStatus !== 'success') {
        setCharacterMessage(null);
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setRegisterStatus('error');
      setCharacterMessage('Passwords don\'t match! 🤔');
      setTimeout(() => {
        setRegisterStatus(null);
        setCharacterMessage(null);
      }, 3000);
      return;
    }

    if (passwordStrength < 50) {
      setError('Password is too weak. Please follow the requirements.');
      setRegisterStatus('error');
      setCharacterMessage('Password too weak! 😓');
      setTimeout(() => {
        setRegisterStatus(null);
        setCharacterMessage(null);
      }, 3000);
      return;
    }

    setLoading(true);
    setError('');
    setRegisterStatus('thinking');
    setCharacterMessage('Creating your account...');

    const submissionData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
    };

    if (formData.gender && formData.gender.trim() !== '') {
      submissionData.gender = formData.gender;
    }

    const result = await register(submissionData);

    if (result.success) {
      setRegisterStatus('success');
      setCharacterMessage('Welcome to the community! 🎉');
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setError(result.error || 'Registration failed');
      setRegisterStatus('error');
      setCharacterMessage('Oops! Something went wrong 😅');
      setTimeout(() => {
        setRegisterStatus(null);
        setCharacterMessage(null);
      }, 3000);
    }

    setLoading(false);
  };

  // Determine character mode
  const characterMode = registerStatus === 'success'
    ? 'celebrating'
    : registerStatus === 'error'
    ? 'error'
    : registerStatus === 'thinking'
    ? 'thinking'
    : focusedField === 'password' && passwordStrength > 75
    ? 'success'
    : 'watching';

  // Shared field label style
  const labelClass = 'block mb-1 text-sm font-medium text-gray-600 transition-colors duration-300';
  const inputClass = 'input-fun transition-all duration-300 hover:scale-[1.01] focus:scale-[1.02] focus:shadow-glow';
  
  // Shared required asterisk
  const Req = () => <span className="text-red-500 ml-0.5 text-base">*</span>;

  return (
    <AuthLayout title="Join the Community 🙏" subtitle="Connect with youth who share your faith">
      
      {/* Animated Character */}
      <AnimatedCharacter
        mode={characterMode}
        focusedField={focusedField}
        message={characterMessage}
      />

      {/* Error banner */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-center font-medium shadow-md animate-wiggle">
          <span className="text-lg mr-2">❌</span>
          {error}
        </div>
      )}

      {/* Success banner */}
      {registerStatus === 'success' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-center font-medium shadow-md animate-float">
          <span className="text-lg mr-2">✅</span>
          Account created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* First name + Last name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <label className={labelClass}>
              First Name <Req />
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              onFocus={() => handleFocus('firstName')}
              onBlur={handleBlur}
              required
              className={inputClass}
            />
          </div>
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <label className={labelClass}>
              Last Name <Req />
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              onFocus={() => handleFocus('lastName')}
              onBlur={handleBlur}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Email */}
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <label className={labelClass}>
            Email <Req />
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus('email')}
            onBlur={handleBlur}
            required
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <label className={labelClass}>
            Phone Number <Req />
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="e.g., 0712345678"
            value={formData.phone}
            onChange={handleChange}
            onFocus={() => handleFocus('phone')}
            onBlur={handleBlur}
            required
            className={inputClass}
          />
        </div>

        {/* Date of birth */}
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <label className={labelClass}>
            Date of Birth <Req />
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            onFocus={() => handleFocus('dateOfBirth')}
            onBlur={handleBlur}
            required
            min={maxDate}
            max={minDate}
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <PasswordInput
            name="password"
            value={formData.password}
            onChange={handlePasswordChange}
            placeholder="Create a strong password"
            label="Password"
            required={true}
            showStrength={true}
            strength={passwordStrength}
            errors={passwordErrors}
            onFocus={() => handleFocus('password')}
            onBlur={handleBlur}
          />
        </div>

        {/* Confirm Password */}
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <PasswordInput
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            label="Confirm Password"
            required={true}
            showMatch={true}
            matchValue={formData.password}
            onFocus={() => handleFocus('confirmPassword')}
            onBlur={handleBlur}
          />
        </div>

        {/* Gender — optional */}
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <label className={labelClass}>Gender (optional)</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onFocus={() => handleFocus('gender')}
            onBlur={handleBlur}
            className={`${inputClass} bg-white text-gray-700`}
          >
            <option value="">Select gender (optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || registerStatus === 'success'}
          className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-lg"
        >
          {loading || registerStatus === 'thinking' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </span>
          ) : registerStatus === 'success' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🎉</span>
              Welcome aboard!
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all duration-300 hover:scale-105 inline-block"
        >
          Login
        </button>
      </p>

      {/* Decorative floating elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-20 left-10 w-16 h-16 bg-secondary-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 left-5 w-12 h-12 bg-accent-mint rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }} />
    </AuthLayout>
  );
}

export default Register;