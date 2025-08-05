"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useScreening } from "./hooks/useScreening"
import ScreeningAssessment from "./ScreeningAssesment"
import ScreeningResult from "./ScreeningResult"
import { useOutletContext } from "react-router-dom" // Import useOutletContext

// Stage 1 Content Component
const Stage1Content = ({ onScrollDown }) => {
  return (
    <motion.div
      className="w-96 inline-flex flex-col justify-center items-end gap-7 pr-8 pb-5 max-md:w-[calc(100%-40px)] max-md:left-[20px] max-md:right-[20px] max-md:items-center" // Adjusted positioning and padding
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Re-added Selamat Datang Header */}
      <motion.div
        className="self-stretch justify-start text-white text-3xl font-bold leading-tight mb-2 max-md:text-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        Selamat Datang
      </motion.div>
      {/* Re-added Divider */}
      <motion.div
        className="self-stretch h-[1px] bg-white bg-opacity-50 mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      />

      <motion.div
        className="self-stretch justify-start text-white text-lg font-medium leading-tight" // Increased font size
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Kamu akan memulai proses skrining status kesehatan mental. Skrining ini dapat membantu kamu untuk mengetahui
        gambaran besar mengenai status kesehatan mental kamu. Terdapat 21 pertanyaan dengan pilihan jawaban yang harus
        kamu pilih sesuai dengan apa yang kamu rasakan.
        <br />
        <br />
        Isi pertanyaan skrining kamu sejujur mungkin untuk mendapatkan hasil yang lebih akurat.
        <br />
        <br />
        Klik tombol 'scroll ke bawah' atau scroll secara mandiri untuk melihat tahapan selanjutnya.
      </motion.div>

      <motion.button
        onClick={onScrollDown}
        className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.img
          src="/scroll-down.png"
          alt="Scroll down"
          className="w-10 h-12 object-contain"
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
        />
        <span className="text-white text-sm font-medium text-center">Scroll{"\n"}Down</span>
      </motion.button>
    </motion.div>
  )
}

// Stage 2 Content Component
const Stage2Content = ({ isAgreed, onAgreementChange, onStart, isLoading }) => {
  return (
    <motion.div
      className="w-96 inline-flex flex-col justify-center items-end gap-7 pr-8 pb-5 max-md:w-[calc(100%-40px)] max-md:left-[20px] max-md:right-[20px] max-md:items-center" // Adjusted positioning and padding
      initial={{ opacity: 0 }} // Removed y:20 to fix animation
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="self-stretch justify-start text-white text-lg font-medium leading-tight" // Increased font size
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        Hasil skrining kamu tidak dapat menjadi acuan diagnosis utama. Penegakkan diagnosis hanya didapatkan dari
        profesional. Jawaban kamu akan kami gunakan secara kolektif dan anonim untuk pengembangan alat tes dan platform
        Ruang Diri. Jika kamu memahami dan menyetujui hal di atas, ceklis pernyataan di bawah ini dan silahkan klik
        tombol 'Mulai'
      </motion.div>

      <motion.div
        className="self-stretch inline-flex justify-start items-center gap-3.5 cursor-pointer"
        onClick={onAgreementChange}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-[21px] h-[21px] flex items-center justify-center">
          <span className="material-icons text-white text-xl">
            {isAgreed ? "check_box" : "check_box_outline_blank"}
          </span>
        </div>
        <div className="justify-start text-white text-base font-medium leading-tight">Saya setuju</div>
      </motion.div>

      <motion.button
        onClick={onStart}
        disabled={!isAgreed || isLoading}
        className={`w-32 h-9 px-5 py-2.5 rounded-[5px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] shadow-[0px_7px_7px_0px_rgba(0,0,0,0.06)] shadow-[0px_15px_9px_0px_rgba(0,0,0,0.04)] shadow-[0px_27px_11px_0px_rgba(0,0,0,0.01)] shadow-[0px_43px_12px_0px_rgba(0,0,0,0.00)] inline-flex justify-center items-center gap-2.5 transition-all duration-300 ${
          isAgreed && !isLoading
            ? "bg-white cursor-pointer hover:bg-gray-50"
            : "bg-gray-300 cursor-not-allowed opacity-60"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        whileHover={isAgreed && !isLoading ? { scale: 1.05 } : {}}
        whileTap={isAgreed && !isLoading ? { scale: 0.95 } : {}}
      >
        <div
          className={`text-center justify-start text-base font-bold leading-[74px] ${
            isAgreed && !isLoading ? "text-[#488BBE]" : "text-gray-500"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="material-icons animate-spin text-sm">sync</span>
              Loading...
            </div>
          ) : (
            "Mulai"
          )}
        </div>
      </motion.button>
    </motion.div>
  )
}

