"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SuccessModal = ({ email, onClose, onResend, isResending }) => {
  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (!username || !domain) return email;

    const firstChar = username.charAt(0);
    const maskedUsername =
      firstChar + "*".repeat(Math.min(username.length - 1, 5));
    return `${maskedUsername}@${domain}`;
  };

  const maskedEmail = maskEmail(email);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ backgroundColor: "#8DD0DEB2" }}
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

            {/* Email sent confirmation */}
            <motion.p 
              className="text-xs text-zinc-500 text-center mb-6 max-w-[324px] mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span>Tautan untuk mengubah password sudah dikirim ke </span>
              <span className="text-primary">{maskedEmail}</span>
              <span>. Tunggulah beberapa saat.</span>
            </motion.p>

            {/* Divider */}
            <motion.div 
              className="h-px bg-zinc-200 w-[90%] mx-auto my-6"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5 }}
            />

            {/* Resend option */}
            <motion.p 
              className="text-xs text-center text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span>Jika kamu belum menerima pesan. </span>
              <motion.button
                onClick={onResend}
                disabled={isResending}
                className="font-bold text-primary hover:text-primary-variant1 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isResending ? "Mengirim..." : "Kirim ulang pesan"}
              </motion.button>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessModal;