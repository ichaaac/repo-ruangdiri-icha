import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useOutletContext, useNavigate, Link } from "react-router-dom"
import { useScreening } from "./hooks/useScreening"
import ExitConfirmationPopup from "./ExitConfirmationPopUp"

// ─── Answer option style mapping by value ───
// bg/text = default (unselected), activeBg = selected/hover solid color
const OPTION_STYLES = [
  { bg: "#CFF9E5", text: "#008236", activeBg: "#339B5E" },
  { bg: "#D4E7FF", text: "#155DFC", activeBg: "#447DFD" },
  { bg: "#FFF5CC", text: "#FE9A00", activeBg: "#FEAE33" },
  { bg: "#FEE4E6", text: "#D1293D", activeBg: "#DA5464" },
]

// ─── Info circle icon (matches Figma) ───
const InfoCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8V13" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.9946 16H12.0036" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Chevron right icon for "Selanjutnya" ───
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="pointer-events-none">
    <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Loading Screen ───
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[#E8655B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Memuat Pertanyaan...</h2>
      <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
    </div>
  </div>
)

// ─── Error Screen ───
const ErrorScreen = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
      <div className="text-5xl mb-4 text-red-500">!</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-sm text-gray-500 mb-6">{error?.message || "Gagal memuat pertanyaan skrining"}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-[#E8655B] text-white rounded-lg hover:bg-[#d4564d] transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  </div>
)

