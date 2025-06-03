// src/components/shared/ConfirmationModal.jsx
import React from "react"
import { motion } from "framer-motion"

/**
 * Reusable Confirmation Modal Component
 * @param {Object} props
 * @param {Function} props.onCancel - Callback when cancel is clicked
 * @param {Function} props.onConfirm - Callback when confirm is clicked
 * @param {string}   props.title - Optional custom title
 * @param {string}   props.message - Optional custom message
 */
const ConfirmationModal = ({
  onCancel,
  onConfirm,
  title = "Apakah kamu yakin?",
  message = "Perubahan yang belum disimpan akan hilang.",
}) => {
  return (
    <>
      {/* BACKDROP that covers the ENTIRE viewport including sidebar */}
      <div className="fixed inset-0 z-[9998] bg-black bg-opacity-30" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0 }}></div>

      {/* CONTENT yang di‐animate masuk/keluar */}
      <motion.div
        key="confirmation-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md py-6 sm:py-8 px-4 sm:px-6 relative flex flex-col items-center">
          <div className="mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F5385D] flex items-center justify-center text-white">
              <span className="material-icons text-4xl sm:text-5xl">error_outline</span>
            </div>
          </div>
          <p className="text-gray-500 mb-2 text-center text-sm sm:text-base">{message}</p>
          <h3 className="text-[#F5385D] font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-center">
            {title}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="px-6 sm:px-10 py-2 border border-[#F5385D] rounded-full text-[#F5385D] hover:bg-red-50 transition-colors order-2 sm:order-1"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-6 sm:px-10 py-2 bg-[#F5385D] rounded-full text-white hover:bg-red-600 transition-colors order-1 sm:order-2"
            >
              Ya
            </button>
          </div>
        </div>
      </motion.div>
  </>
  )
}

export default ConfirmationModal