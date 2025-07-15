// src/pages/shared/OnboardingSplashScreen.jsx
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

// Props 'onboardingBackground' tidak akan kita pakai lagi untuk background besar
function OnboardingSplashScreen({ imageSrc, navigatePath }) { // Hapus onboardingBackground dari props
  const navigate = useNavigate()

  // SIMPLIFIED ANIMATIONS (tetap sama)
  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0, x: -50 },
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  }

  return (
    <motion.main
      className="overflow-hidden bg-white" // Background utama halaman tetap putih
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="relative flex flex-col items-center justify-start w-full min-h-screen pb-8">
        
        {/* ✨ DIV BACKGROUND GRADIENT DIHAPUS DARI SINI ✨ */}
        {/* Kalaupun ada props onboardingBackground, tidak lagi dipakai di sini untuk background besar */}

        {/* Main illustration */}
        <motion.img
          src={imageSrc}
          className="absolute top-[20px] left-[20px] right-[20px] object-cover z-10 rounded-3xl"
          alt="Onboarding illustration"
          variants={itemVariants}
          style={{ 
            height: "444px",
            width: "calc(100% - 40px)",
          }}
        />

        {/* Content section */}
        <motion.section
          className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm md:max-w-xl lg:max-w-4xl px-4 py-8
                     mt-[460px] md:mt-[470px] lg:mt-[480px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="flex flex-col items-center gap-6 mb-12"
            variants={itemVariants}
          >
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-center max-w-xs md:max-w-md lg:max-w-4xl text-ruangdiri-gradient"
              variants={itemVariants}
              style={{ 
                fontFamily: "Public Sans",
                fontWeight: "700",
                lineHeight: "normal"
              }}
            >
              Selamat datang di Ruangdiri.id
            </motion.h1>

            <motion.p
              className="text-sm md:text-base text-center text-[#535353] max-w-xs md:max-w-md lg:max-w-4xl px-4"
              variants={itemVariants}
              style={{
                fontFamily: "Public Sans",
                fontWeight: "400",
                lineHeight: "20px"
              }}
            >
              Ruang Diri adalah platform yang berfokus pada penyediaan layanan kesehatan mental, menggabungkan keahlian di bidang teknologi 
              dan kesehatan untuk menciptakan solusi yang inovatif dan praktis.
            </motion.p>
          </motion.div>

          {/* ✨ TOMBOL KEMBALI MENGGUNAKAN BACKGROUND SOLID ✨ */}
          <motion.button
            className="flex items-center justify-center
                       bg-[#488BBE] text-white /* BACKGROUND SOLID INI YA, BUKAN TRANSPARAN */
                       rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-[#488BBE]/30
                       w-[150px] md:w-[189px] h-[40px] md:h-[42px] text-base md:text-lg lg:text-xl font-semibold"
            style={{
              fontFamily: "Public Sans",
              fontWeight: "600",
              lineHeight: "normal",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.07)",
              borderRadius: "5px"
            }}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate(navigatePath)}
          >
            Mulai Sekarang
          </motion.button>
        </motion.section>
      </div>
    </motion.main>
  )
}

export default OnboardingSplashScreen;