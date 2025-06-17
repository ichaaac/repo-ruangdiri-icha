// src/components/shared/dashboard/MetricCard.jsx

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
  isDisabled = false,
  isInactive = false,
  onCardClick,
  onReportClick,
}) => {
  const iconMap = {
    warning: "warning",
    assignment: "assignment",
    groups: "groups",
  }

  const getCardStyle = () => {
    if (isInactive) {
      return {
        background: "linear-gradient(to bottom, #F5F5F5, #E8E8E8)",
        border: "0.5px solid #C7C7C7",
        borderTop: "16px solid #8B8B8B",
      }
    }

    if (title.includes("Beresiko")) {
      return {
        background: "linear-gradient(to bottom, white, #FFEBE5)",
        border: "0.5px solid #FFC1AF",
        borderTop: "16px solid #ED8768",
      }
    } else if (title.includes("Belum Skrining")) {
      return {
        background: "linear-gradient(to bottom, white, #DFF8F9)",
        border: "0.5px solid #A4E5E7",
        borderTop: "16px solid #6DC4C6",
      }
    } else if (title.includes("Belum Konseling")) {
      return {
        background: "linear-gradient(to bottom, white, #F3E6FF)",
        border: "0.5px solid #E4C6FF",
        borderTop: "16px solid #A08CE2",
      }
    }

    return {
      background: `linear-gradient(to bottom, white, ${bgColor})`,
      border: `0.5px solid ${borderColor}`,
      borderTop: `16px solid ${color}`,
    }
  }

  const getColor = () => {
    if (isInactive) return "#8B8B8B"
    
    if (title.includes("Beresiko")) return "#ED8768"
    if (title.includes("Belum Skrining")) return "#6DC4C6"
    if (title.includes("Belum Konseling")) return "#C194E9"
    return color
  }

  const getTextColor = () => isInactive ? "#8B8B8B" : "#6B7280"

  const canInteract = !isDisabled

  return (
    <motion.div
      whileHover={{ scale: canInteract ? 1.02 : 1.0 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-[156px] rounded-xl overflow-hidden ${
        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      style={getCardStyle()}
    >
      <div className="p-4 sm:p-5 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <motion.h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-none ${
              isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            style={{ color: getColor() }}
            onClick={isDisabled ? undefined : onCardClick}
            whileHover={canInteract ? { scale: 1.05 } : {}}
          >
            {count}
          </motion.h2>

          <div
            className={`flex flex-col items-center justify-center ${
              isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isDisabled) onReportClick()
            }}
          >
            <motion.span
              className="material-icons text-2xl sm:text-3xl mb-1"
              style={{ color: getColor() }}
              whileHover={canInteract ? { scale: 1.1 } : {}}
            >
              {iconMap[icon]}
            </motion.span>
            <span 
              className="text-[10px] sm:text-xs font-medium text-center leading-tight"
              style={{ color: getColor() }}
            >
              Kirim Laporan
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex-1 mr-2">
            <p 
              className="text-xs sm:text-sm font-medium leading-tight"
              style={{ color: getTextColor() }}
            >
              {title}
            </p>
          </div>
          <div className="w-8 sm:w-12"></div>
        </div>

        <div
          className="mx-auto h-[2px] my-2 sm:my-3 rounded-full z-10"
          style={{
            width: "calc(100% - 13px)",
            backgroundColor: getColor(),
            maxWidth: "317px",
          }}
        />

        <p 
          className="text-xs sm:text-sm font-medium"
          style={{ color: getTextColor() }}
        >
          {count}/{total}
        </p>
      </div>
    </motion.div>
  )
}

export default MetricCard