  // src/components/shared/screening/ScreeningResult.jsx

  import { motion } from "framer-motion"
  import { useAuth } from "@/hooks/useAuth"

  const ScreeningResult = ({ result, onBackToHome, onBookingSession, userType }) => {
    console.log("ScreeningResult received result:", result)
    
    if (!result) {
      console.error("ScreeningResult: No result data provided")
      return (
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="material-icons text-6xl text-gray-400 mb-4 block">error_outline</span>
            <h2 className="text-xl font-semibold text-gray-800">Hasil tidak tersedia</h2>
            <p className="text-gray-600 mt-2">Data hasil screening tidak ditemukan</p>
          </div>
        </div>
      )
    }

    // Get status info based on overallRisk from API response
    const getStatusInfo = () => {
      const overallRisk = result.overallRisk || result.assessment?.overallRisk || "Stabil"

      console.log("Determining status for overallRisk:", overallRisk)

      switch (overallRisk) {
        case "Sangat Mengkhawatirkan":
          return {
            status: "SANGAT MENGKHAWATIRKAN",
            textColor: "#E82B00",
            imageFilter: "#AA000099",
            mainMessage: "Saat ini kondisi mental kamu SANGAT MENGKHAWATIRKAN. Jika kamu merasa kesulitan untuk mengatur perasaan dan respon terhadap situasi tersebut, silahkan berkonsultasi dengan tenaga ahli yang sudah kami sediakan. Kamu bisa menyampaikan keluh kesah dan menceritakan masalah yang kamu hadapi akhir-akhir ini.",
            closingMessage: "Kami sangat menyarankan kamu untuk menangani permasalahan yang kamu rasakan secara komprehensif dan terstruktur dengan klik"
          }
        case "Mengkhawatirkan":
          return {
            status: "MENGKHAWATIRKAN", 
            textColor: "#E82B00",
            imageFilter: "#AA000099",
            mainMessage: "Saat ini kondisi mental kamu MENGKHAWATIRKAN. Usahakan selalu mengonsumsi air putih dalam jumlah yang cukup, jaga pola makan kamu, dan pastikan kamu mendapatkan durasi tidur yang cukup. Jangan terlalu memaksakan diri, dan dapatkan bantuan dari tenaga ahli. Ceritakan kondisi yang mungkin membuat kamu tertekan.",
            closingMessage: "Kami sangat menyarankan kamu untuk menangani permasalahan yang kamu rasakan secara komprehensif dan terstruktur dengan klik"
          }
        case "Sedang":
          return {
            status: "SEDANG",
            textColor: "#F94B00", 
            imageFilter: "#BE954899",
            mainMessage: "Saat ini kondisi mental kamu berada dalam kategori SEDANG. Namun, ada beberapa hal yang dapat kamu lakukan untuk meringankan hal tersebut. Misalnya, banyak mengonsumsi air putih, melakukan olahraga ringan, mengatur pola makan, dan mengatur pola tidur. Jangan sampai terlalu lelah dalam bekerja, sisihkan waktu untuk beristirahat dan lakukanlah hal yang kamu sukai. Kamu juga bisa berbagi cerita dengan orang-orang disekitar kamu, atau melakukan relaksasi untuk beberapa saat.",
            closingMessage: "Tetapi apabila kamu merasa hal-hal tersebut belum cukup, kamu bisa mendapatkan bantuan yang lebih komprehensif dan terstruktur dengan klik"
          }
        case "Ringan":
          return {
            status: "RINGAN",
            textColor: "#F3AA00",
            imageFilter: "#BEB94899", 
            mainMessage: "Saat ini kondisi kesehatan mental kamu berada dalam kategori RINGAN. Namun, kamu tidak perlu khawatir, dengan melakukan beberapa hal sederhana, kamu dapat mengurangi gejala stres tersebut. Misalnya, banyak mengonsumsi air putih, melakukan olahraga ringan, mengatur pola makan, dan mengatur pola tidur.",
            closingMessage: "Kamu tetap dapat mendaftarkan sesi konseling apabila kamu ingin mengembangkan diri atau memiliki permasalahan yang ingin diselesaikan dengan klik"
          }
        case "Stabil":
        default:
          return {
            status: "STABIL",
            textColor: "#9BCA61",
            imageFilter: "#48BE4E99",
            mainMessage: "Saat ini kamu dalam kondisi STABIL dan tidak terdeteksi mengalami gangguan depresi, kecemasan, maupun stres. Tetap jaga kondisi kamu dengan cara mengatur pola makan, melakukan olahraga ringan, dan pastikan kamu mendapatkan tidur yang cukup. Lakukanlah hal-hal yang kamu sukai, dan jangan lupa beristirahat.",
            closingMessage: "Kamu tetap dapat mendaftarkan sesi konseling apabila kamu ingin mengembangkan diri atau memiliki permasalahan yang ingin diselesaikan dengan klik"
          }
      }
    }

    const statusInfo = getStatusInfo()
    console.log("Status info determined:", statusInfo)

    const handleBackToHome = () => {
      onBackToHome?.()
    }

    const { getUserRole } = useAuth()
    const role = userType || getUserRole()?.role || "student" || "employee"
    const bookingHref = `/booking-session/${role}`

 const handleBookingSession = () => {
  window.open(bookingHref, "_blank", "noopener,noreferrer")
 }

    return (
      <div className="w-full h-screen relative bg-white overflow-hidden">
        {/* Background and content container */}
        <div className="absolute left-[20px] right-[20px] top-[127px] h-[658px] rounded-[10px] overflow-hidden max-md:left-[20px] max-md:right-[20px] max-md:h-[calc(100vh-8rem)]">
          
          {/* Background container - matches Figma slice */}
          <div className="absolute left-[59px] right-[59px] top-0 h-[658px] bg-white rounded-[10px] max-md:left-[20px] max-md:right-[20px]" />
          
          {/* Gradient background for top section */}
          <div className="absolute left-[29px] right-[29px] top-0 h-80 bg-gradient-to-r from-emerald-400 to-green-400 rounded-tl-[10px] rounded-tr-[10px] max-md:left-[0px] max-md:right-[0px]" />
          
          {/* Background image - FIXED positioning and sizing */}
          <img 
            className="absolute left-[29px] right-[29px] top-0 w-[calc(100%-58px)] h-80 object-cover object-center rounded-tl-[10px] rounded-tr-[10px] max-md:left-[0px] max-md:right-[0px] max-md:w-full max-md:h-64" 
            src="/screening-result.png" 
            alt="Screening result background"
            style={{
              objectPosition: 'center center'
            }}
          />
          
          {/* Dynamic overlay filter - FIXED to match exact image position and size */}
          <div 
            className="absolute left-[29px] right-[29px] top-0 h-80 rounded-tl-[10px] rounded-tr-[10px] max-md:left-[0px] max-md:right-[0px] max-md:h-64"
            style={{ 
              backgroundColor: statusInfo.imageFilter,
              mixBlendMode: 'multiply'
            }}
          />

          {/* Main content - positioned below the image/filter area */}
          <motion.div
            className="absolute left-[89px] right-[89px] top-[360px] inline-flex flex-col justify-start items-center gap-8 max-md:left-[40px] max-md:right-[40px] max-md:top-[280px] max-md:gap-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Status message */}
            <motion.div
              className="self-stretch justify-start text-base font-normal leading-relaxed text-left max-md:text-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="text-gray-700 font-['Public_Sans'] mb-4">
                {statusInfo.mainMessage.split(statusInfo.status).map((part, index) => (
                  <span key={index}>
                    {part}
                    {index < statusInfo.mainMessage.split(statusInfo.status).length - 1 && (
                      <span 
                        className="font-bold"
                        style={{ color: statusInfo.textColor }}
                      >
                        {statusInfo.status}
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <div className="text-gray-700 font-['Public_Sans']">
                {statusInfo.closingMessage}{" "}
                <span className="text-[#488BBE] font-normal font-['Public_Sans']">
                  booking sesi
                </span>
                {" "}untuk memulai konseling dengan profesional dari Ruang Diri.
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="inline-flex justify-center items-center gap-3.5 flex-wrap max-md:flex-col max-md:gap-4 max-md:w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {/* Kembali ke Beranda button */}
              <motion.button
                onClick={handleBackToHome}
                className="h-10 px-4 py-3.5 bg-white rounded-[5px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] shadow-[0px_7px_7px_0px_rgba(0,0,0,0.06)] shadow-[0px_16px_9px_0px_rgba(0,0,0,0.04)] shadow-[0px_28px_11px_0px_rgba(0,0,0,0.01)] shadow-[0px_43px_12px_0px_rgba(0,0,0,0.00)] outline outline-1 outline-offset-[-1px] outline-[#488BBE] flex justify-center items-center gap-2.5 hover:bg-blue-50 transition-colors duration-200 max-md:w-full max-md:h-12"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="justify-start text-[#488BBE] text-base font-semibold font-['Public_Sans'] max-md:text-sm">
                  Kembali ke Beranda
                </div>
              </motion.button>

              {/* Booking Sesi button */}
              <motion.button
                onClick={handleBookingSession}
                className="w-44 h-10 px-4 py-3.5 bg-[#488BBE] rounded-[5px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)] shadow-[0px_7px_7px_0px_rgba(0,0,0,0.06)] shadow-[0px_16px_9px_0px_rgba(0,0,0,0.04)] shadow-[0px_28px_11px_0px_rgba(0,0,0,0.01)] shadow-[0px_43px_12px_0px_rgba(0,0,0,0.00)] flex justify-center items-center gap-2.5 hover:bg-[#3a7ba8] transition-colors duration-200 max-md:w-full max-md:h-12"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="justify-start text-white text-base font-semibold font-['Public_Sans'] max-md:text-sm">
                  Booking Sesi
                </div>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Optional: Debug info for development */}
        {/* {process.env.NODE_ENV === 'development' && result.assessment && (
          <motion.div
            className="absolute top-4 right-4 bg-white/90 rounded-lg p-4 shadow-lg max-w-xs max-md:top-2 max-md:right-2 max-md:p-2 max-md:text-xs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
            <div className="space-y-1 text-sm">
              <div>Overall Risk: {result.overallRisk || result.assessment?.overallRisk}</div>
              <div>Risk Level: {result.assessment?.riskLevel}</div>
              <div>Total Score: {result.assessment?.totalScore || result.totalScore}</div>
            </div>
          </motion.div>
        )} */}
      </div>
    )
  }

export default ScreeningResult