// src/components/shared/onboarding/OnboardingSplashScreen.jsx - FIXED VERSION

import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"

function OnboardingSplashScreen({ onContinue }) { // ✅ Accept callback prop
  const { user, getUserRole, getOrganizationType } = useAuth()

  // Determine image based on role
  const getHeroImage = () => {
    const userRole = getUserRole()
    const orgType = getOrganizationType()
    
    if (userRole === 'student') return '/onboarding-student.png'
    if (userRole === 'employee') return '/onboarding-employee.png'
    if (userRole === 'psychologist') return '/onboarding-psychologist.png'
    if (orgType) return '/onboarding-organization.png'
    
    return '/onboarding-organization.png'
  }

  const handleStartOnboarding = () => {
    const userRole = getUserRole()
    const orgType = getOrganizationType()
    
    console.log("Starting onboarding for:", { userRole, orgType })
    
    // ✅ Use callback instead of navigate
    if (onContinue) {
      onContinue()
    }
  }

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
      className="overflow-hidden bg-white"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="relative flex flex-col items-center justify-start w-full min-h-screen pb-8">
        {/* Main illustration - ROLE-BASED IMAGE */}
        <motion.img
          src={getHeroImage()}
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

          {/* Buttons - Setup + Skip */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.button
              className="flex items-center justify-center
                         bg-[#488BBA] text-white border border-[#488BBA]
                         rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-[#488BBA]/30
                         w-[150px] md:w-[189px] h-[40px] md:h-[42px] text-base md:text-lg lg:text-xl font-semibold
                         hover:bg-[#3A7699] disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={handleStartOnboarding}
            >
              Mulai Sekarang
            </motion.button>
          </motion.div>
        </motion.section>
      </div>
    </motion.main>
  )
}

export default OnboardingSplashScreen