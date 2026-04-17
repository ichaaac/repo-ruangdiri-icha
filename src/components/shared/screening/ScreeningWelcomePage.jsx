// src/components/shared/screening/ScreeningWelcomePage.jsx

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useScreening } from "./hooks/useScreening"
import ScreeningAssessment from "./ScreeningAssesment"
import ScreeningResult from "./ScreeningResult"
import ExitConfirmationPopup from "./ExitConfirmationPopUp"
import { Link, useOutletContext, useNavigate, useSearchParams } from "react-router-dom"

// Stage 1 Content Component - "Selamat Datang"
const Stage1Content = ({ onScrollDown }) => {
  return (
    <motion.div
      className="flex flex-col justify-start items-start gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.h2
        className="text-white text-2xl md:text-3xl font-semibold"
        style={{ lineHeight: "140%" }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Selamat Datang
      </motion.h2>

      <motion.p
        className="text-white/80 text-sm md:text-base leading-relaxed"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        Kamu akan memulai proses asesmen status kesehatan mental. Asesmen ini
        dapat membantumu untuk mengetahui gambaran besar mengenai status
        kesehatan mentalmu.
      </motion.p>

      <motion.p
        className="text-white/80 text-sm md:text-base leading-relaxed"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Terdapat 21 pertanyaan dengan pilihan jawaban yang harus kamu pilih
        sesuai dengan apa yang kamu rasakan.
      </motion.p>

      {/* Tips Box */}
      <motion.div
        className="flex items-start gap-3 rounded-lg px-4 py-3 max-w-lg"
        style={{ backgroundColor: "rgba(255, 248, 240, 0.9)" }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
          <g clipPath="url(#clip-tips)">
            <path d="M19.21 6.35952C18.17 4.25952 16.16 2.70952 13.83 2.19952C11.39 1.65952 8.88997 2.23952 6.97997 3.77952C5.05997 5.30952 3.96997 7.59952 3.96997 10.0495C3.96997 12.6395 5.51997 15.3495 7.85997 16.9195V17.7495C7.84997 18.0295 7.83997 18.4595 8.17997 18.8095C8.52997 19.1695 9.04997 19.2095 9.45997 19.2095H14.59C15.13 19.2095 15.54 19.0595 15.82 18.7795C16.2 18.3895 16.19 17.8895 16.18 17.6195V16.9195C19.28 14.8295 21.23 10.4195 19.21 6.35952Z" fill="#FE9A00" />
            <path d="M15.2599 22.0004C15.1999 22.0004 15.1299 21.9904 15.0699 21.9704C13.0599 21.4004 10.9499 21.4004 8.93991 21.9704C8.56991 22.0704 8.17991 21.8604 8.07991 21.4904C7.96991 21.1204 8.18991 20.7304 8.55991 20.6304C10.8199 19.9904 13.1999 19.9904 15.4599 20.6304C15.8299 20.7404 16.0499 21.1204 15.9399 21.4904C15.8399 21.8004 15.5599 22.0004 15.2599 22.0004Z" fill="#FE9A00" />
          </g>
          <defs>
            <clipPath id="clip-tips"><rect width="24" height="24" fill="white" /></clipPath>
          </defs>
        </svg>
        <p className="text-sm text-gray-700 leading-relaxed">
          <span style={{ color: "#FE9A00" }} className="font-semibold">Tips:</span> Isi
          pertanyaan asesmen kamu sejujur mungkin untuk mendapatkan hasil yang
          lebih akurat.
        </p>
      </motion.div>

      {/* Scroll Down */}
      <motion.button
        onClick={onScrollDown}
        className="flex flex-col items-center gap-1 mt-2 hover:opacity-80 transition-opacity duration-300"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ transform: "rotate(180deg)" }}>
          <g clipPath="url(#clip-scroll)">
            <path d="M12 22C16.13 22 19.5 18.63 19.5 14.5V9.5C19.5 5.37 16.13 2 12 2C7.87 2 4.5 5.37 4.5 9.5V14.5C4.5 18.63 7.87 22 12 22Z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <g opacity="0.4">
              <path d="M12 11C11.17 11 10.5 10.33 10.5 9.5V7.5C10.5 6.67 11.17 6 12 6C12.82 6 13.5 6.67 13.5 7.5V9.5C13.5 10.33 12.82 11 12 11Z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 6V2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
          <defs>
            <clipPath id="clip-scroll"><rect width="24" height="24" fill="white" /></clipPath>
          </defs>
        </svg>
        <span className="text-white text-sm font-medium">Scroll Down</span>
      </motion.button>
    </motion.div>
  )
}

