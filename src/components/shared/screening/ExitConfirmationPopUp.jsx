import React, { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const ExitConfirmationPopup = ({
  isOpen,
  onCancel,
  onConfirm,
  closeOnOutsideClick = true,
}) => {
  const cancelRef = useRef(null)

  // lock scroll + autofocus + esc to close
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    // autofocus cancel for quick keyboard access
    setTimeout(() => cancelRef.current?.focus(), 0)

    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const card = (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-title"
      aria-describedby="exit-desc"
      className="bg-white rounded-[10px] shadow-xl w-full max-w-md mx-4 p-6 relative flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()} // prevent backdrop click bubbling
    >
      {/* Close button */}
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center"
        aria-label="Tutup"
      >
        <span className="material-icons text-base" style={{ color: "#EE4266" }}>
          close
        </span>
      </button>

      {/* Icon */}
      <span className="material-icons text-[72px] leading-none" style={{ color: "#EE4266" }}>
        error
      </span>

      {/* Warning text */}
      <p id="exit-desc" className="text-center text-gray-700 text-sm leading-relaxed break-words">
        Jika kamu pindah ke halaman lain, sesi skrining ini{" "}
        <strong>tidak akan tersimpan.</strong>
      </p>

      {/* Title */}
      <h2
        id="exit-title"
        className="text-center text-[#EE4266] text-xl font-semibold tracking-tight"
      >
        Apakah kamu yakin?
      </h2>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          ref={cancelRef}
          onClick={onCancel}
          className="w-24 h-9 px-3 rounded-full outline outline-1 outline-[#EE4266] text-rose-500 text-xs font-semibold hover:bg-red-50 focus:outline-2 focus:outline-offset-2 focus:outline-[#EE4266] transition-colors"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          className="w-24 h-9 px-3 rounded-full bg-[#EE4266] outline outline-1 outline-[#EE4266] text-white text-xs font-semibold hover:bg-red-600 focus:outline-2 focus:outline-offset-2 focus:outline-[#EE4266] transition-colors"
        >
          Ya
        </button>
      </div>
    </motion.div>
  )

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => closeOnOutsideClick && onCancel?.()}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Card */}
        {card}
      </motion.div>
    </AnimatePresence>
  )
}

export default ExitConfirmationPopup
