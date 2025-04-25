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
  const { register, handleSubmit, watch, formState: { errors, isDirty, isValid } } = useForm({
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
  const formValues = watch();
  const isFormChanged = isDirty && isValid;

  // Handle form submission
  const submitHandler = (data) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col gap-2.5 justify-center items-center px-8 py-6 mx-auto max-w-none bg-white rounded-xl shadow-xl w-[523px] max-md:p-5 max-md:max-w-[991px] max-md:w-[90%] max-sm:p-4 max-sm:w-full max-sm:max-w-screen-sm"
    >
      <h2 className="mb-6 text-xl font-bold text-primary max-md:text-lg max-sm:text-base">
        {type === 'school' ? 'Edit Informasi Sekolah' : 'Edit Informasi Organisasi'}
      </h2>

      {/* Name field - conditional based on type */}
      <div className="flex flex-col gap-2.5 items-start w-full">
        <label
          htmlFor={type === 'school' ? 'schoolName' : 'companyName'}
          className="text-xs text-zinc-500"
        >
          {type === 'school' ? 'Nama Sekolah' : 'Nama Organisasi'}
        </label>
        <input
          type="text"
          id={type === 'school' ? 'schoolName' : 'companyName'}
          {...register(type === 'school' ? 'schoolName' : 'companyName')}
          className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors[type === 'school' ? 'schoolName' : 'companyName'] && (
          <span className="text-xs text-red-500">
            {errors[type === 'school' ? 'schoolName' : 'companyName'].message}
          </span>
        )}
      </div>

      {/* Address field */}
      <div className="flex flex-col gap-2.5 items-start w-full">
        <label
          htmlFor="address"
          className="text-xs text-zinc-500"
        >
          Alamat
        </label>
        <input
          type="text"
          id="address"
          {...register('address')}
          className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.address && (
          <span className="text-xs text-red-500">{errors.address.message}</span>
        )}
      </div>

      {/* Phone number field */}
      <div className="flex flex-col gap-2.5 items-start w-full">
        <label
          htmlFor="phoneNumber"
          className="text-xs text-zinc-500"
        >
          Nomor Telepon
        </label>
        <input
          type="tel"
          id="phoneNumber"
          {...register('phoneNumber')}
          className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.phoneNumber && (
          <span className="text-xs text-red-500">{errors.phoneNumber.message}</span>
        )}
      </div>

      {/* Industry field - only for company */}
      {type === 'company' && (
        <div className="flex flex-col gap-2.5 items-start w-full">
          <label
            htmlFor="industry"
            className="text-xs text-zinc-500"
          >
            Industri
          </label>
          <input
            type="text"
            id="industry"
            {...register('industry')}
            className="w-full rounded-md border border-solid border-zinc-500 h-[34px] px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.industry && (
            <span className="text-xs text-red-500">{errors.industry.message}</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 w-full mt-4">
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
          className={`h-8 text-base font-bold text-white rounded-md cursor-pointer w-[114px] flex items-center justify-center transition-colors duration-200 ${
            isFormChanged ? 'bg-primary hover:bg-primary-variant2' : 'bg-[#D9D9D9] cursor-not-allowed'
          }`}
        >
          Simpan
        </button>
      </div>
    </form>
  );
};

export default InformationModal;