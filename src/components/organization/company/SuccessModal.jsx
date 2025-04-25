import React from "react";
import { motion } from "framer-motion";

/**
 * Success Modal Component for Company Dashboard
 * Shows confirmation message when reports are sent
 * 
 * @param {Object} props - Component props
 * @param {string} props.email - Email address reports were sent to (partially masked)
 * @param {string} props.reportType - Type of report that was sent
 * @param {Function} props.onClose - Function to call when modal is closed
 */
const SuccessModal = ({ email, reportType, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        className="bg-white rounded-2xl max-w-md w-full p-8 relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <span className="material-icons">close</span>
        </button>
        
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <span className="material-icons text-4xl text-green-500">check_circle</span>
          </div>
        </div>
        
        {/* Success message */}
        <h3 className="text-center text-xl font-bold mb-4 text-gray-800">
          Berhasil Kirim Report
        </h3>
        
        <p className="text-center text-gray-600">
          Laporan <span className="font-bold text-primary-variant1">"{reportType}"</span> berhasil dikirim ke email {email}.
        </p>
        
        {/* Confirm button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="bg-primary text-white px-8 py-2 rounded-full hover:bg-primary-variant1 transition-colors"
          >
            Oke
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessModal;