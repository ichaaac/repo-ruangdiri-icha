// src/components/shared/screening/ScreeningWelcomePage.jsx

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useScreening } from "./hooks/useScreening"
import ScreeningAssessment from "./ScreeningAssesment"
import ScreeningResult from "./ScreeningResult"
import ExitConfirmationPopup from "./ExitConfirmationPopUp"
import { useOutletContext, useNavigate } from "react-router-dom"

// Stage 1 Content Component
const Stage1Content = ({ onScrollDown }) => {
  return (
    <motion.div
      className="w-96 inline-flex flex-col justify-center items-end gap-7 pr-8 pb-5 max-md:w-[calc(100%-40px)] max-md:left-[20px] max-md:right-[20px] max-md:items-center"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Selamat Datang Header */}
      <motion.div
        className="self-stretch justify-start text-white text-3xl font-bold leading-tight mb-2 max-md:text-2xl"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Selamat Datang
      </motion.div>
      {/* Divider */}
      <motion.div
        className="self-stretch h-[1px] bg-white bg-opacity-50 mb-5"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      />

      <motion.div
        className="self-stretch justify-start text-white text-lg font-medium leading-tight"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <img
          src="/icon/scroll-down.svg"
          alt="Scroll down"
          className="w-10 h-12 object-contain"
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
      className="w-96 inline-flex flex-col justify-center items-end gap-7 pr-8 pb-5 max-md:w-[calc(100%-40px)] max-md:left-[20px] max-md:right-[20px] max-md:items-center"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="self-stretch justify-start text-white text-lg font-medium leading-tight"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Hasil skrining kamu tidak dapat menjadi acuan diagnosis utama. Penegakkan diagnosis hanya didapatkan dari
        profesional. Jawaban kamu akan kami gunakan secara kolektif dan anonim untuk pengembangan alat tes dan platform
        Ruang Diri. Jika kamu memahami dan menyetujui hal di atas, ceklis pernyataan di bawah ini dan silahkan klik
        tombol 'Mulai'
      </motion.div>

      <motion.div
        className="self-stretch inline-flex justify-start items-center gap-3.5 cursor-pointer"
        onClick={onAgreementChange}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
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

// Welcome View Component with Scroll Functionality
const WelcomeView = ({ onStart, onExit }) => {
  const [currentStage, setCurrentStage] = useState(1)
  const [isAgreed, setIsAgreed] = useState(false)
  const { initializeScreening, isLoading } = useScreening()
  const { sidebarExpanded } = useOutletContext() || { sidebarExpanded: false }
  
  // Scroll functionality
  const containerRef = useRef(null)
  const [isScrolling, setIsScrolling] = useState(false)

  const handleScrollDown = () => {
    setCurrentStage(2)
  }

  const handleScrollUp = () => {
    setCurrentStage(1)
  }

  // Handle scroll events
  useEffect(() => {
    const handleWheel = (e) => {
      if (isScrolling) return

      e.preventDefault()
      setIsScrolling(true)

      if (e.deltaY > 0 && currentStage === 1) {
        // Scroll down to stage 2
        setCurrentStage(2)
      } else if (e.deltaY < 0 && currentStage === 2) {
        // Scroll up to stage 1
        setCurrentStage(1)
      }

      // Reset scrolling flag after animation
      setTimeout(() => setIsScrolling(false), 500)
    }

    const handleKeyDown = (e) => {
      if (isScrolling) return

      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && currentStage === 1) {
        setCurrentStage(2)
        setIsScrolling(true)
        setTimeout(() => setIsScrolling(false), 500)
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && currentStage === 2) {
        setCurrentStage(1)
        setIsScrolling(true)
        setTimeout(() => setIsScrolling(false), 500)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentStage, isScrolling])

  const handleAgreementChange = () => {
    setIsAgreed(!isAgreed)
  }

  const handleStartAssessment = async () => {
    if (!isAgreed || isLoading) return

    try {
      await initializeScreening()
      toast.success("Screening dimulai")
      onStart?.()
    } catch (error) {
      console.error("Failed to initialize screening:", error)
      toast.error("Gagal memulai screening", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      })
    }
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen relative bg-white overflow-hidden focus:outline-none" 
      tabIndex={0}
    >
      {/* Main image container */}
      <div className="absolute left-[20px] right-[20px] top-[127px] h-[658px] rounded-[10px] overflow-hidden max-md:left-[20px] max-md:right-[20px] max-md:h-[calc(100vh-8rem)]">
        {/* Main background image */}
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="/screening-bg.png"
          alt="Screening background"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to left, rgb(3 105 161), transparent)",
          }}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute top-4 right-4 text-white text-sm font-medium opacity-70 max-md:hidden">
        {currentStage === 1 ? "Scroll ↓ untuk lanjut" : "Scroll ↑ untuk kembali"}
      </div>

      {/* Content - Stage based */}
      <AnimatePresence mode="wait">
        {currentStage === 1 ? (
          <motion.div
            key="stage1"
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="absolute right-[80px] top-[190px] max-md:top-[140px]"
          >
            <Stage1Content onScrollDown={handleScrollDown} />
          </motion.div>
        ) : (
          <motion.div
            key="stage2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute right-[80px] top-[250px] max-md:top-[180px]"
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
  const [showExitPopup, setShowExitPopup] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const navigate = useNavigate()

  // Navigation protection is handled within ScreeningAssessment now to avoid duplicate prompts
  React.useEffect(() => {
    return () => {}
  }, [currentView])

  // Handle sidebar/navigation attempts while on welcome/result view
  useEffect(() => {
    const handleAttemptNav = (e) => {
      const to = e?.detail?.to
      if (!to) return

      // If currently inside assessment view, let ScreeningAssessment handle it
      if (currentView === 'assessment') {
        return
      }

      // If there is no screening progress yet, navigate directly
      const hasProgress = !!localStorage.getItem('screening_answers') || !!localStorage.getItem('screening_current_question')
      if (!hasProgress) {
        navigate(to)
        return
      }

      // Otherwise, show exit confirmation
      setShowExitPopup(true)
      setPendingNavigation(() => () => navigate(to))
    }

    window.addEventListener('rd:attempt-navigation', handleAttemptNav)
    return () => window.removeEventListener('rd:attempt-navigation', handleAttemptNav)
  }, [navigate, currentView])

  const handleStartAssessment = () => {
    console.log("Starting assessment...")
    setCurrentView("assessment")
  }

  const handleAssessmentComplete = (result) => {
    console.log("Assessment completed with result:", result)
    
    // Ensure we have valid result data
    if (!result) {
      console.error("No result data received from assessment")
      toast.error("Gagal mendapatkan hasil screening")
      return
    }
    
    // Set the result and immediately switch to result view
    setScreeningResult(result)
    setCurrentView("result")
    console.log("Switched to result view with data:", result)
  }

  const handleAssessmentExit = () => {
    setShowExitPopup(true)
  }

  const handleExitConfirm = () => {
    setShowExitPopup(false)
    toast.info("Screening dibatalkan", {
      description: "Progress screening tidak tersimpan.",
    })
    
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    } else {
      setCurrentView("welcome")
      onExit?.()
    }
  }

  const handleExitCancel = () => {
    setShowExitPopup(false)
    setPendingNavigation(null)
    
    // Push state again for next navigation attempt
    if (currentView === "assessment") {
      window.history.pushState(null, "", window.location.pathname)
    }
  }

  const handleResultBackToHome = () => {
    // Navigate back to welcome/screening home
    setCurrentView("welcome")
    setScreeningResult(null)
    // Or call onComplete to go back to main dashboard
    // onComplete?.(screeningResult)
  }

  const handleResultBookingSession = () => {
    // Navigate to booking session with result context
    onComplete?.(screeningResult, "booking")
  }

  const renderCurrentView = () => {
    console.log("Rendering view:", currentView, "with result:", screeningResult)
    
    switch (currentView) {
      case "welcome":
        return (
          <motion.div 
            key="welcome" 
            exit={{ opacity: 0, scale: 0.98 }} 
            transition={{ duration: 0.3 }}
          >
            <WelcomeView onStart={handleStartAssessment} onExit={onExit} />
          </motion.div>
        )

      case "assessment":
        return (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <ScreeningAssessment onComplete={handleAssessmentComplete} onExit={handleAssessmentExit} />
          </motion.div>
        )

      case "result":
        if (!screeningResult) {
          console.error("No screening result available for result view")
          // Fallback to welcome if no result
          setCurrentView("welcome")
          return null
        }
        
        return (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ScreeningResult
              result={screeningResult}
              onBackToHome={handleResultBackToHome}
              onBookingSession={handleResultBookingSession}
            />
          </motion.div>
        )

      default:
        console.warn("Unknown view:", currentView)
        return (
          <motion.div key="welcome">
            <WelcomeView onStart={handleStartAssessment} onExit={onExit} />
          </motion.div>
        )
    }
  }

  return (
    <div className="w-full h-screen">
      <AnimatePresence mode="wait">{renderCurrentView()}</AnimatePresence>
      
      {/* Exit Confirmation Popup */}
      <ExitConfirmationPopup
        isOpen={showExitPopup}
        onCancel={handleExitCancel}
        onConfirm={handleExitConfirm}
      />
    </div>
  )
}

export default ScreeningWelcomePage