// Welcome View Component
const WelcomeView = ({ onStart, onExit }) => {
  const [currentStage, setCurrentStage] = useState(1) // 1 or 2
  const [isAgreed, setIsAgreed] = useState(false)
  const { initializeScreening, isLoading } = useScreening()
  const { sidebarExpanded } = useOutletContext() // Get sidebarExpanded from context

  const handleScrollDown = () => {
    setCurrentStage(2)
  }

  const handleAgreementChange = () => {
    setIsAgreed(!isAgreed)
  }

  const handleStartAssessment = async () => {
    if (!isAgreed || isLoading) return

    try {
      await initializeScreening()
      toast.success("Screening \n dimulai")
      onStart?.()
    } 

    catch (error) {
      console.error("Failed to initialize screening:", error)
      toast.error("Gagal memulai screening", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      })
    }
  }

  return (
    <div className="w-full h-screen relative bg-white overflow-hidden">
      {/* Main image container with padding and fixed top/height */}
      <div className="absolute left-[20px] right-[20px] top-[127px] h-[658px] rounded-[10px] overflow-hidden max-md:left-[20px] max-md:right-[20px] max-md:h-[calc(100vh-8rem)]">
        {/* Main background image */}
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="/screening-bg.png"
          alt="Screening background"
        />

        {/* Gradient overlay image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to left, rgb(3 105 161), transparent)",
          }}
        />
      </div>

      {/* Content - Stage based */}
      <AnimatePresence mode="wait">
        {currentStage === 1 ? (
          <motion.div
            key="stage1"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute right-[80px] top-[190px] max-md:top-[140px]" // Adjusted positioning
          >
            <Stage1Content onScrollDown={handleScrollDown} />
          </motion.div>
        ) : (
          <motion.div
            key="stage2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute right-[80px] top-[250px] max-md:top-[180px]" // Adjusted positioning
          >
            <Stage2Content
              isAgreed={isAgreed}
              onAgreementChange={handleAgreementChange}
              onStart={handleStartAssessment}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main Component
const ScreeningWelcomePage = ({ onComplete, onExit }) => {
  const [currentView, setCurrentView] = useState("welcome") // 'welcome', 'assessment', 'result'
  const [screeningResult, setScreeningResult] = useState(null)

  // Handle page refresh/close warning
  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentView === "assessment") {
        e.preventDefault()
        e.returnValue = "Apakah kamu yakin ingin meninggalkan halaman ini? Progress screening akan hilang."
        return e.returnValue
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && currentView === "assessment") {
        // toast.warning("Jangan tinggalkan halaman ini", {
        //   description: "Progress screening kamu akan hilang jika meninggalkan halaman.",
        // })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [currentView])

  const handleStartAssessment = () => {
    setCurrentView("assessment")
  }

  const handleAssessmentComplete = (result) => {
    console.log("Assessment completed with result:", result)
    setScreeningResult(result)
    setCurrentView("result")
  }

  const handleAssessmentExit = () => {
    toast.info("Screening dibatalkan", {
      description: "Progress screening tidak tersimpan.",
    })

    setCurrentView("welcome")
    onExit?.()
  }

  const handleResultBackToHome = () => {
    // Navigate back to home/dashboard
    onComplete?.(screeningResult)
  }

  const handleResultBookingSession = () => {
    // Navigate to booking session with result context
    onComplete?.(screeningResult, "booking")
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "welcome":
        return (
          <motion.div key="welcome" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
            <WelcomeView onStart={handleStartAssessment} onExit={onExit} />
          </motion.div>
        )

      case "assessment":
        return (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <ScreeningAssessment onComplete={handleAssessmentComplete} onExit={handleAssessmentExit} />
          </motion.div>
        )

      case "result":
        return (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ScreeningResult
              result={screeningResult}
              onBackToHome={handleResultBackToHome}
              onBookingSession={handleResultBookingSession}
            />
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-screen">
      <AnimatePresence mode="wait">{renderCurrentView()}</AnimatePresence>
    </div>
  )
}

export default ScreeningWelcomePage