// Stage 2 Content Component - Consent
const Stage2Content = ({ isAgreed, onAgreementChange, onStart, isLoading }) => {
  return (
    <motion.div
      className="flex flex-col justify-start items-start gap-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Bullet points */}
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-white/60 text-xl leading-none mt-0.5">
            &#x203A;
          </span>
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            Jawaban kamu akan kami gunakan secara kolektif dan anonim untuk
            pengembangan alat tes dan platform Ruang Diri.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-white/60 text-xl leading-none mt-0.5">
            &#x203A;
          </span>
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            Hasil skrining kamu tidak dapat menjadi acuan diagnosis utama.
            Penegakkan diagnosis hanya didapatkan dari profesional.
          </p>
        </div>
      </motion.div>

      {/* Consent text */}
      <motion.p
        className="text-white/90 text-sm md:text-base leading-relaxed"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        Jika kamu memahami dan menyetujui hal di atas, ceklis pernyataan di
        bawah ini dan silahkan klik tombol &ldquo;<strong>Mulai</strong>&rdquo;
      </motion.p>

      {/* Checkbox */}
      <motion.div
        className="flex items-center gap-3 cursor-pointer"
        onClick={onAgreementChange}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#D9D9D9" }}
        >
          {isAgreed && (
            <span className="material-icons" style={{ fontSize: 18, color: "#22C55E" }}>
              check
            </span>
          )}
        </div>
        <span className="text-white text-base font-medium">Saya setuju</span>
      </motion.div>

      {/* Mulai Button */}
      <motion.button
        onClick={onStart}
        disabled={!isAgreed || isLoading}
        className="w-full h-11 flex justify-center items-center transition-all duration-300"
        style={{
          borderRadius: 12,
          backgroundColor: isAgreed && !isLoading ? "#E8655B" : "#D9D9D9",
          cursor: isAgreed && !isLoading ? "pointer" : "not-allowed",
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <span
          className="text-sm font-semibold"
          style={{
            color: isAgreed && !isLoading ? "#FFFFFF" : "#9D9D9D",
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="material-icons animate-spin text-sm">sync</span>
              Loading...
            </span>
          ) : (
            "Mulai"
          )}
        </span>
      </motion.button>
    </motion.div>
  )
}

// Helper to get title based on userType
const getAssessmentTitle = (userType) => {
  switch (userType) {
    case "student":
      return "Asesmen Siswa"
    case "employee":
      return "Asesmen Karyawan"
    default:
      return "Asesmen"
  }
}

// Welcome View Component with Header + Hero Card + Scroll
const WelcomeView = ({ onStart }) => {
  const [currentStage, setCurrentStage] = useState(1)
  const [isAgreed, setIsAgreed] = useState(false)
  const { initializeScreening, isLoading } = useScreening()
  const { userType } = useOutletContext() || { userType: "student" }

  const cardRef = useRef(null)
  const [isScrolling, setIsScrolling] = useState(false)

  const handleScrollDown = () => {
    setCurrentStage(2)
  }

  // Handle scroll events on the hero card
  useEffect(() => {
    const handleWheel = (e) => {
      if (isScrolling) return

      e.preventDefault()
      setIsScrolling(true)

      if (e.deltaY > 0 && currentStage === 1) {
        setCurrentStage(2)
      } else if (e.deltaY < 0 && currentStage === 2) {
        setCurrentStage(1)
      }

      setTimeout(() => setIsScrolling(false), 500)
    }

    const handleKeyDown = (e) => {
      if (isScrolling) return

      if (
        (e.key === "ArrowDown" || e.key === "PageDown") &&
        currentStage === 1
      ) {
        setCurrentStage(2)
        setIsScrolling(true)
        setTimeout(() => setIsScrolling(false), 500)
      } else if (
        (e.key === "ArrowUp" || e.key === "PageUp") &&
        currentStage === 2
      ) {
        setCurrentStage(1)
        setIsScrolling(true)
        setTimeout(() => setIsScrolling(false), 500)
      }
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener("wheel", handleWheel, { passive: false })
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      if (card) {
        card.removeEventListener("wheel", handleWheel)
      }
      window.removeEventListener("keydown", handleKeyDown)
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
    <div className="w-full">
      {/* ═══ HEADER SECTION (#DFF9FF) ═══ */}
      <div
        className="relative overflow-hidden bg-[#BBF2FF]/60"
        style={{ marginTop: -64, paddingTop: 64 }}
      >
        {/* Wave SVG - Top Left */}
        <svg
          className="pointer-events-none absolute top-0 left-0"
          width="532"
          height="300"
          viewBox="0 0 532 300"
          fill="none"
        >
          <path
            d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z"
            fill="url(#screening-wt)"
            fillOpacity="0.6"
          />
          <defs>
            <linearGradient
              id="screening-wt"
              x1="615"
              y1="-42"
              x2="-281.5"
              y2="-93"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="0.898" stopColor="#BBF2FF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wave SVG - Bottom Right */}
        <svg
          className="pointer-events-none absolute right-0 bottom-0"
          width="930"
          height="300"
          viewBox="0 0 930 300"
          fill="none"
        >
          <path
            d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z"
            fill="url(#screening-wb)"
            fillOpacity="0.6"
          />
          <defs>
            <linearGradient
              id="screening-wb"
              x1="44"
              y1="1"
              x2="813.5"
              y2="352"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="0.898" stopColor="#BBF2FF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Header Content */}
        <div
          className="relative z-10 px-6 lg:px-10 pt-8 pb-10"
        >
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Link
              to={`/user/${userType}/dashboard`}
              className="hover:opacity-70 transition-opacity"
              style={{
                fontSize: 14,
                color: "#6B7280",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
            <span style={{ color: "#F59E0B", fontSize: 10 }}>&#9654;</span>
            <span style={{ fontSize: 14, color: "#6B7280" }}>
              Asesmen Ruang Diri
            </span>
            <span style={{ color: "#F59E0B", fontSize: 10 }}>&#9654;</span>
            <span
              style={{ fontSize: 14, fontWeight: 500, color: "#1F2937" }}
            >
              Asesmen
            </span>
          </nav>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: "36px",
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            {getAssessmentTitle(userType)}
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#6B7280",
              lineHeight: "22px",
              margin: 0,
            }}
          >
            Halaman ini digunakan untuk memulai asesmen kesehatan mental dan
            mendapatkan dukungan konseling.
          </p>
        </div>
      </div>

      {/* ═══ HERO CARD SECTION ═══ */}
      <div style={{ padding: "24px 32px 32px" }}>
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden focus:outline-none"
          style={{ minHeight: 450 }}
          tabIndex={0}
        >
          {/* Back layer: background-assesment1.png (blurred counseling scene) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/background-assesment1.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Dark gradient overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(30,41,59,0.78) 0%, rgba(30,41,59,0.55) 40%, rgba(30,41,59,0.25) 65%, rgba(30,41,59,0.1) 85%)",
            }}
          />

          {/* Front layer: person image based on user type */}
          <img
            src={userType === "employee" ? "/onboarding-employee.png" : "/background-assesment2.png"}
            alt=""
            className="absolute right-0 bottom-0 pointer-events-none select-none max-md:opacity-30"
            style={{
              height: "100%",
              objectFit: "contain",
              objectPosition: "right bottom",
            }}
          />

          {/* Content */}
          <div
            className="relative z-10 p-6 md:p-8 flex flex-col justify-center"
            style={{ minHeight: 450 }}
          >
            <div className="max-w-[55%] max-md:max-w-full">
              <AnimatePresence mode="wait">
                {currentStage === 1 ? (
                  <motion.div
                    key="stage1"
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Stage1Content onScrollDown={handleScrollDown} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="stage2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
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
          </div>
        </div>
      </div>
    </div>
  )
}

// Map preview query param to one of the 3 display states
const mapPreviewRisk = (raw) => {
  const val = (raw || "").trim().toLowerCase()
  if (val === "stabil" || val === "ringan") return "Stabil"
  if (val === "sedang") return "Sedang"
  if (val === "mengkhawatirkan" || val === "berisiko" || val === "sangat mengkhawatirkan") return "Berisiko"
  return null
}

// Main Component
const ScreeningWelcomePage = ({ onComplete, onExit }) => {
  const [searchParams] = useSearchParams()
  const previewRisk = import.meta.env.DEV ? mapPreviewRisk(searchParams.get("preview")) : null

  const [currentView, setCurrentView] = useState(() => previewRisk ? "result" : "welcome")
  const [screeningResult, setScreeningResult] = useState(() =>
    previewRisk ? { overallRisk: previewRisk } : null
  )
  const [showExitPopup, setShowExitPopup] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const navigate = useNavigate()

  // Sync preview state when URL query param changes (e.g. user edits URL without full reload)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const mapped = mapPreviewRisk(searchParams.get("preview"))
    if (mapped) {
      setCurrentView("result")
      setScreeningResult({ overallRisk: mapped })
    }
  }, [searchParams])

  // Handle sidebar/navigation attempts while on welcome/result view
  useEffect(() => {
    const handleAttemptNav = (e) => {
      const to = e?.detail?.to
      if (!to) return

      // If currently inside assessment view, let ScreeningAssessment handle it
      if (currentView === "assessment") {
        return
      }

      // If there is no screening progress yet, navigate directly
      const hasProgress =
        !!localStorage.getItem("screening_answers") ||
        !!localStorage.getItem("screening_current_question")
      if (!hasProgress) {
        navigate(to)
        return
      }

      // Otherwise, show exit confirmation
      setShowExitPopup(true)
      setPendingNavigation(() => () => navigate(to))
    }

    window.addEventListener("rd:attempt-navigation", handleAttemptNav)
    return () =>
      window.removeEventListener("rd:attempt-navigation", handleAttemptNav)
  }, [navigate, currentView])

  const handleStartAssessment = () => {
    setCurrentView("assessment")
  }

  const handleAssessmentComplete = (result) => {
    if (!result) {
      console.error("No result data received from assessment")
      toast.error("Gagal mendapatkan hasil screening")
      return
    }

    setScreeningResult(result)
    setCurrentView("result")
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
    setCurrentView("welcome")
    setScreeningResult(null)
  }

  const handleResultBookingSession = () => {
    onComplete?.(screeningResult, "booking")
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "welcome":
        return (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeView onStart={handleStartAssessment} />
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
            <ScreeningAssessment
              onComplete={handleAssessmentComplete}
              onExit={handleAssessmentExit}
            />
          </motion.div>
        )

      case "result":
        if (!screeningResult) {
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
            <WelcomeView onStart={handleStartAssessment} />
          </motion.div>
        )
    }
  }

  return (
    <div className="w-full min-h-screen">
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
