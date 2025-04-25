import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema } from '../../schemas/validationSchema';

/**
 * Account Settings Modal for both School and Company users
 * Handles password change with validation
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Organization type ('school' or 'company')
 * @param {Object} props.initialData - Initial email data
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSubmit - Function to handle form submission
 * @returns {JSX.Element}
 */
const AccountSettingsModal = ({ type = 'school', initialData = {}, onClose, onSubmit }) => {
  const { register, handleSubmit, watch, formState: { errors, isDirty, isValid } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: initialData.email || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange'
  });

  // Password validation states for visual feedback
  const [validations, setValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasSpecialChar: false,
  });

  // Watch new password for validation
  const newPassword = watch('newPassword');
  
  // Update validation states when password changes
  useEffect(() => {
    if (newPassword) {
      setValidations({
        minLength: newPassword.length >= 8,
        hasNumber: /\d/.test(newPassword),
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      });
    }
  }, [newPassword]);

  // Check if form is valid and changed to enable/disable submit button
  const isFormChanged = isDirty && isValid;

  // Handle form submission
  const submitHandler = (data) => {
    onSubmit(data);
  };

  // Validation icon component
  const ValidationIcon = ({ isValid }) => (
    <span className="material-symbols-outlined text-xs" style={{ color: isValid ? '#6DAF31' : '#D9D9D9' }}>
      {isValid ? "check_circle" : "cancel"}
    </span>
  );

  return (
    <div className="flex flex-col gap-2.5 justify-center items-center p-8 mx-auto bg-white rounded-xl shadow-xl w-[523px] max-md:p-5 max-md:max-w-[991px] max-md:w-[90%] max-sm:p-4 max-sm:w-full max-sm:max-w-screen-sm">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />

      <form
        onSubmit={handleSubmit(submitHandler)}
        className="flex flex-col gap-6 items-start w-full"
      >
        <header className="text-xl font-bold text-primary w-full">
          Edit Pengaturan Akun
        </header>

        {/* Email field */}
        <div className="flex flex-col gap-2.5 items-start w-full">
          <label
            htmlFor="email"
            className="text-xs text-zinc-500"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>

        {/* Old Password field */}
        <div className="flex flex-col gap-2.5 items-start w-full">
          <label
            htmlFor="oldPassword"
            className="text-xs text-zinc-500"
          >
            Password Lama
          </label>
          <input
            type="password"
            id="oldPassword"
            {...register('oldPassword')}
            className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.oldPassword && (
            <span className="text-xs text-red-500">{errors.oldPassword.message}</span>
          )}
        </div>

        {/* New Password field */}
        <div className="flex flex-col gap-2.5 items-start w-full">
          <label
            htmlFor="newPassword"
            className="text-xs text-zinc-500"
          >
            Password Baru
          </label>
          <input
            type="password"
            id="newPassword"
            {...register('newPassword')}
            className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.newPassword && (
            <span className="text-xs text-red-500">{errors.newPassword.message}</span>
          )}
        </div>

        {/* Password validation requirements */}
        <div className="flex flex-col gap-3 w-full">
          <p className="text-xs text-zinc-500">
            Password harus terdiri dari :
          </p>
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2">
              <ValidationIcon isValid={validations.minLength} />
              <span className="text-xs text-zinc-500">Minimal 8 karakter</span>
            </div>
            <div className="flex items-center gap-2">
              <ValidationIcon isValid={validations.hasNumber} />
              <span className="text-xs text-zinc-500">Minimal 1 angka</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2">
              <ValidationIcon isValid={validations.hasUpperCase} />
              <span className="text-xs text-zinc-500">
                Minimal 1 huruf kapital
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ValidationIcon isValid={validations.hasSpecialChar} />
              <span className="text-xs text-zinc-500">
                Minimal 1 karakter khusus
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password field */}
        <div className="flex flex-col gap-2.5 items-start w-full">
          <label
            htmlFor="confirmPassword"
            className="text-xs text-zinc-500"
          >
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            id="confirmPassword"
            {...register('confirmPassword')}
            className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="h-8 text-base font-bold text-primary bg-white border border-primary hover:bg-primary-light rounded-md cursor-pointer px-4 flex items-center justify-center transition-colors duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isFormChanged}
            className={`px-7 py-2.5 h-8 text-base font-bold text-white rounded-md w-[114px] flex items-center justify-center transition-colors duration-200 ${
              isFormChanged ? 'bg-primary hover:bg-primary-variant2' : 'bg-[#D9D9D9] cursor-not-allowed'
            }`}
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountSettingsModal;