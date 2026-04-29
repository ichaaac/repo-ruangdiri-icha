const VARIANTS = {
  blue: {
    bg: "#EAF2FF",
    iconBg: "#E6EEFF",
    iconColor: "#3B66F5",
  },
  pink: {
    bg: "#FFECEE",
    iconBg: "#FFE4E7",
    iconColor: "#F53B4A",
  },
  neutral: {
    bg: "#F1F5F9",
    iconBg: "#EAF2FF",
    iconColor: "#3B66F5",
  },
}

const INACTIVE_STYLE = {
  bg: "#F3F4F6",
  iconBg: "#E5E7EB",
  iconColor: "#9CA3AF",
  titleColor: "#9CA3AF",
  countColor: "#9CA3AF",
  progressLabelColor: "#D1D5DB",
  progressColor: "#9CA3AF",
  dividerColor: "#E5E7EB",
}

const SummaryCard = ({
  title,
  count,
  total,
  icon,
  variant = "blue",
  isActive = false,
  isInactive = false,
  onLihatLaporan,
  actionLabel = "Lihat Laporan",
  progressLabel = "Total Progress",
}) => {
  const v = VARIANTS[variant] || VARIANTS.blue

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: isInactive ? INACTIVE_STYLE.bg : v.bg,
        borderRadius: 12,
        padding: "24px 28px",
        gap: 24,
      }}
    >
      {/* Top: title + count + icon */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col" style={{ gap: 7 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: isInactive ? INACTIVE_STYLE.titleColor : "#3F4555",
              lineHeight: "140%",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: isInactive ? INACTIVE_STYLE.countColor : "#0F172B",
              lineHeight: "120%",
            }}
          >
            {count}
          </span>
        </div>
        <div
          className="flex items-center justify-center"
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: isInactive ? INACTIVE_STYLE.iconBg : v.iconBg,
            flexShrink: 0,
          }}
        >
          <span
            className="material-icons-outlined"
            style={{ color: isInactive ? INACTIVE_STYLE.iconColor : v.iconColor, fontSize: 24 }}
          >
            {icon}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: isInactive ? INACTIVE_STYLE.dividerColor : "#DADDE1", width: "100%" }} />

      {/* Bottom: progress label + count/total + lihat laporan */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col" style={{ gap: 7 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: isInactive ? INACTIVE_STYLE.progressLabelColor : "#3F4555",
              lineHeight: "140%",
            }}
          >
            {progressLabel}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: isInactive ? INACTIVE_STYLE.progressColor : "#0F172B",
              lineHeight: "140%",
            }}
          >
            {count} / {total}
          </span>
        </div>
        {onLihatLaporan && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onLihatLaporan()
            }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isInactive ? "#9CA3AF" : "#E8655B",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default SummaryCard
