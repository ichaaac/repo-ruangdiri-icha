import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Success Modal Component
 * Displays a success message to the user
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {string} props.message - Success message to display
 */
const SuccessModal = ({ isOpen, onClose, message = "Data kamu telah berhasil diubah" }) => {
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
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl w-[90%] max-w-[454px] py-8 md:py-10 flex flex-col items-center justify-center relative shadow-lg"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="material-icons">close</span>
            </button>

            <span className="material-icons text-[60px] md:text-[80px] text-primary-variant1">
              check_circle
            </span>

            <p className="text-lg md:text-xl mt-4 text-primary-variant1 font-bold text-center px-4">
              {message}
            </p>
            
            <button
              onClick={onClose}
              className="mt-8 px-8 py-2 bg-primary text-white rounded-full hover:bg-primary-variant1 transition-colors"
            >
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;