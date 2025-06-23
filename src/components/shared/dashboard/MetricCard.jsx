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

  const getTextColor = () => (isInactive ? "#8B8B8B" : "#6B7280")
  const isCardClickable = !isDisabled
  const canSendReport = isActive && isReportEnabled

  const SVGDivider = () => {
    const dividerColor = getColor()
    return (
      <svg
        width="100%"
        height="2.4"
        viewBox="0 0 100 2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M0 1H100" stroke={dividerColor} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: isCardClickable ? 1.02 : 1.0 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-[156px] rounded-xl overflow-hidden ${
        isCardClickable ? "cursor-pointer" : "cursor-not-allowed"
      }`}
      style={getCardStyle()}
      onClick={isCardClickable ? onCardClick : undefined}
    >
      <div className="h-full flex flex-col py-4 px-7 sm:py-5">
        <div className="flex justify-between items-start">
          <motion.h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-none ${!isCardClickable ? "opacity-50" : ""}`}
            style={{ color: getColor() }}
          >
            {count}
          </motion.h2>

          <div
            className={`flex flex-col items-center justify-center -mr-2 transition-opacity ${
              !canSendReport ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (canSendReport) onReportClick()
            }}
          >
            <motion.span
              className="material-icons text-2xl sm:text-3xl mb-1"
              style={{ color: getColor() }}
              whileHover={canSendReport ? { scale: 1.1 } : {}}
            >
              {getCardIcon()}
            </motion.span>
            <span
              className="text-[10px] sm:text-xs font-medium text-center leading-tight"
              style={{ color: isInactive ? "#8B8B8B" : "#488BBE" }}
            >
              Kirim Laporan
            </span>
          </div>
        </div>

        <div className="flex-grow" />

        <div>
          <p className="text-xs sm:text-sm font-medium leading-tight" style={{ color: getTextColor() }}>
            {title}
          </p>
          <div className="mt-[6px] mb-[7px] w-full">
            <SVGDivider />
          </div>
          <p className="text-xs sm:text-sm font-medium leading-tight" style={{ color: getTextColor() }}>
            {count}/{total}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default MetricCard