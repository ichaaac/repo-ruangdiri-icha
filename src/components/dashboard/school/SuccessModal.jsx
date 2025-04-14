"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SuccessModal = ({ email = "emaila******@gmail.com", onClose, reportType = "Daftar Siswa Belum Skrining" }) => {
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ backgroundColor: "rgba(141, 208, 222, 0.7)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="w-[454px] max-w-[90%] bg-white rounded-xl shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="relative pt-3 px-4 pb-4">
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-500 hover:text-primary transition-colors"
              aria-label="Close modal"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="material-icons">close</span>
            </motion.button>

            {/* Success icon */}
            <div className="flex justify-center mb-6 mt-4">
              <motion.img
                src="/email-success.png"
                alt="Email sent successfully"
                className="w-[109px] h-[109px]"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              />
            </div>

            {/* Success message */}
            <motion.h2 
              className="text-2xl font-bold text-primary text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Berhasil!
            </motion.h2>

            {/* Report sent confirmation */}
            <motion.p 
              className="text-xs text-zinc-500 text-center mb-6 max-w-[324px] mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span>Laporan {reportType} berhasil dikirim ke </span>
              <span className="text-primary">{email}</span>
              <span>.</span>
            </motion.p>

            {/* Button */}
            <motion.div
              className="flex justify-center mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button 
                onClick={onClose}
                className="bg-primary hover:bg-primary-variant1 text-white py-2 px-8 rounded-full transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessModal;