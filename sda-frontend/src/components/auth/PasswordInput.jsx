// src/components/auth/PasswordInput.jsx
import React, { useState } from 'react';

const PasswordInput = ({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  label,
  required = false,
  showStrength = false,
  strength = 0,
  errors = [],
  showMatch = false,
  matchValue = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getStrengthInfo = () => {
    if (strength < 25) return { color: 'bg-red-500', text: 'Very Weak', textColor: 'text-red-600' };
    if (strength < 50) return { color: 'bg-orange-500', text: 'Weak', textColor: 'text-orange-600' };
    if (strength < 75) return { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-600' };
    return { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-600' };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative w-full">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition rounded-full hover:bg-gray-100"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strengthInfo.color}`}
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
            {strengthInfo.text}
          </span>
        </div>
      )}

      {/* Password Match Indicator */}
      {showMatch && value && matchValue && (
        <div className="mt-2 text-xs font-medium">
          {value === matchValue ? (
            <span className="text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Passwords match
            </span>
          ) : (
            <span className="text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Passwords do not match
            </span>
          )}
        </div>
      )}

      {/* Error List / Password Requirements */}
      {errors.length > 0 && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          {errors.map((err, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-gray-600 mb-1 last:mb-0">
              <span className="text-red-500 text-sm">•</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;