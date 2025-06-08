"use client"

import { motion } from "framer-motion"

const MetricCard = ({
  title,
  count,
  total,
  icon,
  color,
  bgColor,
  borderColor,
  isActive,
  onCardClick,
  onReportClick,
}) => {
  const iconMap = {
    warning: "warning",
    assignment: "assignment",
    groups: "groups",
  }

  // Gradient berdasarkan jenis card
  const getCardStyle = () => {
    if (title.includes("Beresiko")) {
      return {
        background: !isActive
          ? "linear-gradient(to bottom, white, #FFEBE5)"
          : "linear-gradient(to bottom, #F5F5F5, #E5E5E5)",
        border: `0.5px solid ${!isActive ? "#FFC1AF" : "#D9D9D9"}`,
        borderTop: !isActive ? "16px solid #ED8768" : "16px solid #D9D9D9",
      }
    } else if (title.includes("Belum Skrining")) {
      return {
        background: !isActive
          ? "linear-gradient(to bottom, white, #E7FEFF)"
          : "linear-gradient(to bottom, #F5F5F5, #E5E5E5)",
        border: `0.5px solid ${!isActive ? "#B2FDFF" : "#D9D9D9"}`,
        borderTop: !isActive ? "16px solid #8CC3EE" : "16px solid #D9D9D9",
      }
    } else if (title.includes("Belum Konseling")) {
      return {
        background: !isActive
          ? "linear-gradient(to bottom, white, #F3E6FF)"
          : "linear-gradient(to bottom, #F5F5F5, #E5E5E5)",
        border: `0.5px solid ${!isActive ? "#E4C6FF" : "#D9D9D9"}`,
        borderTop: !isActive ? "16px solid #A08CE2" : "16px solid #D9D9D9",
      }
    }

    return {
      background: !isActive
        ? `linear-gradient(to bottom, white, ${bgColor})`
        : "linear-gradient(to bottom, #F5F5F5, #E5E5E5)",
      border: `0.5px solid ${!isActive ? borderColor : "#D9D9D9"}`,
      borderTop: !isActive ? `16px solid ${color}` : "16px solid #D9D9D9",
    }
  }

  return (
    <motion.div
      whileHover={{ scale: !isActive ? 1.02 : 1.0 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-[156px] rounded-xl overflow-hidden ${
        isActive ? "opacity-60" : ""
      }`}
      style={getCardStyle()}
    >
      {/* Content */}
      <div className="p-4 sm:p-5 h-full flex flex-col justify-between">
        {/* Top section - Count and Icon */}
        <div className="flex justify-between items-start">
          {/* Count number - clickable */}
          <motion.h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-none cursor-pointer`}
            style={{ color: !isActive ? color : "#D9D9D9" }}
            onClick={onCardClick}
            whileHover={!isActive ? { scale: 1.05 } : {}}
          >
            {count}
          </motion.h2>

          {/* Report section */}
          <div
            className={`flex flex-col items-center justify-center cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isActive) onReportClick()
            }}
          >
            <motion.span
              className="material-icons text-2xl sm:text-3xl mb-1"
              style={{ color: !isActive ? color : "#D9D9D9" }}
              whileHover={!isActive ? { scale: 1.1 } : {}}
            >
              {iconMap[icon]}
            </motion.span>
            <span
              className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                !isActive ? "text-zinc-600" : "text-[#D9D9D9]"
              }`}
            >
              Kirim Laporan
            </span>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex justify-between items-end">
          {/* Title */}
          <div className="flex-1 mr-2">
            <p
              className={`text-xs sm:text-sm font-medium leading-tight ${
                !isActive ? "text-zinc-600" : "text-[#D9D9D9]"
              }`}
            >
              {title}
            </p>
          </div>

          {/* Spacer to align with icon */}
          <div className="w-8 sm:w-12"></div>
        </div>

        {/* Divider line */}
        <div className="w-full h-px my-3" style={{ backgroundColor: !isActive ? color : "#D9D9D9" }}></div>

        {/* Count text */}
        <p className={`text-xs sm:text-sm font-medium ${!isActive ? "text-zinc-500" : "text-[#D9D9D9]"}`}>
          {count}/{total}
        </p>
      </div>
    </motion.div>
  )
}

export default MetricCard
