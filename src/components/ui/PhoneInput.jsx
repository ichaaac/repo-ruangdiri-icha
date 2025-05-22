// src/components/ui/PhoneInput.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import clsx from 'clsx';
import { 
  formatPhoneAsYouType,
  getCountryCode,
  isValidPhone,
  getPhoneValidationError 
} from '../../lib/phoneUtils';

const PhoneInput = forwardRef(({
  value = '',
  onChange,
  onBlur,
  error,
  placeholder = "81315481787",
  className = '',
  disabled = false,
  country = 'ID',
  showCountryCode = true,
  showValidation = true,
  label,
  helperText,
  required = false,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [internalError, setInternalError] = useState('');

  useEffect(() => {
    if (value) {
      const formatted = formatPhoneAsYouType(value, country);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value, country]);

  const handleChange = (e) => {
    const input = e.target.value;
    
    // Remove all non-numeric characters for validation
    const numericOnly = input.replace(/\D/g, '');
    
    const formatted = formatPhoneAsYouType(input, country);
    setDisplayValue(formatted);
    
    // Clear internal error when user starts typing
    if (internalError) {
      setInternalError('');
    }
    
    // Call onChange with the numeric value
    if (onChange) {
      onChange(numericOnly);
    }
  };

  const handleBlur = (e) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-numeric
    
    // Validate on blur if showValidation is true
    if (showValidation && input) {
      const validationError = getPhoneValidationError(input, country);
      setInternalError(validationError || '');
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  const displayError = error || internalError;
  const countryCodeDisplay = showCountryCode ? getCountryCode(country) : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-gray-500 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {showCountryCode && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium border-r border-gray-300 pr-3 bg-white">
            {countryCodeDisplay}
          </div>
        )}
        
        <input
          ref={ref}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={clsx(
            "w-full rounded-md h-12 border-1.5 px-4 focus:outline-none focus:border-primary transition-colors",
            showCountryCode && "pl-16",
            displayError ? "border-red-500" : "border-gray-300",
            disabled && "bg-gray-100 cursor-not-allowed",
            className
          )}
          placeholder={placeholder}
          autoComplete="tel"
          {...props}
        />
        
        {/* Validation indicator */}
        {showValidation && value && !displayError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="material-icons text-green-500 text-lg">
              check_circle
            </span>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {displayError && (
        <span className="text-xs text-red-500 mt-1 block">
          {displayError}
        </span>
      )}
      
      {/* Helper text */}
      {helperText && !displayError && (
        <span className="text-xs text-gray-400 mt-1 block">
          {helperText}
        </span>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;