import { Link, useOutletContext } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

// ─── SVG Icons ───
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 22H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.59998 8.38086H4C3.45 8.38086 3 8.83086 3 9.38086V18.0009C3 18.5509 3.45 19.0009 4 19.0009H5.59998C6.14998 19.0009 6.59998 18.5509 6.59998 18.0009V9.38086C6.59998 8.83086 6.14998 8.38086 5.59998 8.38086Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.7999 5.18945H11.2C10.65 5.18945 10.2 5.63945 10.2 6.18945V17.9995C10.2 18.5495 10.65 18.9995 11.2 18.9995H12.7999C13.3499 18.9995 13.7999 18.5495 13.7999 17.9995V6.18945C13.7999 5.63945 13.3499 5.18945 12.7999 5.18945Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 2H18.4C17.85 2 17.4 2.45 17.4 3V18C17.4 18.55 17.85 19 18.4 19H20C20.55 19 21 18.55 21 18V3C21 2.45 20.55 2 20 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LightbulbIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Tip SVG Icons ───
const WaterSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5.83333 13.5832C7.66667 13.5832 9.16667 12.0582 9.16667 10.2082C9.16667 9.2415 8.69167 8.32484 7.74167 7.54984C6.79167 6.77484 6.075 5.62484 5.83333 4.4165C5.59167 5.62484 4.88333 6.78317 3.925 7.54984C2.96667 8.3165 2.5 9.24984 2.5 10.2082C2.5 12.0582 4 13.5832 5.83333 13.5832Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.4667 5.49993C11.0398 4.58421 11.4461 3.57414 11.6667 2.5166C12.0833 4.59993 13.3333 6.59994 15 7.93327C16.6667 9.2666 17.5 10.8499 17.5 12.5166C17.5048 13.6685 17.1674 14.7959 16.5307 15.7558C15.8939 16.7158 14.9865 17.4651 13.9235 17.9087C12.8604 18.3523 11.6895 18.4703 10.5593 18.2477C9.42912 18.0251 8.39046 17.4719 7.57501 16.6583" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const DumbbellSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M14.663 10.64a1.667 1.667 0 0 0 2.358-2.358L15.547 6.81a1.667 1.667 0 0 0 2.357-2.358l-2.357-2.356a1.667 1.667 0 1 0-2.357 2.356L11.717 2.98A1.667 1.667 0 1 0 9.36 5.337l5.303 5.303Zm-12.58 7.277L3.25 16.75m13.5-13.5 1.167-1.167M4.452 17.904a1.667 1.667 0 1 0 2.358-2.356l1.472 1.473a1.667 1.667 0 0 0 2.358-2.358L5.337 9.36a1.667 1.667 0 1 0-2.358 2.358l1.473 1.472a1.667 1.667 0 1 0-2.356 2.358l2.356 2.356ZM8 12l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MoonSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LeafSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4.167 17.5C4.583 13.75 6.25 10.833 10 9.167" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 15c5.182 0 8.75-2.74 9.167-10V3.333h-3.345c-7.5 0-9.989 3.334-10 7.5 0 .834 0 2.5 1.666 4.167H7.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const HeartSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 18.041c-.258 0-.508-.033-.717-.108C6.1 16.841 1.042 12.966 1.042 7.241c0-2.916 2.358-5.283 5.258-5.283A5.18 5.18 0 0 1 10 3.491a5.178 5.178 0 0 1 3.7-1.533c2.9 0 5.258 2.375 5.258 5.283 0 5.734-5.058 9.6-8.241 10.692a2.157 2.157 0 0 1-.717.108ZM6.3 3.208c-2.208 0-4.008 1.808-4.008 4.033 0 5.692 5.474 8.859 7.4 9.517.15.05.474.05.624 0 1.917-.658 7.4-3.817 7.4-9.517 0-2.225-1.8-4.033-4.008-4.033a3.96 3.96 0 0 0-3.2 1.617c-.233.316-.766.316-1 0A3.975 3.975 0 0 0 6.3 3.208Z" fill={color} />
  </svg>
)

const PersonSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 10.625a4.798 4.798 0 0 1-4.792-4.792A4.798 4.798 0 0 1 10 1.042a4.798 4.798 0 0 1 4.792 4.791A4.798 4.798 0 0 1 10 10.625Zm0-8.333a3.55 3.55 0 0 0-3.542 3.541A3.55 3.55 0 0 0 10 9.375a3.55 3.55 0 0 0 3.542-3.542A3.55 3.55 0 0 0 10 2.292Zm7.158 16.666a.63.63 0 0 1-.625-.625c0-2.875-2.933-5.208-6.533-5.208-3.6 0-6.533 2.333-6.533 5.208a.63.63 0 0 1-.625.625.63.63 0 0 1-.625-.625c0-3.558 3.491-6.458 7.783-6.458s7.783 2.9 7.783 6.458a.63.63 0 0 1-.625.625Z" fill={color} />
  </svg>
)

const UsersSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PeopleSvg = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="17" cy="7" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21V19C21 17.3431 19.6569 16 18 16H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Tip icon config per state
const TIP_ICONS_STABIL = [
  { Icon: LeafSvg, bg: "#E9FFF3", color: "#008236" },
  { Icon: HeartSvg, bg: "#FFEBF6", color: "#F43F5E" },
  { Icon: MoonSvg, bg: "#E9ECFF", color: "#6366F1" },
  { Icon: PeopleSvg, bg: "#E8FAFF", color: "#3B82F6" },
]

const TIP_ICONS_SEDANG = [
  { Icon: WaterSvg, bg: "#E8FAFF", color: "#3B82F6" },
  { Icon: DumbbellSvg, bg: "#E9FFF3", color: "#008236" },
  { Icon: MoonSvg, bg: "#E9ECFF", color: "#6366F1" },
  { Icon: PeopleSvg, bg: "#E8FAFF", color: "#3B82F6" },
]

const TIP_ICONS_BERISIKO = [
  { Icon: LeafSvg, bg: "#ECFDF5", color: "#16A34A" },
  { Icon: PersonSvg, bg: "#FFEBF6", color: "#F43F5E" },
  { Icon: MoonSvg, bg: "#E9ECFF", color: "#6366F1" },
  { Icon: UsersSvg, bg: "#E8FAFF", color: "#3B82F6" },
]

// ─── "Butuh Bantuan Lebih?" icon ───
const WaterDropIcon = () => (
  <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#E8FAFF" }}>
    <WaterSvg color="#3B82F6" />
  </div>
)

// ─── Result theme config by risk level ───
const RESULT_THEMES = {
  Stabil: {
    label: "Stabil",
    bannerBg: "linear-gradient(90deg, #C4FFD8 0%, #66FFB2 100%)",
    bannerText: "#007A29",
    tipsBg: "#ECFDF5",
    tipsAccent: "#059669",
    tipIcons: TIP_ICONS_STABIL,
    description: "Kondisi kesehatan mentalmu saat ini berada dalam kategori aman. Kamu mampu mengelola emosi dan aktivitas sehari-hari dengan baik. Tetap pertahankan kebiasaan positif ini ya.",
    tips: [
      "Kelola stres ringan dengan relaksasi atau hobi",
      "Luangkan waktu untuk melakukan hal yang kamu sukai",
      "Pertahankan pola tidur dan aktivitas yang teratur",
      "Tetap jaga komunikasi dengan orang terdekat",
    ],
  },
  Sedang: {
    label: "Sedang",
    bannerBg: "linear-gradient(90deg, #FFF3C4 0%, #FFD966 100%)",
    bannerText: "#7A5C00",
    tipsBg: "#FFFBEB",
    tipsAccent: "#D97706",
    tipIcons: TIP_ICONS_SEDANG,
    description: "Kondisi kesehatan mentalmu berada dalam kategori sedang. Ada beberapa hal yang dapat kamu lakukan untuk meringankan kondisi ini.",
    tips: [
      "Perbanyak minum air putih",
      "Lakukan olahraga ringan",
      "Atur pola tidur yang baik",
      "Berbagi cerita dengan orang terdekat",
    ],
  },
  Berisiko: {
    label: "Berisiko",
    bannerBg: "linear-gradient(90deg, #FFC4C5 0%, #FF6669 100%)",
    bannerText: "#7A0002",
    tipsBg: "#FFF1F2",
    tipsAccent: "#7A0002",
    tipsLabelColor: "#3F4555",
    tipIcons: TIP_ICONS_BERISIKO,
    description: "Kondisi kesehatan mentalmu saat ini berada dalam kategori berisiko. Beberapa tanda menunjukkan kamu membutuhkan perhatian dan dukungan lebih lanjut.",
    tips: [
      "Kurangi aktivitas yang memicu stres berlebihan",
      "Sangat disarankan untuk berkonsultasi dengan konselor atau profesional",
      "Istirahat yang cukup dan jaga rutinitas harian",
      "Jangan memendam perasaan, coba ceritakan ke orang yang kamu percaya",
    ],
  },
}

// Map API risk levels to 3 display states
const mapRiskLevel = (risk) => {
  if (risk === "Stabil" || risk === "Ringan") return "Stabil"
  if (risk === "Sedang") return "Sedang"
  if (risk === "Mengkhawatirkan" || risk === "Sangat Mengkhawatirkan" || risk === "Berisiko") return "Berisiko"
  return "Stabil"
}

const ScreeningResult = ({ result, onBackToHome, onBookingSession }) => {
  const { userType = "student" } = useOutletContext() || {}
  const { getUserRole } = useAuth()
  const role = userType || getUserRole()?.role || "student"

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4 text-gray-400">!</div>
          <h2 className="text-lg font-semibold text-gray-800">Hasil tidak tersedia</h2>
          <p className="text-sm text-gray-500 mt-2">Data hasil screening tidak ditemukan</p>
        </div>
      </div>
    )
  }

  const rawRisk = result.overallRisk || result.assessment?.overallRisk || "Stabil"
  const overallRisk = mapRiskLevel(rawRisk)
  const theme = RESULT_THEMES[overallRisk] || RESULT_THEMES.Stabil

  const handleBooking = () => {
    if (onBookingSession) {
      onBookingSession()
    } else {
      window.open(`/user/${role}/booking-session`, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* ═══ HEADER ═══ */}
      <div
        className="relative overflow-hidden bg-[#BBF2FF]/60"
        style={{ marginTop: -64, paddingTop: 64 }}
      >
        <svg className="pointer-events-none absolute top-0 left-0" width="532" height="300" viewBox="0 0 532 300" fill="none">
          <path d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z" fill="url(#sr_wt)" fillOpacity="0.6" />
          <defs><linearGradient id="sr_wt" x1="615" y1="-42" x2="-281.5" y2="-93" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>
        <svg className="pointer-events-none absolute right-0 bottom-0" width="930" height="300" viewBox="0 0 930 300" fill="none">
          <path d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z" fill="url(#sr_wb)" fillOpacity="0.6" />
          <defs><linearGradient id="sr_wb" x1="44" y1="1" x2="813.5" y2="352" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>

        <div className="relative z-10 px-6 lg:px-10 pt-8 pb-10">
          <nav className="flex items-center text-sm mb-6" style={{ gap: 8 }}>
            <Link to={`/user/${role}/dashboard`} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">Home</Link>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <span className="text-[#9CA3AF]">Asesmen Ruang Diri</span>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <span className="text-[#1F2937] font-semibold">Hasil Asesmen</span>
          </nav>
          <h1 className="font-bold text-[#434343] mb-3" style={{ fontSize: 28, lineHeight: "110%" }}>
            Hasil Asesmen Kesehatan Mental
          </h1>
          <p className="text-base text-[#6B7280]">
            Halaman ini digunakan untuk ringkasan kondisi kesehatan mental Anda berdasarkan jawaban skrining
          </p>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="bg-white px-6 lg:px-10 pt-8 pb-10">

        {/* ─── Result Card ─── */}
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          {/* Banner */}
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ background: theme.bannerBg, padding: "28px 24px 24px" }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: theme.bannerText }}>
              <ChartIcon />
              <span style={{ fontSize: 18, fontWeight: 400, lineHeight: "140%" }}>Hasil Skrinning Anda</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 500, lineHeight: "120%", color: theme.bannerText }}>
              {theme.label}
            </span>
          </div>

          {/* Description */}
          <div style={{ backgroundColor: "#FFFFFF", padding: "28px 32px" }}>
            <p className="text-center" style={{ fontSize: 18, fontWeight: 400, lineHeight: "160%", color: "#4B5563", margin: 0 }}>
              {theme.description}
            </p>
          </div>
        </div>

        {/* ─── Tips Card ─── */}
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          {/* Tips header */}
          <div className="flex items-center gap-3" style={{ padding: "20px 24px 16px", backgroundColor: theme.tipsBg }}>
            <span style={{ color: theme.tipsAccent }}><LightbulbIcon /></span>
            <span style={{ fontSize: 18, fontWeight: 500, color: theme.tipsLabelColor || "#6B7280" }}>Tips untuk Anda</span>
          </div>

          {/* Tips grid */}
          <div style={{ padding: "8px 24px 24px", backgroundColor: theme.tipsBg }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {theme.tips.map((tip, i) => {
                const tipIcon = theme.tipIcons[i] || theme.tipIcons[0]
                const IconComp = tipIcon.Icon
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      padding: "16px 16px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: tipIcon.bg }}>
                      <IconComp color={tipIcon.color} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#374151", lineHeight: "150%" }}>
                      {tip}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ─── Butuh Bantuan Lebih ─── */}
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 16, padding: "24px 28px", marginBottom: 8 }}>
          <div className="flex items-start gap-3 mb-3">
            <WaterDropIcon />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937", margin: "0 0 6px" }}>
                Butuh Bantuan Lebih?
              </h3>
              <p style={{ fontSize: 14, fontWeight: 400, color: "#6B7280", lineHeight: "160%", margin: 0 }}>
                Jika kamu merasa hal-hal tersebut belum cukup, kamu bisa mendapatkan bantuan yang lebih komprehensif dengan berkonsultasi bersama profesional dari Ruang Diri.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={onBackToHome}
              style={{
                height: 48,
                borderRadius: 12,
                border: "1.5px solid #E8655B",
                backgroundColor: "#FFFFFF",
                color: "#E8655B",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FEF2F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF" }}
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleBooking}
              style={{
                height: 48,
                borderRadius: 12,
                border: "none",
                backgroundColor: "#E8655B",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#D4564D" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#E8655B" }}
            >
              Booking Sesi
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ScreeningResult