// ─── Main Assessment Component ───
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

  const { userType = "student" } = useOutletContext() || {}

  const [showExitPopup, setShowExitPopup] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [shouldBlockUnload, setShouldBlockUnload] = useState(true)

  const totalQuestions = 21
  const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100
  const selectedAnswer = answers[currentQuestion]
  const hasAnswerSelected = selectedAnswer !== null && selectedAnswer !== undefined

  // ─── Navigation protection (unchanged logic) ───
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target
      if (!target) return
      const anchor = target.closest && target.closest('a, [data-nav-to]')
      if (!anchor) return
      if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
      if (anchor.target === '_blank' || anchor.getAttribute('rel') === 'noopener' || anchor.getAttribute('download')) return
      let to = anchor.getAttribute('href') || anchor.getAttribute('data-nav-to')
      if (!to || to.startsWith('#')) return
      const origin = window.location.origin
      const isAbsolute = to.startsWith('http://') || to.startsWith('https://')
      if (isAbsolute && !to.startsWith(origin)) return
      if (isAbsolute) to = to.slice(origin.length) || '/'
      if (!to.startsWith('/')) return
      if (to === window.location.pathname) return
      e.preventDefault()
      setShowExitPopup(true)
      setPendingNavigation(() => () => navigate(to))
    }

    document.addEventListener('click', handleAnchorClick, true)

    const handlePopState = () => {
      if (allowNavigation) return
      setShowExitPopup(true)
      setPendingNavigation(() => () => {
        setAllowNavigation(true)
        window.history.back()
      })
      window.history.pushState(null, "", window.location.pathname)
    }

    window.addEventListener("popstate", handlePopState)
    window.history.pushState(null, "", window.location.pathname)

    return () => {
      document.removeEventListener('click', handleAnchorClick, true)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [allowNavigation, navigate])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!shouldBlockUnload) return
      const hasProgress = !!localStorage.getItem('screening_answers') || !!localStorage.getItem('screening_current_question')
      if (!hasProgress) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlockUnload])

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

  // ─── Handlers (unchanged logic) ───
  const handleAnswerSelect = (value) => {
    updateAnswer(currentQuestion, value)
    const savedAnswers = [...answers]
    savedAnswers[currentQuestion] = value
    localStorage.setItem("screening_answers", JSON.stringify(savedAnswers))
    localStorage.setItem("screening_current_question", currentQuestion.toString())
  }

  const handleNext = () => {
    if (!hasAnswerSelected) {
      toast.warning("Pilih jawaban terlebih dahulu", {
        description: "Kamu harus memilih salah satu jawaban untuk melanjutkan.",
      })
      return
    }
    nextQuestion()
  }

  const handlePrevious = () => {
    if (canGoBack) previousQuestion()
  }

  const handleSubmit = async () => {
    if (!hasAnswerSelected) {
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
      const submissionResult = await submitScreening()
      localStorage.removeItem("screening_answers")
      localStorage.removeItem("screening_current_question")
      toast.custom(() => (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 16,
          borderRadius: 8,
          border: "1px solid #0EAD69",
          backgroundColor: "#E7F7F0",
          maxWidth: 434,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}>
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ flexShrink: 0 }}>
            <path fill="#0EAD69" d="M8.333 0A8.336 8.336 0 0 0 0 8.333c0 4.6 3.733 8.334 8.333 8.334s8.334-3.734 8.334-8.334S12.933 0 8.333 0Zm0 15a6.676 6.676 0 0 1-6.666-6.667 6.676 6.676 0 0 1 6.666-6.666A6.676 6.676 0 0 1 15 8.333 6.676 6.676 0 0 1 8.333 15Zm3.825-10.35-5.491 5.492-2.159-2.15-1.175 1.175L6.667 12.5l6.666-6.667-1.175-1.183Z" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: "#434343" }}>
            Asesmen berhasil diselesaikan
          </span>
        </div>
      ), { position: "top-right", duration: 3000 })

      if (submissionResult) {
        onComplete?.(submissionResult)
      } else {
        toast.error("Gagal mendapatkan hasil screening")
      }
    } catch {
      toast.error("Gagal menyelesaikan screening", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      })
    }
  }

  const handleRetry = () => window.location.reload()

  const handleExitConfirm = () => {
    setShowExitPopup(false)
    localStorage.removeItem("screening_answers")
    localStorage.removeItem("screening_current_question")
    toast.info("Screening dibatalkan", {
      description: "Progress screening tidak tersimpan.",
    })

    if (pendingNavigation) {
      const go = pendingNavigation
      setPendingNavigation(null)
      setAllowNavigation(true)
      setShouldBlockUnload(false)
      go()
    } else {
      setAllowNavigation(true)
      setShouldBlockUnload(false)
      onExit?.()
    }
  }

  const handleExitCancel = () => {
    setShowExitPopup(false)
    setPendingNavigation(null)
  }

  useEffect(() => {
    const savedAnswers = localStorage.getItem("screening_answers")
    const savedQuestion = localStorage.getItem("screening_current_question")
    if (savedAnswers && savedQuestion) {
      // Progress loaded in background
    }
  }, [])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} onRetry={handleRetry} />

  const isLast = currentQuestion === 20

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* ═══ HEADER - same as other pages ═══ */}
      <div
        className="relative overflow-hidden bg-[#BBF2FF]/60"
        style={{ marginTop: -64, paddingTop: 64 }}
      >
        {/* Wave SVG - Top Left */}
        <svg className="pointer-events-none absolute top-0 left-0" width="532" height="300" viewBox="0 0 532 300" fill="none">
          <path d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z" fill="url(#sa_wt)" fillOpacity="0.6" />
          <defs><linearGradient id="sa_wt" x1="615" y1="-42" x2="-281.5" y2="-93" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>
        {/* Wave SVG - Bottom Right */}
        <svg className="pointer-events-none absolute right-0 bottom-0" width="930" height="300" viewBox="0 0 930 300" fill="none">
          <path d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z" fill="url(#sa_wb)" fillOpacity="0.6" />
          <defs><linearGradient id="sa_wb" x1="44" y1="1" x2="813.5" y2="352" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>

        {/* Header Content */}
        <div className="relative z-10 px-6 lg:px-10 pt-8 pb-10">
          <nav className="flex items-center text-sm mb-6" style={{ gap: 8 }}>
            <Link to={`/user/${userType}/dashboard`} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">Home</Link>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <span className="text-[#9CA3AF]">Asesmen Ruang Diri</span>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <span className="text-[#1F2937] font-semibold">Asesmen</span>
          </nav>
          <h1 className="font-bold text-[#434343] mb-3" style={{ fontSize: 28, lineHeight: "110%" }}>
            Asesmen Kesehatan Mental
          </h1>
          <p className="text-base text-[#6B7280]">
            Jawablah pertanyaan berikut yang paling sesuai dengan kondisi Anda dalam 2 minggu terakhir.
          </p>
        </div>
      </div>

      {/* ═══ CONTENT AREA - white page background ═══ */}
      <div className="bg-white px-6 lg:px-10 pt-6 pb-10">

        {/* ─── Progress Section ─── */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 16, fontWeight: 400, color: "#6B7280" }}>Progress</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#E8655B" }}>
            {currentQuestion + 1}/{totalQuestions}
          </span>
        </div>
        <div className="w-full overflow-hidden" style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 99, marginBottom: 24 }}>
          <motion.div
            style={{ height: "100%", backgroundColor: "#E8655B", borderRadius: 99 }}
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        {/* ─── Question Card ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {/* Question area - gray background */}
              <div style={{ backgroundColor: "#ECEEF0", padding: "24px 24px 20px" }}>
                {/* Question label */}
                <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                  <InfoCircleIcon />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1F2937" }}>
                    Pertanyaan {currentQuestion + 1}
                  </span>
                </div>

                {/* Question text */}
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    lineHeight: "130%",
                    color: "#434343",
                    margin: 0,
                  }}
                >
                  {currentQuestionData?.indonesian || currentQuestionData?.text}
                </p>
              </div>

              {/* Answer options - white background */}
              <div style={{ backgroundColor: "#FFFFFF", padding: "16px 24px 20px" }}>
                <div className="flex flex-col" style={{ gap: 12 }}>
                  {responseOptions.map((option, index) => {
                    const optStyle = OPTION_STYLES[index] || OPTION_STYLES[0]
                    const isSelected = selectedAnswer === option.value

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswerSelect(option.value)}
                        className="w-full flex items-center justify-between group"
                        style={{
                          backgroundColor: isSelected ? optStyle.activeBg : optStyle.bg,
                          border: "1px solid transparent",
                          borderRadius: 12,
                          padding: "14px 20px",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease, border 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = optStyle.activeBg
                          if (!isSelected) e.currentTarget.querySelector('[data-label]').style.color = '#FFFFFF'
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = optStyle.bg
                          if (!isSelected) e.currentTarget.querySelector('[data-label]').style.color = optStyle.text
                        }}
                      >
                        <span
                          data-label=""
                          style={{
                            color: isSelected ? "#FFFFFF" : optStyle.text,
                            fontSize: 15,
                            fontWeight: 600,
                            lineHeight: "140%",
                            transition: "color 0.2s ease",
                          }}
                        >
                          {option.indonesian || option.label}
                        </span>

                        {/* Checkbox circle */}
                        <div
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                            border: isSelected ? "none" : "1.5px solid #B5BBC4",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isSelected && (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3.5 8L6.5 11L12.5 5" stroke="#008236" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ─── Navigation ─── */}
        <div className="flex items-center justify-between" style={{ marginTop: 8, paddingBottom: 8 }}>
          {currentQuestion > 0 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center select-none transition-colors"
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "120%",
                color: "#CFD1D5",
                gap: 4,
                padding: "8px 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="pointer-events-none" style={{ transform: "rotate(180deg)" }}>
                <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sebelum
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasAnswerSelected}
              className="flex items-center select-none transition-colors disabled:cursor-not-allowed"
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "120%",
                color: isSubmitting || !hasAnswerSelected ? "#CFD1D5" : "#E8655B",
                gap: 4,
                padding: "8px 4px",
                background: "none",
                border: "none",
                cursor: isSubmitting || !hasAnswerSelected ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Mengirim..." : "Selesai"}
              <ChevronRightIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!hasAnswerSelected}
              className="flex items-center select-none transition-colors disabled:cursor-not-allowed"
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "120%",
                color: hasAnswerSelected ? "#E8655B" : "#CFD1D5",
                gap: 4,
                padding: "8px 4px",
                background: "none",
                border: "none",
                cursor: hasAnswerSelected ? "pointer" : "not-allowed",
              }}
            >
              Selanjutnya
              <ChevronRightIcon />
            </button>
          )}
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
