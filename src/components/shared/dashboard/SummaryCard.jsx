const VARIANTS = {
  blue: {
    bg: "#EAF2FF",
    iconBg: "#E6EEFF",
    iconColor: "#3B66F5",
  },
  pink: {
    bg: "#FFECEE",
    iconBg: "#FFD6DA",
    iconColor: "#F53B4A",
  },
  neutral: {
    bg: "#F1F5F9",
    iconBg: "#E6EEFF",
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
}) => {
  const v = VARIANTS[variant] || VARIANTS.blue

  return (
    <div
      className="relative flex flex-col justify-between"
      style={{
        backgroundColor: isInactive ? INACTIVE_STYLE.bg : v.bg,
        borderRadius: 12,
        padding: "24px 28px",
        height: 207,
        border: "2px solid transparent",
        boxShadow: "none",
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: isInactive ? INACTIVE_STYLE.titleColor : "#64748B",
              lineHeight: "140%",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 400,
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
            width: 56,
            height: 56,
            padding: 16,
            borderRadius: 8,
            backgroundColor: isInactive ? INACTIVE_STYLE.iconBg : v.iconBg,
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

      <div className="flex flex-col" style={{ gap: 16 }}>
        <div style={{ height: 1, backgroundColor: isInactive ? INACTIVE_STYLE.dividerColor : "#DADDE1", width: "100%" }} />
        <div className="flex justify-between items-end">
          <div className="flex flex-col" style={{ gap: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isInactive ? INACTIVE_STYLE.progressLabelColor : "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Total Progress
            </span>
            <div className="flex items-baseline" style={{ gap: 2 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 400,
                  color: isInactive ? INACTIVE_STYLE.progressColor : "#0F172B",
                  lineHeight: "120%",
                }}
              >
                {count}
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 400,
                  color: isInactive ? INACTIVE_STYLE.progressColor : "#0F172B",
                  lineHeight: "120%",
                }}
              >
                / {total}
              </span>
            </div>
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
                fontWeight: 400,
                color: isInactive ? "#9CA3AF" : "#E8655B",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline"
              }}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SummaryCard
