import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useOutletContext, useNavigate } from "react-router-dom"
import { useScreening } from "./hooks/useScreening"
import ExitConfirmationPopup from "./ExitConfirmationPopUp"

// Question Card Component
const QuestionCard = ({ question, selectedAnswer, onAnswerSelect, responseOptions, currentQuestion }) => {
  return (
    <div className="w-full flex flex-col justify-start items-center gap-7 px-4 md:px-0">
      {/* Header */}
      <div className="self-stretch flex flex-col justify-start items-center gap-5">
        <div className="self-stretch text-center justify-start text-[#488BBE] text-4xl font-bold max-md:text-2xl">
          Skrining Kesehatan Mental
        </div>
        <div className="justify-start text-gray-700 text-base font-normal max-md:text-sm max-md:text-center">
          Jawablah pertanyaan berikut yang paling sesuai dengan kondisi kamu dalam 2 minggu terakhir.
        </div>
      </div>

      {/* Divider */}
      <div className="self-stretch h-0 outline outline-[0.50px] outline-offset-[-0.25px] outline-[#488BBE]"></div>

      {/* Question Container with Progress Indicator */}
      <div className="self-stretch px-14 py-7 bg-white rounded-[10px] flex flex-col justify-center items-center gap-2.5 max-md:px-6 max-md:py-4 min-h-[320px] md:h-96 relative">
        {/* Progress Indicator - now inside question container */}
        <div className="absolute top-4 right-6 text-gray-600 text-xs font-normal">
          {currentQuestion + 1}/21
        </div>

        <div className="w-full max-w-[1104px] flex flex-col justify-start items-end gap-9 max-md:gap-6">
          {/* Question Text */}
          <motion.div
            className="self-stretch inline-flex justify-start items-center gap-2.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="justify-start text-[#488BBE] text-2xl font-bold leading-relaxed max-md:text-lg max-md:leading-tight">
              {question?.indonesian || question?.text}
            </div>
          </motion.div>

          {/* Answer Options */}
          <motion.div
            className="self-stretch flex flex-col justify-start items-start gap-2.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (question?.indonesian || question?.text).length * 0.005, duration: 0.5 }}
          >
            {responseOptions.map((option, index) => (
              <motion.button
                key={option.value}
                onClick={() => onAnswerSelect(option.value)}
                className={`self-stretch h-14 p-5 bg-white rounded-[5px] outline outline-[0.50px] outline-offset-[-0.50px] ${
                  selectedAnswer === option.value ? "outline-[#488BBE]" : "outline-gray-400"
                } flex flex-col justify-between items-start hover:outline-[#488BBE] transition-all duration-200 max-md:h-12 max-md:p-3`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="inline-flex justify-start items-center gap-4">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAnswer === option.value
                          ? "bg-[#488BBE] border-[#488BBE]"
                          : "bg-gray-200 border-gray-400"
                      }`}
                    />
                  </div>
                  <div className="justify-start text-gray-700 text-base font-normal max-md:text-sm">
                    {option.indonesian || option.label}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Navigation Buttons Component
const NavigationButtons = ({
  currentQuestion,
  canGoBack,
  canProceed,
  isLastQuestion,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  selectedAnswer,
}) => {
  const showPrevious = currentQuestion > 0
  const showNext = currentQuestion < 20
  const showSelesai = currentQuestion === 20

  // Check if answer is selected for current question
  const hasAnswerSelected = selectedAnswer !== null && selectedAnswer !== undefined

  return (
    <div className="flex justify-center items-center gap-5 top-10">
      {/* Tombol Previous */}
      {showPrevious && (
        <motion.button
          onClick={onPrevious}
          disabled={!canGoBack}
          className="flex justify-center items-center gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-[26px] h-[26px] bg-[#488BBA] rounded-[3px] flex items-center justify-center">
            <span className="material-icons text-white text-lg">arrow_back</span>
          </div>
        </motion.button>
      )}

      {showSelesai ? (
        /* Tombol Selesai */
        <motion.button
          onClick={onSubmit}
          disabled={isSubmitting || !hasAnswerSelected}
          className={`flex justify-center items-center gap-2 px-6 py-3 rounded-lg transition-colors duration-300 disabled:cursor-not-allowed ${
            isSubmitting || !hasAnswerSelected
              ? "bg-[#8B8B8B] text-white opacity-50"
              : "bg-[#488BBE] text-white hover:bg-[#3a7ba8]"
          }`}
          whileHover={!isSubmitting && hasAnswerSelected ? { scale: 1.05 } : {}}
          whileTap={!isSubmitting && hasAnswerSelected ? { scale: 0.95 } : {}}
        >
          {isSubmitting ? (
            <>
              <span className="material-icons animate-spin text-lg">sync</span>
              <span>Mengirim...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-lg">check</span>
              <span>Selesai</span>
            </>
          )}
        </motion.button>
      ) : (
        /* Tombol Next */
        showNext && (
          <motion.button
            onClick={onNext}
            disabled={!canProceed || !hasAnswerSelected}
            className="flex justify-center items-center gap-2 p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={canProceed && hasAnswerSelected ? { scale: 1.05 } : {}}
            whileTap={canProceed && hasAnswerSelected ? { scale: 0.95 } : {}}
          >
            <div
              className={`w-[26px] h-[26px] rounded-[3px] flex items-center justify-center transition-colors duration-300 ${
                canProceed && hasAnswerSelected ? "bg-[#488BBA]" : "bg-[#8B8B8B]"
              }`}
            >
              <span className="material-icons text-white text-lg">arrow_forward</span>
            </div>
          </motion.button>
        )
      )}
    </div>
  )
}

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className="material-icons text-6xl text-[#488BBE] mb-4 block"
          animate={{ rotate: 360 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "linear" }}
        >
          sync
        </motion.span>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Memuat Pertanyaan...</h2>
        <p className="text-gray-600">Mohon tunggu sebentar</p>
      </motion.div>
    </div>
  )
}

// Error Screen Component
const ErrorScreen = ({ error, onRetry }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="material-icons text-6xl text-red-500 mb-4 block">error_outline</span>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Terjadi Kesalahan</h2>
        <p className="text-gray-600 mb-6">{error?.message || "Gagal memuat pertanyaan skrining"}</p>
        <motion.button
          onClick={onRetry}
          className="px-6 py-3 bg-[#488BBE] text-white rounded-lg hover:bg-[#3a7ba8] transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Coba Lagi
        </motion.button>
      </motion.div>
    </div>
  )
}

// Main Assessment Component
const ScreeningAssessment = ({ onComplete, onExit }) => {
  const navigate = useNavigate()
  const {
    currentQuestion,
    currentQuestionData,
    responseOptions,
    answers,
    isLoading,
    error,
    canProceed,
    canGoBack,
    isLastQuestion,
    updateAnswer,
    nextQuestion,
    previousQuestion,
    submitScreening,
    isSubmitting,
    isAllQuestionsAnswered,
  } = useScreening()

  // Get sidebar state from context
  const { sidebarExpanded } = useOutletContext() || { sidebarExpanded: false }

  // Exit confirmation popup state
  const [showExitPopup, setShowExitPopup] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [shouldBlockUnload, setShouldBlockUnload] = useState(true)

  // Enhanced navigation protection with popup
  useEffect(() => {
    // Intercept internal link navigations (e.g., sidebar Links) and prompt
    const handleAnchorClick = (e) => {
      const target = e.target
      if (!target) return
      const anchor = target.closest && target.closest('a, [data-nav-to]')
      if (!anchor) return
      // Ignore new tab or hash links
      // Ignore modifier/middle clicks (open in new tab/window)
      if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
      if (anchor.target === '_blank' || anchor.getAttribute('rel') === 'noopener' || anchor.getAttribute('download')) return
      let to = anchor.getAttribute('href') || anchor.getAttribute('data-nav-to')
      if (!to || to.startsWith('#')) return
      // Only block internal navigation
      const origin = window.location.origin
      const isAbsolute = to.startsWith('http://') || to.startsWith('https://')
      if (isAbsolute && !to.startsWith(origin)) return
      if (isAbsolute) to = to.slice(origin.length) || '/'
      if (!to.startsWith('/')) return
      if (to === window.location.pathname) return

      // Prevent and show popup
      e.preventDefault()
      setShowExitPopup(true)
      setPendingNavigation(() => () => navigate(to))
    }

    document.addEventListener('click', handleAnchorClick, true)

    // Handle browser back/forward attempts — block and show popup
    const handlePopState = (e) => {
      if (allowNavigation) {
        return
      }
      e.preventDefault()
      setShowExitPopup(true)
      // When confirmed, allow one back navigation
      setPendingNavigation(() => () => {
        setAllowNavigation(true)
        window.history.back()
      })
      // Re-push state to keep user on page until confirmed
      window.history.pushState(null, "", window.location.pathname)
    }

    window.addEventListener("popstate", handlePopState)
    
    // Push initial state for back button handling
    window.history.pushState(null, "", window.location.pathname)

    return () => {
      document.removeEventListener('click', handleAnchorClick, true)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [allowNavigation, navigate])

  // Native beforeunload prompt ONLY for tab close/refresh/full unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!shouldBlockUnload) return
      const hasProgress = !!localStorage.getItem('screening_answers') || !!localStorage.getItem('screening_current_question')
      if (!hasProgress) return
      e.preventDefault()
      e.returnValue = '' // trigger browser native prompt
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlockUnload])

  // Listen for cross-component navigation attempts (e.g., Sidebar, TopRightControl)
  useEffect(() => {
    const handleAttemptNav = (e) => {
      const to = e?.detail?.to
      if (!to) return
      setShowExitPopup(true)
      setPendingNavigation(() => () => navigate(to))
    }
    window.addEventListener('rd:attempt-navigation', handleAttemptNav)
    return () => window.removeEventListener('rd:attempt-navigation', handleAttemptNav)
  }, [navigate])

  // Handle answer selection
  const handleAnswerSelect = (value) => {
    updateAnswer(currentQuestion, value)

    // Save to localStorage
    const savedAnswers = [...answers]
    savedAnswers[currentQuestion] = value
    localStorage.setItem("screening_answers", JSON.stringify(savedAnswers))
    localStorage.setItem("screening_current_question", currentQuestion.toString())
  }

  // Handle next question with validation
  const handleNext = () => {
    const currentAnswer = answers[currentQuestion]
    const hasAnswer = currentAnswer !== null && currentAnswer !== undefined

    if (!hasAnswer) {
      toast.warning("Pilih jawaban terlebih dahulu", {
        description: "Kamu harus memilih salah satu jawaban untuk melanjutkan.",
      })
      return
    }

    nextQuestion()
  }

  // Handle previous question
  const handlePrevious = () => {
    if (canGoBack) {
      previousQuestion()
    }
  }

  // Handle submission with validation
  const handleSubmit = async () => {
    const currentAnswer = answers[currentQuestion]
    const hasCurrentAnswer = currentAnswer !== null && currentAnswer !== undefined

    if (!hasCurrentAnswer) {
      toast.warning("Pilih jawaban terlebih dahulu", {
        description: "Kamu harus memilih jawaban untuk pertanyaan terakhir ini.",
      })
      return
    }

    if (!isAllQuestionsAnswered()) {
      toast.warning("Lengkapi semua jawaban", {
        description: "Kamu harus menjawab semua pertanyaan untuk menyelesaikan skrining.",
      })
      return
    }

    try {
      console.log("Submitting screening with answers:", answers)
      
      // Submit screening and get result
      const submissionResult = await submitScreening()
      
      console.log("Submission successful, result:", submissionResult)

      // Clear localStorage on successful submission
      localStorage.removeItem("screening_answers")
      localStorage.removeItem("screening_current_question")

      // Show success toast briefly
      toast.success("Screening berhasil diselesaikan!")

      // Navigate to result immediately with the full result data
      if (submissionResult) {
        console.log("Calling onComplete with result:", submissionResult)
        onComplete?.(submissionResult)
      } else {
        console.error("No submission result received")
        toast.error("Gagal mendapatkan hasil screening")
      }
    } catch (error) {
      console.error("Submission failed:", error)
      toast.error("Gagal menyelesaikan screening", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      })
    }
  }

  // Handle retry on error
  const handleRetry = () => {
    window.location.reload()
  }

  // Handle exit button click
  const handleExitButtonClick = () => {
    setShowExitPopup(true)
  }

  // Handle exit confirmation
  const handleExitConfirm = () => {
    setShowExitPopup(false)
    
    // Clear any temporary data
    localStorage.removeItem("screening_answers")
    localStorage.removeItem("screening_current_question")
    
    toast.info("Screening dibatalkan", {
      description: "Progress screening tidak tersimpan.",
    })
    
    if (pendingNavigation) {
      const go = pendingNavigation
      setPendingNavigation(null)
      // If pending is history.back, allow popstate handler to pass
      setAllowNavigation(true)
      setShouldBlockUnload(false)
      go()
    } else {
      setAllowNavigation(true)
      setShouldBlockUnload(false)
      onExit?.()
    }
  }

  // Handle exit cancel
  const handleExitCancel = () => {
    setShowExitPopup(false)
    setPendingNavigation(null)
  }

  // Load saved progress on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem("screening_answers")
    const savedQuestion = localStorage.getItem("screening_current_question")

    if (savedAnswers && savedQuestion) {
      // Progress loaded in background
    }
  }, [])

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />
  }

  // Show error screen
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />
  }

  return (
    <div className="w-full h-screen relative bg-white overflow-hidden">
      {/* Background and content container */}
      <div className="absolute left-[20px] right-[20px] top-[127px] h-[658px] rounded-[10px] overflow-hidden max-md:left-[20px] max-md:right-[20px] max-md:h-[calc(100vh-8rem)]">
        {/* Background Layer with gradient */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[10px] overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 130% -38%, #D7EDFF 0%, #FFFFFF 100%)'
          }}
        >
          {/* Content positioned inside background with padding */}
          <div className="relative w-full h-full p-[54px] flex flex-col justify-start items-center gap-7 max-md:p-6">
            
            {/* Exit button */}
            {/* <button
              onClick={handleExitButtonClick}
              className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <span className="material-icons">close</span>
            </button> */}

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col justify-start items-center gap-7"
              >
                <QuestionCard
                  question={currentQuestionData}
                  selectedAnswer={answers[currentQuestion]}
                  onAnswerSelect={handleAnswerSelect}
                  responseOptions={responseOptions}
                  currentQuestion={currentQuestion}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <NavigationButtons
              currentQuestion={currentQuestion}
              canGoBack={canGoBack}
              canProceed={canProceed}
              isLastQuestion={isLastQuestion}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              selectedAnswer={answers[currentQuestion]}
            />
          </div>
        </div>
      </div>

      {/* Exit Confirmation Popup */}
      <ExitConfirmationPopup
        isOpen={showExitPopup}
        onCancel={handleExitCancel}
        onConfirm={handleExitConfirm}
      />
    </div>
  )
}

export default ScreeningAssessment
