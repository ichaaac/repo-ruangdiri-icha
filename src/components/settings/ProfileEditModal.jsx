import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * Profile Edit Modal Component
 * Provides a modal for editing organization profile information
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onSubmit - Function to call when submitting the form
 * @param {Object} props.schema - Zod validation schema
 * @param {Object} props.defaultValues - Default values for the form
 * @param {Array} props.fields - Fields configuration
 * @param {string} props.title - Modal title
 * @param {boolean} props.isSubmitting - Flag to indicate if form is being submitted
 */
const ProfileEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  schema,
  defaultValues,
  fields,
  title = "Edit Profil",
  isSubmitting = false
}) => {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  // Form setup with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues
  });
  
  // Update form values when defaultValues change
  useEffect(() => {
    if (defaultValues && isOpen) {
      Object.keys(defaultValues).forEach(key => {
        setValue(key, defaultValues[key]);
      });
    }
  }, [defaultValues, isOpen, setValue]);
  
  // Handle form submission
  const handleFormSubmit = (data) => {
    onSubmit(data);
  };
  
  // Handle modal close with confirmation if form is dirty
  const handleClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };
  
  // Confirm close and discard changes
  const confirmClose = () => {
    reset();
    setShowConfirmClose(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#8DD0DEB2] flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-xl w-[90%] max-w-[600px] p-6 shadow-lg"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">{title}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="block text-sm text-zinc-600">
                    {field.label}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      {...register(field.name)}
                      className={`w-full p-3 rounded-md border ${
                        errors[field.name] ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                      rows={3}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <input
                      type={field.type}
                      {...register(field.name)}
                      className={`w-full p-3 rounded-md border ${
                        errors[field.name] ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                      disabled={isSubmitting}
                    />
                  )}

                  {errors[field.name] && (
                    <p className="text-red-500 text-xs">
                      {errors[field.name].message}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-primary text-primary rounded-full hover:bg-blue-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-variant1 flex items-center transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-icons animate-spin mr-2 text-sm">
                        sync
                      </span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Confirm close modal */}
          <AnimatePresence>
            {showConfirmClose && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  className="bg-white rounded-xl w-[90%] max-w-[400px] p-6 shadow-lg"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className="material-icons text-5xl text-[#EE4266] mb-4">
                      warning
                    </span>
                    <h3 className="text-lg font-bold mb-2 text-[#EE4266]">
                      Perubahan Belum Disimpan
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Apakah Anda yakin ingin menutup? Semua perubahan yang belum
                      disimpan akan hilang.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowConfirmClose(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={confirmClose}
                        className="px-4 py-2 bg-[#EE4266] text-white rounded-full"
                      >
                        Ya, Tutup
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileEditModal;