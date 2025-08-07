import React from "react"
import { motion, AnimatePresence } from "framer-motion"

// Exit Confirmation Popup Component
const ExitConfirmationPopup = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main popup container - w-96 h-64 relative */}
          <div className="w-96 h-64 relative">
            {/* Background with shadow */}
            <div className="w-96 h-64 left-0 top-0 absolute bg-white rounded-[10px] shadow-[0px_6px_13px_0px_rgba(0,0,0,0.07)] shadow-[0px_23px_23px_0px_rgba(0,0,0,0.06)] shadow-[0px_52px_31px_0px_rgba(0,0,0,0.04)] shadow-[0px_93px_37px_0px_rgba(0,0,0,0.01)] shadow-[0px_146px_41px_0px_rgba(0,0,0,0.00)]" />
            
            {/* Close button background */}
            <div className="size-6 left-[342px] top-[10px] absolute bg-zinc-300 rounded" />
            
            {/* Main content container */}
            <div className="w-72 left-[72px] top-[29px] absolute inline-flex flex-col justify-center items-center gap-3.5">
              {/* Error icon using Material Icons */}
              <div className="flex items-center justify-center">
                <span 
                  className="material-icons text-[92px] leading-none"
                  style={{ color: '#EE4266' }}
                >
                  error
                </span>
              </div>
              
              {/* Warning text */}
              <div className="inline-flex justify-center items-center gap-2.5">
                <div className="text-center justify-center">
                  <span className="text-gray-700 text-xs font-normal font-['Public_Sans']">
                    Jika kamu pindah ke halaman lain, sesi skrining ini
                  </span>
                  <span className="text-gray-700 text-xs font-bold font-['Public_Sans']">
                    {" "}tidak akan tersimpan.
                  </span>
                </div>
              </div>
              
              {/* Confirmation question */}
              <div className="inline-flex justify-center items-center gap-2.5">
                <div className="text-center justify-center text-[#EE4266] text-xl font-semibold font-['Public_Sans'] leading-none">
                  Apakah kamu yakin?
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="inline-flex justify-start items-center gap-2.5">
                {/* Cancel button */}
                <button
                  onClick={onCancel}
                  className="w-20 h-7 px-1.5 py-[3px] rounded-[50px] outline outline-1 outline-offset-[-1px] outline-[#EE4266] flex justify-center items-center gap-2.5 hover:bg-red-50 transition-colors duration-200"
                >
                  <div className="justify-center text-rose-500 text-xs font-semibold font-['Public_Sans'] leading-tight">
                    Batal
                  </div>
                </button>
                
                {/* Confirm button */}
                <button
                  onClick={onConfirm}
                  className="w-20 h-7 px-1.5 py-[3px] bg-[#EE4266] rounded-[50px] outline outline-1 outline-offset-[-1px] outline-[#EE4266] flex justify-center items-center gap-2.5 hover:bg-red-600 transition-colors duration-200"
                >
                  <div className="justify-center text-white text-xs font-semibold font-['Public_Sans'] leading-tight">
                    Ya
                  </div>
                </button>
              </div>
            </div>
            
            {/* Close X button */}
            <button
              onClick={onCancel}
              className="absolute left-[342px] top-[10px] w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors duration-200"
            >
              <span 
                className="material-icons text-sm"
                style={{ color: '#EE4266' }}
              >
                close
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ExitConfirmationPopup