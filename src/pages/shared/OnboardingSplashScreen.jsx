"use client"

// src/pages/shared/OnboardingSplashScreen.jsx - SIMPLIFIED ANIMATIONS

import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"

function OnboardingSplashScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // SIMPLIFIED ANIMATIONS
  const pageVariants = {
    initial: {
      opacity: 0,
    },
    in: {
      opacity: 1,
    },
    out: {
      opacity: 0,
      x: -50,
    },
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
    },
  }

  return (
    <motion.main
      className="overflow-hidden font-bold bg-white"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div
        className="relative flex flex-col items-center justify-center w-full min-h-screen p-4"
        style={{ backgroundImage: "url('/onboarding-splash-bg.svg')" }}
      >
        <div className="absolute inset-0 w-full h-full bg-white bg-opacity-10" />

        <motion.section
          className="relative flex flex-col items-center justify-center w-full max-w-5xl px-4 py-8 md:px-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl font-extrabold leading-tight text-center text-[#488BBE] sm:text-5xl md:text-6xl lg:text-7xl"
            variants={itemVariants}
          >
            Selamat Datang
          </motion.h1>

          <motion.h2
            className="mt-4 text-lg font-semibold leading-tight text-center text-neutral-800 md:mt-5 lg:mt-8 sm:text-xl md:text-2xl lg:text-3xl"
            variants={itemVariants}
          >
            {user?.fullName || "Admiral Keren"}
          </motion.h2>

          <motion.img
            src="/onboarding-splash.svg"
            className="object-contain self-center w-full max-w-3xl mt-10 mb-10 drop-shadow-xl md:mt-12 md:mb-12 lg:mt-16 lg:mb-16"
            alt="Onboarding illustration"
            variants={itemVariants}
          />

          <motion.button
            className="flex items-center justify-center text-xl font-semibold text-white bg-[#488BBA] rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-[#488BBA]/30"
            style={{ width: "398px", height: "42px" }}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate("/onboarding/form")}
          >
            Mulai Sekarang
          </motion.button>
        </motion.section>
      </div>
    </motion.main>
  )
}

export default OnboardingSplashScreen
