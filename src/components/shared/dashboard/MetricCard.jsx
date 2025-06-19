import { motion } from "framer-motion"

const MetricCard = ({
  title,
  count,
  total,
  icon,
  color,
  isActive,
  isDisabled = false,
  isInactive = false,
  isReportEnabled = false,
  onCardClick,
  onReportClick,
}) => {
  // --- Helper Functions ---
  const getCardIcon = () => {
    if (title.includes("Berisiko")) return "assignment_late"
    if (title.includes("Belum Skrining")) return "article"
    if (title.includes("Belum Konseling")) return "article"
    return icon
  }

  const getCardStyle = () => {
    if (isInactive) {
      return {
        background: "linear-gradient(to bottom, #F5F5F5, #E8E8E8)",
        border: "0.5px solid #C7C7C7",
        borderTop: "16px solid #8B8B8B",
      }
    }

    if (title.includes("Berisiko")) {
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

    // Fallback, although it's better to handle all cases explicitly
    return {
      background: `linear-gradient(to bottom, white, #E0E0E0)`,
      border: `0.5px solid #BDBDBD`,
      borderTop: `16px solid #9E9E9E`,
    }
  }

  const getColor = () => {
    if (isInactive) return "#8B8B8B"
    
    if (title.includes("Berisiko")) return "#ED8768"
    if (title.includes("Belum Skrining")) return "#6DC4C6"
    if (title.includes("Belum Konseling")) return "#A08CE2"
    return color
  }

  const getTextColor = () => isInactive ? "#8B8B8B" : "#6B7280"
  
  const canInteract = !isDisabled && isActive

  const SVGDivider = () => {
    const dividerColor = getColor()
    return (
      <div className="w-[400px] my-auto sm:my-3 z-10">
        <svg width="100%" height="2" viewBox="0 0 319 2" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.416504 1H318.028" stroke={dividerColor} strokeWidth="0.5"/>
        </svg>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: canInteract ? 1.02 : 1.0 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-[156px] rounded-xl overflow-hidden ${
        canInteract ? "cursor-pointer" : "cursor-not-allowed"
      }`}
      style={getCardStyle()}
      onClick={canInteract ? onCardClick : undefined}
    >
      <div className="h-full flex flex-col justify-between py-4 px-7 sm:py-5">
        <div className="flex justify-between items-start">
          <motion.h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-none ${
              !canInteract ? "opacity-50" : ""
            }`}
            style={{ color: getColor() }}
          >
            {count}
          </motion.h2>

          <div
            className={`flex flex-col items-center justify-center -mr-2 transition-opacity ${
              !isReportEnabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (isReportEnabled) onReportClick()
            }}
          >
            <motion.span
              className="material-icons text-2xl sm:text-3xl mb-1"
              style={{ color: getColor() }}
              whileHover={isReportEnabled ? { scale: 1.1 } : {}}
            >
              {getCardIcon()}
            </motion.span>
            <span 
              className="text-[10px] sm:text-xs font-medium text-center leading-tight"
              style={{ color: "#488BBE" }}
            >
              Kirim Laporan
            </span>
          </div>
        </div>
        
        <div /> 

        <div>
          <p 
            className="text-xs sm:text-sm font-medium leading-tight"
            style={{ color: getTextColor() }}
          >
            {title}
          </p>
          <SVGDivider />
          <p 
            className="text-xs sm:text-sm font-medium"
            style={{ color: getTextColor() }}
          >
            {count}/{total}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default MetricCard