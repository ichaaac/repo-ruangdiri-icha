"use client"
import { motion } from "framer-motion"

const ScreeningResult = ({ result, onBackToHome, onBookingSession }) => {
  if (!result) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-6xl text-gray-400 mb-4 block">error_outline</span>
          <h2 className="text-xl font-semibold text-gray-800">Hasil tidak tersedia</h2>
        </div>
      </div>
    )
  }

  // Get status info based on assessment result
  const getStatusInfo = () => {
    const riskLevel = result.assessment?.riskLevel || "low"
    const overallRisk = result.assessment?.overallRisk || "Stabil"
    const recommendedAction = result.assessment?.recommendedAction || ""

    switch (riskLevel) {
      case "critical":
        return {
          status: "SANGAT MENGKHAWATIRKAN",
          color: "#dc2626",
          bgColor: "from-red-400 to-red-500",
          message: `Saat ini kamu dalam kondisi SANGAT MENGKHAWATIRKAN dan terdeteksi mengalami gangguan yang memerlukan perhatian segera. Kami sangat menyarankan untuk segera melakukan konseling dengan profesional. Jangan ragu untuk mencari bantuan dan dukungan dari orang-orang terdekat. ${recommendedAction}`,
        }
      case "high":
        return {
          status: "MENGKHAWATIRKAN",
          color: "#ef4444",
          bgColor: "from-orange-400 to-red-400",
          message: `Saat ini kamu dalam kondisi MENGKHAWATIRKAN dan terdeteksi mengalami gangguan yang memerlukan perhatian. Kami menyarankan untuk melakukan konseling dengan profesional untuk mendapatkan bantuan yang tepat. ${recommendedAction}`,
        }
      case "medium":
        return {
          status: "SEDANG",
          color: "#f97316",
          bgColor: "from-yellow-400 to-orange-400",
          message: `Saat ini kamu dalam kondisi SEDANG dan terdeteksi mengalami beberapa gejala yang perlu diperhatikan. Lakukan self-care, atur pola hidup yang sehat, dan pertimbangkan untuk berbicara dengan konselor jika diperlukan. ${recommendedAction}`,
        }
      case "low":
      default:
        if (overallRisk === "Ringan") {
          return {
            status: "RINGAN",
            color: "#eab308",
            bgColor: "from-emerald-400 to-green-400",
            message: `Saat ini kamu dalam kondisi RINGAN dengan beberapa gejala ringan yang terdeteksi. Tetap jaga kondisi kamu dengan cara mengatur pola makan, melakukan olahraga ringan, dan pastikan kamu mendapatkan tidur yang cukup. Lakukanlah hal-hal yang kamu sukai, dan jangan lupa beristirahat. ${recommendedAction}`,
          }
        }
        return {
          status: "STABIL",
          color: "#22c55e",
          bgColor: "from-emerald-400 to-green-400",
          message: `Saat ini kamu dalam kondisi STABIL dan tidak terdeteksi mengalami gangguan depresi, kecemasan, maupun stres. Tetap jaga kondisi kamu dengan cara mengatur pola makan, melakukan olahraga ringan, dan pastikan kamu mendapatkan tidur yang cukup. Lakukanlah hal-hal yang kamu sukai, dan jangan lupa beristirahat. ${recommendedAction}`,
        }
    }
  }

  const statusInfo = getStatusInfo()

  const handleBackToHome = () => {
    onBackToHome?.()
  }

  const handleBookingSession = () => {
    onBookingSession?.()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 md:px-8 lg:px-16">
      {/* Hero Section with Gradient and Background Image */}
      <div
        className={`w-full max-w-[1341px] h-80 relative bg-gradient-to-r ${statusInfo.bgColor} rounded-tl-[10px] rounded-tr-[10px] overflow-hidden`}
      >
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="/placeholder.svg?height=908&width=1361"
          alt="Screening result background"
        />
        <div className="absolute inset-0 bg-green-500/60 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]" />
      </div>

      {/* Main Content */}
      <motion.div
        className="w-full max-w-[985px] mt-[-100px] relative z-10 bg-white rounded-b-[10px] p-8 md:p-12 flex flex-col justify-start items-center gap-12 shadow-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Status Message */}
        <motion.div
          className="self-stretch text-base font-normal leading-relaxed text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="text-gray-700">Saat ini kamu dalam kondisi </span>
          <span className="font-bold" style={{ color: statusInfo.color }}>
            {statusInfo.status}
          </span>
          <span className="text-gray-700">
            {statusInfo.message.replace(`Saat ini kamu dalam kondisi ${statusInfo.status}`, "").trim()}
          </span>
          <span className="text-gray-700">
            {" "}
            Kamu tetap dapat mendaftarkan sesi konseling apabila kamu ingin mengembangkan diri atau memiliki
            permasalahan yang ingin diselesaikan dengan klik{" "}
          </span>
          <span className="text-[#488BBE] font-medium">booking sesi</span>
          <span className="text-gray-700"> untuk memulai konseling dengan profesional dari Ruang Diri.</span>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="inline-flex justify-center items-center gap-3.5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.button
            onClick={handleBackToHome}
            className="h-10 p-3.5 bg-white rounded-[5px] shadow-xl outline outline-1 outline-offset-[-1px] outline-[#488BBE] flex justify-center items-center gap-2.5 hover:bg-blue-50 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="justify-start text-[#488BBE] text-base font-semibold">Kembali ke Beranda</div>
          </motion.button>

          <motion.button
            onClick={handleBookingSession}
            className="w-44 h-10 p-3.5 bg-[#488BBE] rounded-[5px] shadow-xl flex justify-center items-center gap-2.5 hover:bg-[#3a7ba8] transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="justify-start text-white text-base font-semibold">Booking Sesi</div>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scores Display (Optional - can be shown in a modal or separate section) */}
      {result.assessment && (
        <motion.div
          className="absolute top-4 right-4 bg-white/90 rounded-lg p-4 shadow-lg max-w-xs"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {/* <h3 className="font-semibold text-gray-800 mb-2">Detail Skor:</h3>
          <div className="space-y-1 text-sm">
            <div>Depresi: {result.assessment.depression?.score}/42 - {result.assessment.depression?.severity}</div>
            <div>Kecemasan: {result.assessment.anxiety?.score}/42 - {result.assessment.anxiety?.severity}</div>
            <div>Stres: {result.assessment.stress?.score}/42 - {result.assessment.stress?.severity}</div>
            <div className="border-t pt-1 font-medium">
              Total: {result.assessment.totalScore}/126
            </div>
          </div> */}
        </motion.div>
      )}
    </div>
  )
}

export default ScreeningResult
