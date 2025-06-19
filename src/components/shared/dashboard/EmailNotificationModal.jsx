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
            className="relative flex flex-col shrink-0 gap-2.5 justify-center items-center p-5 mx-auto my-0 max-w-none bg-white rounded-xl shadow-xl h-[174px] w-[386px] max-md:p-5 max-md:w-full max-md:h-auto max-md:max-w-[386px] max-md:min-h-[174px] max-sm:p-4 max-sm:mx-4 max-sm:my-0 max-sm:w-full max-sm:max-w-[350px]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="absolute top-2 right-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#488BBE] p-0"
          >
            <span className="material-icons-outlined text-[#488BBE] text-[20px] leading-none">
              cancel
            </span>
          </button>
            <div className="flex relative flex-col gap-5 items-center w-[346px] max-md:w-full max-md:max-w-[346px] max-sm:gap-4 max-sm:w-full">
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

// Komponen EmailIcon dan NotificationMessage di bawah sini biarin aja, ga perlu diubah.
const EmailIcon = () => {
  return (
    <div className="flex flex-col items-center gap-2.5 relative w-[346px] h-20">
      <motion.span
        className="material-icons-outlined text-[#488BBE]"
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
      className="relative self-stretch text-xs leading-4 text-center max-sm:text-xs max-sm:leading-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
    >
      <span className="text-xs text-zinc-500">
        {reportName} berhasil dikirim ke email{" "}
      </span>
      <span className="text-xs text-blue-500 underline">
        {userEmail}
      </span>
      <span className="text-xs text-blue-500">.</span>
    </motion.p>
  )
}

export default EmailNotificationModal