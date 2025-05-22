// src/components/organization/school/profile/SchoolAccountEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../../lib/api";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ConfirmationModal from "../../company/profile/ConfirmationModal";

// Simple validation schema
const passwordSchema = z.object({
  email: z.string().email("Email tidak valid"),
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak sesuai",
  path: ["confirmPassword"],
});

// Simple Password Field Component
const PasswordField = ({ label, name, register, error, placeholder, showForgotLink = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          {...register(name)}
          className={clsx(
            "w-full rounded-md h-12 border-[1.5px] px-4 pr-10 focus:outline-none focus:border-primary",
            error ? "border-red-500" : "border-gray-300"
          )}
          placeholder={placeholder}
          autoComplete={name.includes("new") ? "new-password" : "current-password"}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex="-1"
        >
          <span className="material-icons text-sm">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {error && (
        <span className="text-xs text-red-500 mt-1 block">
          {error.message}
        </span>
      )}
      {showForgotLink && (
        <div className="mt-2 text-right">
          <Link
            to="/forgot-password"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Lupa Password?
          </Link>
        </div>
      )}
    </div>
  );
};

// Password Checker - cuma visual feedback doang
const PasswordChecker = ({ password }) => {
  const checks = [
    { test: (pwd) => pwd.length >= 8, text: "Minimal 8 karakter" },
    { test: (pwd) => /\d/.test(pwd), text: "Minimal 1 angka" },
    { test: (pwd) => /[A-Z]/.test(pwd), text: "Minimal 1 huruf kapital" },
    { test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), text: "Minimal 1 karakter khusus" },
  ];

  return (
    <div>
      <span className="block text-xs text-gray-500 mb-3">
        Password harus terdiri dari:
      </span>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2">
        {checks.map((check, index) => {
          const isValid = check.test(password || '');
          return (
            <div key={index} className="flex items-center gap-2">
              <motion.span 
                animate={isValid ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                className="material-icons text-sm"
                style={{ color: isValid ? "#0EAD69" : "#71717A" }}
              >
                {isValid ? "check_circle" : "cancel"}
              </motion.span>
              <span className={`text-xs ${isValid ? "text-green-600" : "text-zinc-500"}`}>
                {check.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SchoolAccountEditModal = ({ onClose, userData }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: userData?.email || "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const watchedFields = watch();
  const newPassword = watch("newPassword");

  // Update email when userData changes
  useEffect(() => {
    if (userData?.email) {
      setValue("email", userData.email);
    }
  }, [userData, setValue]);

  // Check if form is dirty and valid
  const isDirty = !!(watchedFields.oldPassword || watchedFields.newPassword || watchedFields.confirmPassword);
  const isFormValid = !Object.keys(errors).length && isDirty && 
                     watchedFields.oldPassword && 
                     watchedFields.newPassword && 
                     watchedFields.confirmPassword;

  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      setErrorMessage("");
      return apiClient.patch('/users/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => onClose(true),
    onError: (error) => {
      console.error("Password change error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        "Terjadi kesalahan saat mengubah password"
      );
    },
  });

  const onSubmit = (data) => {
    setErrorMessage("");
    changePasswordMutation.mutate(data);
  };

  const handleCloseClick = () => {
    isDirty ? setShowConfirmationModal(true) : onClose(false);
  };

  if (showConfirmationModal) {
    return (
      <ConfirmationModal
        onCancel={() => setShowConfirmationModal(false)}
        onConfirm={() => {
          setShowConfirmationModal(false);
          onClose(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg w-[520px] max-w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">Ubah Password</h2>
          <button 
            type="button" 
            onClick={handleCloseClick}
            className="text-primary hover:text-primary-variant1 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                {...register("email")}
                disabled
                className="w-full rounded-md h-12 border-[1.5px] border-gray-300 px-4 bg-gray-100 text-gray-600"
                autoComplete="email"
              />
            </div>

            {/* Old Password */}
            <PasswordField
              label="Password Lama"
              name="oldPassword"
              register={register}
              error={errors.oldPassword}
              placeholder="Masukkan password lama"
              showForgotLink={true}
            />

            {/* New Password - tanpa validasi ribet */}
            <PasswordField
              label="Password Baru"
              name="newPassword"
              register={register}
              error={errors.newPassword}
              placeholder="Masukkan password baru"
            />

            {/* Password Checker - cuma visual feedback */}
            <PasswordChecker password={newPassword} />

            {/* Confirm Password */}
            <PasswordField
              label="Konfirmasi Password Baru"
              name="confirmPassword"
              register={register}
              error={errors.confirmPassword}
              placeholder="Konfirmasi password baru"
            />

            {/* Submit Section */}
            <div className="flex justify-between items-center pt-2">
              {/* Error message */}
              <div className="flex-grow mr-4">
                {errorMessage && (
                  <div className="inline-block px-4 py-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
                    <div className="flex items-center">
                      <span className="material-icons mr-2 text-sm">error</span>
                      {errorMessage}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting || changePasswordMutation.isPending}
                className={clsx(
                  "h-12 px-6 rounded-md text-white font-semibold transition-colors",
                  isFormValid && !isSubmitting && !changePasswordMutation.isPending
                    ? "bg-primary hover:bg-primary-variant1"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                {isSubmitting || changePasswordMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="material-icons animate-spin text-sm mr-1">refresh</span>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolAccountEditModal;