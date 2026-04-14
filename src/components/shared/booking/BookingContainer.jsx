// src/components/shared/booking/BookingContainer.jsx

import { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import BookingPage from "./BookingPage"
import BookingSession from "./BookingSession"
import TopRightControl from "../layout/TopRightControl"

const BookingContainer = ({ 
  className = "", 
  showTopRightControl = true,
  userType: propUserType, // Allow override via props
}) => {
  const { userType: urlUserType } = useParams() // Get userType from URL
  const navigate = useNavigate()
  const location = useLocation()

  // Use prop userType first, then URL parameter, then default to "student"
  const userType = propUserType || urlUserType || "student"

  // Support pre-selected method from navigation state (from BookingMethodPage)
  const initialMethod = location.state?.selectedMethod || null

  const [currentStep, setCurrentStep] = useState(() =>
    initialMethod ? "form" : "method"
  )
  const [selectedMethod, setSelectedMethod] = useState(() => initialMethod)
  const [bookingResult, setBookingResult] = useState(null)

  // Handle method selection from BookingPage
  const handleMethodSelect = (method) => {
    setSelectedMethod(method)
    setCurrentStep("form")
  }

  // Handle back navigation from BookingSession
  const handleBackToMethod = () => {
    setCurrentStep("method")
    setSelectedMethod(null)
  }

  // Handle successful booking
  const handleBookingSuccess = (result) => {
    setBookingResult(result)
    // Navigate to completion page with booking result
    navigate(`/user/${userType}/booking-complete`, {
      state: { bookingResult: result },
      replace: true,
    })
  }

  // Handle starting new booking
  const handleNewBooking = () => {
    setSelectedMethod(null)
    setBookingResult(null)
    setCurrentStep("method")
  }

  // Success component (backup - should not be used with new flow)
  const BookingSuccess = () => (
    <div className="w-full h-[810px] relative bg-white overflow-hidden flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-icons text-green-600 text-2xl">check_circle</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Berhasil!</h2>

        <p className="text-gray-600 mb-6">
          Janji konseling Anda telah berhasil dibuat. Detail akan dikirimkan ke email Anda.
        </p>

        {bookingResult && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">Detail Booking:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Jenis: </span>
                {bookingResult.methodDisplay}
              </div>
              <div>
                <span className="font-medium">Tanggal: </span>
                {bookingResult.dateTimeFormatted?.date}
              </div>
              <div>
                <span className="font-medium">Waktu: </span>
                {bookingResult.dateTimeFormatted?.time}
              </div>
              {bookingResult.psychologist && (
                <div>
                  <span className="font-medium">Psikolog: </span>
                  {bookingResult.psychologist.name}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleNewBooking}
            className="w-full bg-[#488BBA] text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Buat Booking Baru
          </button>

          <button
            onClick={() => (window.location.href = `/user/${userType}/chat`)}
            className="w-full border border-[#488BBA] text-[#488BBA] py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Lihat Riwayat Booking
          </button>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "method":
        return <BookingPage userType={userType} onMethodSelect={handleMethodSelect} />

      case "form":
        if (!selectedMethod) {
          setCurrentStep("method")
          return <BookingPage userType={userType} onMethodSelect={handleMethodSelect} />
        }
        return (
          <BookingSession
            userType={userType}
            selectedMethod={selectedMethod}
            onBack={handleBackToMethod}
            onSuccess={handleBookingSuccess}
            standalone={true}
          />
        )

      case "success":
        return <BookingSuccess />

      default:
        return <BookingPage userType={userType} onMethodSelect={handleMethodSelect} />
    }
  }

  return (
    <div className={`relative bg-white min-h-screen w-full ${className}`}>
      {/* Top Right Control */}
      {showTopRightControl && <TopRightControl isAbsolute />}

      {/* Main Content */}
      <div className="w-full">{renderCurrentStep()}</div>
    </div>
  )
}

export default BookingContainer
