import { motion, AnimatePresence } from "framer-motion"

const EmailNotificationModal = ({ 
  isOpen, 
  onClose, 
  reportName = "Laporan", 
  entityName = "Siswa",
  userEmail = "a******@gmail.com" 
}) => {

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section 
            className="relative flex flex-col justify-center items-center p-5 bg-white rounded-xl shadow-xl w-[386px] h-[174px] max-md:w-full max-md:max-w-[386px] max-md:min-h-[174px] max-sm:mx-4 max-sm:w-full max-sm:max-w-[350px]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
          <div className="absolute top-3 right-3">
            <span
              className="material-icons-outlined text-[#488BBE] text-[24px] leading-none cursor-pointer hover:scale-110 transition-transform"
              role="button"
              aria-label="Tutup modal"
              onClick={onClose}
              style={{
                pointerEvents: 'auto', 
                display: 'inline-flex', 
              }}
            >
              cancel
            </span>
          </div>
            {/* Content */}
            <div className="flex flex-col gap-5 items-center w-full">
              <EmailIcon />
              <NotificationMessage 
                reportName={reportName}
                entityName={entityName}
                userEmail={userEmail}
              />
            </div>

          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const EmailIcon = () => {
  return (
    <div className="flex flex-col items-center">
      <motion.span
        className="material-icons-outlined text-[#9BCA61]"
        style={{ fontSize: '80px', lineHeight: '80px' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        mark_email_read
      </motion.span>
    </div>
  )
}

const NotificationMessage = ({ reportName, entityName, userEmail }) => {
  return (
    <motion.p 
      className="text-center text-zinc-500 text-xs leading-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
    >
      {reportName} berhasil dikirim ke email <span className="underline">{userEmail}</span><span className="text-blue-500">.</span>
    </motion.p>
  )
}

export default EmailNotificationModal