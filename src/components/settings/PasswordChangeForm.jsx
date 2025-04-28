import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { passwordSchema } from "../../schemas/validationSchema";
/**
 * Password Change Form Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onCancel - Function to call when canceling
 * @param {Function} props.onSubmit - Function to call when submitting
 * @param {boolean} props.isSubmitting - Flag to indicate if form is being submitted
 */
const PasswordChangeForm = ({ onCancel, onSubmit, isSubmitting = false }) => {
  // Field visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    watch,
    reset
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Watch the new password for real-time validation
  const newPassword = watch("newPassword", "");
  
  // Password validation state for requirements display
  const validationStatus = {
    hasMinLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
  };
  
  // Handle form submission
  const handleFormSubmit = (data) => {
    onSubmit(data);
  };
  
  // Handle cancel with confirmation if form is dirty
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      onCancel();
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col py-6 pr-2.5 pl-4 md:pl-7 mt-4 w-full text-xs leading-loose bg-blue-50 rounded-xl">
        {/* Old Password Field */}
        <div className="mb-4">
          <label className="self-start text-zinc-400">Password Saat Ini</label>
          <div
            className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${errors.oldPassword ? "border border-[#EE4266]" : ""}`}
          >
            <input
              type={showOldPassword ? "text" : "password"}
              {...register("oldPassword")}
              className={`flex-1 outline-none border-none bg-transparent ${errors.oldPassword ? "text-[#EE4266]" : "text-zinc-500"}`}
              placeholder="Masukkan password saat ini"
              disabled={isSubmitting}
            />
            <span
              className={`material-icons text-sm cursor-pointer ${errors.oldPassword ? "text-[#EE4266]" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}
              onClick={() => !isSubmitting && setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? "visibility_off" : "visibility"}
            </span>
          </div>

          {/* Error message for old password with animation */}
          <AnimatePresence>
            {errors.oldPassword && (
              <motion.div
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs rounded-[200px] text-[#EE4266] bg-[#FFEAEC] border border-[#C34F58]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <span className="material-icons text-sm">error</span>
                <span>{errors.oldPassword.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Password Field */}
        <div className="mb-1">
          <label className="self-start text-zinc-400">Password Baru</label>
          <div
            className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${errors.newPassword ? "border border-[#EE4266]" : ""}`}
          >
            <input
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword")}
              className={`flex-1 outline-none border-none bg-transparent ${errors.newPassword ? "text-[#EE4266]" : "text-zinc-500"}`}
              placeholder="Masukkan password baru"
              disabled={isSubmitting}
            />
            <span
              className={`material-icons text-sm cursor-pointer ${errors.newPassword ? "text-[#EE4266]" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}
              onClick={() => !isSubmitting && setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? "visibility_off" : "visibility"}
            </span>
          </div>

          {/* Error message for new password with animation */}
          <AnimatePresence>
            {errors.newPassword && (
              <motion.div
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs rounded-[200px] text-[#EE4266] bg-[#FFEAEC] border border-[#C34F58]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <span className="material-icons text-sm">error</span>
                <span>{errors.newPassword.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Password Requirements */}
        <div className="ml-4 mb-4">
          <p className="text-xs text-zinc-500 mb-1">
            Password harus terdiri dari:
          </p>
          <div className="flex gap-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span
                  className="material-icons text-[14px] mr-1"
                  style={{
                    color: validationStatus.hasMinLength ? "#9BCA61" : "#EE4266",
                  }}
                >
                  {validationStatus.hasMinLength ? "check_circle" : "cancel"}
                </span>
                <span
                  className={
                    validationStatus.hasMinLength
                      ? "text-[#9BCA61]"
                      : "text-[#EE4266]"
                  }
                >
                  Minimal 8 karakter
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="material-icons text-[14px] mr-1"
                  style={{
                    color: validationStatus.hasUpperCase ? "#9BCA61" : "#EE4266",
                  }}
                >
                  {validationStatus.hasUpperCase ? "check_circle" : "cancel"}
                </span>
                <span
                  className={
                    validationStatus.hasUpperCase
                      ? "text-[#9BCA61]"
                      : "text-[#EE4266]"
                  }
                >
                  Minimal 1 huruf kapital
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span
                  className="material-icons text-[14px] mr-1"
                  style={{
                    color: validationStatus.hasNumber ? "#9BCA61" : "#EE4266",
                  }}
                >
                  {validationStatus.hasNumber ? "check_circle" : "cancel"}
                </span>
                <span
                  className={
                    validationStatus.hasNumber
                      ? "text-[#9BCA61]"
                      : "text-[#EE4266]"
                  }
                >
                  Minimal 1 angka
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="material-icons text-[14px] mr-1"
                  style={{
                    color: validationStatus.hasSpecialChar
                      ? "#9BCA61"
                      : "#EE4266",
                  }}
                >
                  {validationStatus.hasSpecialChar ? "check_circle" : "cancel"}
                </span>
                <span
                  className={
                    validationStatus.hasSpecialChar
                      ? "text-[#9BCA61]"
                      : "text-[#EE4266]"
                  }
                >
                  Minimal 1 karakter khusus
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="mb-6">
          <label className="self-start text-zinc-400">
            Konfirmasi Password Baru
          </label>
          <div
            className={`flex items-center px-3 py-1.5 mt-2 text-base leading-none whitespace-nowrap bg-white rounded-md min-h-8 ${errors.confirmPassword ? "border border-[#EE4266]" : ""}`}
          >
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              className={`flex-1 outline-none border-none bg-transparent ${errors.confirmPassword ? "text-[#EE4266]" : "text-zinc-500"}`}
              placeholder="Masukkan kembali password baru"
              disabled={isSubmitting}
            />
            <span
              className={`material-icons text-sm cursor-pointer ${errors.confirmPassword ? "text-[#EE4266]" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}
              onClick={() => !isSubmitting && setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </div>

          {/* Error message with animation - Only shows under confirm password field */}
          <AnimatePresence>
            {errors.confirmPassword && (
              <motion.div
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs rounded-[200px] text-[#EE4266] bg-[#FFEAEC] border border-[#C34F58]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <span className="material-icons text-sm">error</span>
                <span>{errors.confirmPassword.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center self-end text-sm">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-[50px] text-primary border border-primary hover:bg-blue-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-[50px] bg-primary text-white hover:bg-primary-variant1 transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <span className="material-icons animate-spin mr-2 text-sm">sync</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </form>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            onCancel={() => setShowCancelModal(false)}
            onConfirm={() => {
              setShowCancelModal(false);
              onCancel();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

function CancelModal({ onCancel, onConfirm }) {
  return (
    <motion.div
      className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-white rounded-xl w-[90%] max-w-[454px] py-6 md:py-8 flex flex-col items-center justify-center relative shadow-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-icons text-[60px] md:text-[80px] text-[#EE4266]">
          error
        </span>

        <p className="text-lg md:text-xl mt-4 text-[#EE4266] font-bold text-center">
          Apakah kamu yakin?
        </p>

        <p className="text-sm mt-3 text-[#8B8B8B] max-w-[300px] text-center px-4">
          Perubahan yang belum disimpan akan hilang.
        </p>

        <div className="w-[80%] h-[1px] bg-gray-200 my-5"></div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="px-5 md:px-6 py-2 border border-[#EE4266] text-[#EE4266] rounded-[50px] hover:bg-red-50 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            className="px-5 md:px-6 py-2 bg-[#EE4266] text-white rounded-[50px] hover:bg-red-700 transition-colors"
          >
            Ya
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PasswordChangeForm;