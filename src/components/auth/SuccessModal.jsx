import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const RESEND_COOLDOWN_SECONDS = 60;

const SuccessModal = ({ email, onClose, onResend, isResending }) => {
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (!username || !domain) return email;
    const firstChar = username.charAt(0);
    const maskedUsername = firstChar + "*".repeat(Math.min(username.length - 1, 5));
    return `${maskedUsername}@${domain}`;
  };

  const maskedEmail = maskEmail(email);

  const handleResend = () => {
    if (canResend && !isResending) {
      onResend();
      setCanResend(false);
      setCountdown(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ backgroundColor: "#55555580" }}
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
            <motion.button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-500 hover:text-primary transition-colors"
              aria-label="Close modal"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="material-icons">close</span>
            </motion.button>

            <div className="flex justify-center mb-6 mt-6">
              <motion.img
                src="/email-success.png"
                alt="Email sent successfully"
                className="w-[109px] h-[109px]"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(71%) sepia(28%) saturate(566%) hue-rotate(49deg) brightness(96%) contrast(90%)'
                }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              />
            </div>

            <motion.p
              className="text-xs text-zinc-500 text-center mb-6 max-w-[324px] mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span>Tautan untuk mengubah password sudah dikirim ke </span>
              <span className="text-zinc-500">{maskedEmail}</span>
              <span>. Tunggulah beberapa saat.</span>
            </motion.p>

            <motion.div
              className="h-px bg-zinc-200 w-[90%] mx-auto my-6"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 }}
            />

            <motion.p
              className="text-xs text-center text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={handleResend}
                disabled={!canResend || isResending}
                className={clsx(
                  'font-bold transition-colors cursor-pointer',
                    // 👇 INI DIA YANG DITAMBAHIN BRO!
                  'flex items-center justify-center w-full px- py-1',
                    // 👆 SAMPE SINI
                  {
                    'text-primary hover:text-primary-variant1': canResend,
                    'text-zinc-400 cursor-not-allowed': !canResend
                  }
                )}
                whileHover={canResend ? { scale: 1.05 } : {}}
                whileTap={canResend ? { scale: 0.95 } : {}}
              >
                {isResending
                  ? "Mengirim..."
                  : canResend
                    ? "Kirim ulang pesan"
                    : `Kirim ulang dalam (${formatCountdown(countdown)})`}
              </motion.button>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessModal;
