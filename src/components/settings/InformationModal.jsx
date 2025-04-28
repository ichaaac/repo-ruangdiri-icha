import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schoolProfileSchema, companyProfileSchema } from '../../schemas/validationSchema';
/**
 * Information Modal for both School and Company profiles
 * Handles form state and validation based on organization type
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Organization type ('school' or 'company')
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSubmit - Function to handle form submission
 * @returns {JSX.Element}
 */
const InformationModal = ({ type = 'school', initialData = {}, onClose, onSubmit }) => {
  // Set up form validation with zod schema based on organization type
  const { register, handleSubmit, formState: { errors, isDirty, isValid } } = useForm({
    resolver: zodResolver(type === 'school' ? schoolProfileSchema : companyProfileSchema),
    defaultValues: {
      // School fields
      schoolName: initialData.schoolName || '',
      // Company fields
      companyName: initialData.companyName || '',
      // Common fields
      address: initialData.address || '',
      phoneNumber: initialData.phoneNumber || '',
      email: initialData.email || '',
      industry: initialData.industry || '',
    },
    mode: 'onChange'
  });

  // Check if form has any changes to enable/disable submit button
  const isFormChanged = isDirty && isValid;

  // Handle form submission
  const submitHandler = (data) => {
    onSubmit(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <div className="p-6 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <span className="material-icons">cancel</span>
        </button>

        <h2 className="text-xl font-bold text-primary mb-6">
          {type === 'school' ? 'Edit Informasi Sekolah' : 'Edit Informasi Organisasi'}
        </h2>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
          {/* Name field - conditional based on type */}
          <div className="space-y-1">
            <label 
              htmlFor={type === 'school' ? 'schoolName' : 'companyName'} 
              className="block text-sm text-zinc-500"
            >
              {type === 'school' ? 'Nama Sekolah' : 'Nama Organisasi'}
            </label>
            <input
              type="text"
              id={type === 'school' ? 'schoolName' : 'companyName'}
              {...register(type === 'school' ? 'schoolName' : 'companyName')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors[type === 'school' ? 'schoolName' : 'companyName'] && (
              <p className="text-[#EE4266] text-xs mt-1">
                {errors[type === 'school' ? 'schoolName' : 'companyName'].message}
              </p>
            )}
          </div>

          {/* Address field */}
          <div className="space-y-1">
            <label htmlFor="address" className="block text-sm text-zinc-500">
              Alamat
            </label>
            <textarea
              id="address"
              {...register('address')}
              rows="3"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.address && (
              <p className="text-[#EE4266] text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Phone number field */}
          <div className="space-y-1">
            <label htmlFor="phoneNumber" className="block text-sm text-zinc-500">
              Nomor Telepon
            </label>
            <input
              type="tel"
              id="phoneNumber"
              {...register('phoneNumber')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.phoneNumber && (
              <p className="text-[#EE4266] text-xs mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Industry field - only for company */}
          {type === 'company' && (
            <div className="space-y-1">
              <label htmlFor="industry" className="block text-sm text-zinc-500">
                Industri
              </label>
              <input
                type="text"
                id="industry"
                {...register('industry')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.industry && (
                <p className="text-[#EE4266] text-xs mt-1">{errors.industry.message}</p>
              )}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-zinc-500">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.email && (
              <p className="text-[#EE4266] text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormChanged}
              className={`w-full py-2 rounded-md text-white font-medium transition-colors ${
                isFormChanged ? 'bg-primary hover:bg-primary-variant1' : 'bg-[#D9D9D9] cursor-not-allowed'
              }`}
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InformationModal;