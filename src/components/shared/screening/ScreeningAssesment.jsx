"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useScreening } from "./hooks/useScreening"

// Question Card Component
const QuestionCard = ({ question, selectedAnswer, onAnswerSelect, responseOptions }) => {
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

      {/* Question Container */}
      <div className="self-stretch h-96 px-14 py-7 bg-white rounded-[10px] flex flex-col justify-center items-center gap-2.5 max-md:px-6 max-md:py-4 max-md:h-auto max-md:min-h-[320px]">
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

// Navigation Buttons Component (TIDAK PERLU DIUBAH)
const NavigationButtons = ({
  currentQuestion,
  canGoBack,
  canProceed,
  isLastQuestion,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
}) => {
  const showPrevious = currentQuestion > 0
  const showNext = currentQuestion < 20
  const showSelesai = currentQuestion === 20

  return (
    <div className="flex justify-center items-center gap-5 mt-8 max-md:mt-6">
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
        <p>Tombol Selesai</p> // Ganti dengan implementasi tombol selesai
      ) : (
        showNext && (
          <motion.button
            onClick={onNext}
            disabled={!canProceed}
            className="flex justify-center items-center gap-2 p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={canProceed ? { scale: 1.05 } : {}}
            whileTap={canProceed ? { scale: 0.95 } : {}}
          >
            <div
              className={`w-[26px] h-[26px] rounded-[3px] flex items-center justify-center transition-colors duration-300 ${
                canProceed ? "bg-[#488BBA]" : "bg-gray-400"
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

  // =========================================================
  // ===== PERBAIKAN DI SINI: Panggil fungsi canProceed() =====
  // =========================================================
  const canProceedValue = canProceed();
  // =========================================================


  // Handle answer selection
  const handleAnswerSelect = (value) => {
    updateAnswer(currentQuestion, value)
    const savedAnswers = [...answers]
    savedAnswers[currentQuestion] = value
    localStorage.setItem("screening_answers", JSON.stringify(savedAnswers))
    localStorage.setItem("screening_current_question", currentQuestion.toString())
  }

  // Handle next question
  const handleNext = () => {
    // Gunakan nilai boolean yang sudah dihitung
    if (!canProceedValue) {
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

  // Handle submission
  const handleSubmit = async () => {
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
      toast.success("Screening berhasil diselesaikan!")
      onComplete?.(submissionResult)
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

  // Load saved progress on mount (silently)
  useEffect(() => {
    const savedAnswers = localStorage.getItem("screening_answers")
    const savedQuestion = localStorage.getItem("screening_current_question")
    if (savedAnswers && savedQuestion) {
      // Progress loaded in background
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />
  }

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden flex items-center justify-center p-4 md:p-8">
      <div className="relative w-[1440px] h-[810px] max-w-full max-h-screen overflow-hidden flex flex-col items-center justify-center">
        <div
          className="absolute top-[127px] left-[79px] w-[1341px] h-[658px] rounded-[10px] overflow-hidden"
          style={{
            backgroundImage: "url('/screening-gradient.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute top-[181px] left-[138px] w-[1223px] flex flex-col justify-start items-center gap-7">
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
              />
            </motion.div>
          </AnimatePresence>
          <NavigationButtons
            currentQuestion={currentQuestion}
            canGoBack={canGoBack}
            canProceed={canProceedValue} // <-- Gunakan nilai boolean di sini
            isLastQuestion={isLastQuestion}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
        <div className="absolute top-[320px] left-[1319px] text-gray-600 text-xs font-normal">
          {currentQuestion + 1}/{21}
        </div>
      </div>
    </div>
  )
}

export default ScreeningAssessment