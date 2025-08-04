import React from "react";
import { motion } from "framer-motion";

const ScreeningResult = ({ result, onBackToHome, onBookingSession }) => {
  if (!result) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-6xl text-gray-400 mb-4 block">error_outline</span>
          <h2 className="text-xl font-semibold text-gray-800">Hasil tidak tersedia</h2>
        </div>
      </div>
    );
  }

  // Get status info based on assessment result
  const getStatusInfo = () => {
    const riskLevel = result.assessment?.riskLevel || 'low';
    const overallRisk = result.assessment?.overallRisk || 'Stabil';
    
    switch (riskLevel) {
      case 'critical':
        return {
          status: 'SANGAT MENGKHAWATIRKAN',
          color: '#dc2626',
          bgColor: 'from-red-400 to-red-500',
          message: `Saat ini kamu dalam kondisi SANGAT MENGKHAWATIRKAN dan terdeteksi mengalami gangguan yang memerlukan perhatian segera. Kami sangat menyarankan untuk segera melakukan konseling dengan profesional. Jangan ragu untuk mencari bantuan dan dukungan dari orang-orang terdekat. ${result.assessment?.recommendedAction || 'Segera hubungi konselor profesional.'}`
        };
      case 'high':
        return {
          status: 'MENGKHAWATIRKAN', 
          color: '#ef4444',
          bgColor: 'from-orange-400 to-red-400',
          message: `Saat ini kamu dalam kondisi MENGKHAWATIRKAN dan terdeteksi mengalami gangguan yang memerlukan perhatian. Kami menyarankan untuk melakukan konseling dengan profesional untuk mendapatkan bantuan yang tepat. ${result.assessment?.recommendedAction || 'Pertimbangkan untuk berkonsultasi dengan konselor.'}`
        };
      case 'medium':
        return {
          status: 'SEDANG',
          color: '#f97316', 
          bgColor: 'from-yellow-400 to-orange-400',
          message: `Saat ini kamu dalam kondisi SEDANG dan terdeteksi mengalami beberapa gejala yang perlu diperhatikan. Lakukan self-care, atur pola hidup yang sehat, dan pertimbangkan untuk berbicara dengan konselor jika diperlukan. ${result.assessment?.recommendedAction || 'Jaga kesehatan mental dengan aktivitas positif.'}`
        };
      case 'low':
      default:
        if (overallRisk === 'Ringan') {
          return {
            status: 'RINGAN',
            color: '#eab308',
            bgColor: 'from-emerald-400 to-green-400', 
            message: `Saat ini kamu dalam kondisi RINGAN dengan beberapa gejala ringan yang terdeteksi. Tetap jaga kondisi kamu dengan cara mengatur pola makan, melakukan olahraga ringan, dan pastikan kamu mendapatkan tidur yang cukup. Lakukanlah hal-hal yang kamu sukai, dan jangan lupa beristirahat. ${result.assessment?.recommendedAction || 'Pertahankan kebiasaan sehat.'}`
          };
        }
        return {
          status: 'STABIL',
          color: '#22c55e',
          bgColor: 'from-emerald-400 to-green-400',
          message: `Saat ini kamu dalam kondisi STABIL dan tidak terdeteksi mengalami gangguan depresi, kecemasan, maupun stres. Tetap jaga kondisi kamu dengan cara mengatur pola makan, melakukan olahraga ringan, dan pastikan kamu mendapatkan tidur yang cukup. Lakukanlah hal-hal yang kamu sukai, dan jangan lupa beristirahat. ${result.assessment?.recommendedAction || 'Pertahankan kebiasaan sehat Anda.'}`
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleBackToHome = () => {
    onBackToHome?.();
  };

  const handleBookingSession = () => {
    onBookingSession?.();
  };

  return (
    <div className="w-full h-screen relative bg-white overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-14 h-full left-0 top-0 absolute bg-gray-50" />
      
     

      {/* Main Content Background */}
      <div className="w-[1341px] h-[658px] left-[79px] top-[127px] absolute bg-white rounded-[10px]" />
      
      {/* Hero Section with Gradient */}
      <div className={`w-[1341px] h-80 left-[79px] top-[127px] absolute bg-gradient-to-r ${statusInfo.bgColor} rounded-tl-[10px] rounded-tr-[10px]`} />
      
      {/* Background Image */}
      <img 
        className="w-[1361px] h-[908px] left-[79px] top-[45px] absolute object-cover" 
        src="/screening-result-bg.png" 
        alt="Screening result background"
      />
      
      {/* Gradient Overlay */}
      <div className="w-[1367px] h-96 left-[64px] top-[92px] absolute bg-green-500/60 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]" />

      {/* Main Content */}
      <motion.div 
        className="w-[985px] left-[257px] top-[503px] absolute inline-flex flex-col justify-start items-center gap-12"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Status Message */}
        <motion.div 
          className="self-stretch justify-start text-base font-normal leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="text-gray-700">Saat ini kamu dalam kondisi </span>
          <span 
            className="font-bold" 
            style={{ color: statusInfo.color }}
          >
            {statusInfo.status}
          </span>
          <span className="text-gray-700">
            {statusInfo.message.replace(`kondisi ${statusInfo.status}`, '').trim()}
          </span>
          <span className="text-gray-700">
            {' '}Kamu tetap dapat mendaftarkan sesi konseling apabila kamu ingin mengembangkan diri atau memiliki permasalahan yang ingin diselesaikan dengan klik{' '}
          </span>
          <span className="text-[#488BBE] font-medium">booking sesi</span>
          <span className="text-gray-700">
            {' '}untuk memulai konseling dengan profesional dari Ruang Diri.
          </span>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="inline-flex justify-start items-center gap-3.5"
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
            <div className="justify-start text-[#488BBE] text-base font-semibold">
              Kembali ke Beranda
            </div>
          </motion.button>
          
          <motion.button
            onClick={handleBookingSession}
            className="w-44 h-10 p-3.5 bg-[#488BBE] rounded-[5px] shadow-xl flex justify-center items-center gap-2.5 hover:bg-[#3a7ba8] transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="justify-start text-white text-base font-semibold">
              Booking Sesi
            </div>
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
  );
};

export default ScreeningResult;