// src/components/shared/detail/DetailComponents.jsx
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { id as indonesianLocale } from "date-fns/locale"
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from "recharts"
import { useState } from "react"

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    return format(date, "d MMMM yyyy", { locale: indonesianLocale })
  } catch (e) {
    return dateString || "-"
  }
}

const formatBirthInfo = (birthPlace, birthDate) => {
  if (!birthPlace && !birthDate) return "-"

  let result = birthPlace || ""

  if (birthDate) {
    if (result) result += ", "
    try {
      const date = new Date(birthDate)
      result += format(date, "d MMMM yyyy", { locale: indonesianLocale })
    } catch (e) {
      result += birthDate
    }
  }

  return result || "-"
}

const formatPhoneNumber = (phone) => {
  if (!phone || phone === null) return "-"

  if (!phone.startsWith("+")) {
    return phone.startsWith("0") ? `+62 ${phone.substring(1)}` : `+62 ${phone}`
  }

  return phone
}

const getIqCategoryDisplay = (category) => {
  const categories = {
    very_below_average: "Sangat Di Bawah Rata-rata",
    below_average: "Di Bawah Rata-rata",
    average: "Rata-rata",
    above_average: "Di Atas Rata-rata",
    very_above_average: "Jauh di atas Rata-rata",
    genius: "Jenius",
  }

  return categories[category] || "Belum Dikategorikan"
}

// Modal Components
export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

export const SuccessModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50"></div>
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 bg-white rounded-xl p-6 w-[320px] flex flex-col items-center"
        >
          <span className="material-icons text-green-500" style={{ fontSize: "91px" }}>
            check_circle
          </span>
          <h2 className="text-lg font-bold mt-6 text-center">{message}</h2>
        </motion.div>
      </div>
    </div>
  )
}

// Language Switcher Component
export const LanguageSwitcher = () => {
  return (
    <div className="flex items-center justify-end pr-6 pt-6 pb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#488BBE] text-sm font-medium">ID / EN</span>
        </div>
        <div className="flex items-center">
          <span className="material-icons text-[#8b8b8b] text-xl">notifications</span>
        </div>
      </div>
    </div>
  )
}

// Profile Component for Student/Employee
export const SharedProfile = ({ data, type = "student", onEdit, title, sidebarExpanded = false }) => {
  const profile = data?.studentProfile || data?.employeeProfile || data || {}

  // Student fields configuration
  const studentFields = [
    { key: "fullName", label: "Nama Lengkap", value: data?.fullName },
    {
      key: "birthInfo",
      label: "Tempat/Tanggal Lahir",
      value: formatBirthInfo(profile.birthPlace, profile.birthDate),
    },
    { key: "nis", label: "NIS", value: profile.nis },
    { key: "guardianContact", label: "Kontak Wali", value: formatPhoneNumber(profile.guardianContact) },
    {
      key: "classroom",
      label: "Kelas",
      value: profile.classroom && profile.grade ? `${profile.classroom}-${profile.grade}` : "-",
    },
    { key: "iqScore", label: "Skor IQ", value: profile.iqScore || "-" },
    {
      key: "gender",
      label: "Jenis Kelamin",
      value: profile.gender === "male" ? "Laki Laki" : profile.gender === "female" ? "Perempuan" : "-",
    },
    { key: "iqCategory", label: "Kategori", value: getIqCategoryDisplay(profile.iqCategory) },
  ]

  // Employee fields configuration
  const employeeFields = [
    { key: "fullName", label: "Nama Lengkap", value: data?.fullName },
    {
      key: "birthInfo",
      label: "Tempat/Tanggal Lahir",
      value: formatBirthInfo(profile.birthPlace, profile.birthDate),
    },
    { key: "employeeId", label: "Departemen", value: profile.department },
    {
      key: "workYears",
      label: "Lama Bekerja",
      value: profile.yearsOfService ? `${profile.yearsOfService} Tahun` : "-",
    },
    { key: "position", label: "Jabatan", value: profile.position },
    { key: "contact", label: "Kontak", value: formatPhoneNumber(profile.contact || profile.phone) },
    {
      key: "gender",
      label: "Jenis Kelamin",
      value: profile.gender === "male" ? "Laki-laki" : profile.gender === "female" ? "Perempuan" : "-",
    },
    { key: "category", label: "Kategori", value: "-" },
  ]

  const fields = type === "student" ? studentFields : employeeFields

  return (
    <motion.section
      className="flex-shrink-0 flex flex-col"
      style={{ width: "340px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-xl font-semibold leading-none text-[#488BBE] mb-6 text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {title || `Profil ${type === "student" ? "Siswa" : "Karyawan"}`}
      </motion.h1>

      {/* Profile Picture */}
      <motion.div
        className="flex justify-center lg:justify-start mb-[51px]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-sm bg-gray-100 border flex items-center justify-center">
          {data?.profilePicture ? (
            <img
              src={data.profilePicture || "/placeholder.svg"}
              alt={`${type} profile`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              <span className="material-icons text-gray-400 text-3xl">person</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Information Grid - TIDAK PAKAI TRUNCATE */}
      <div className="w-full flex-grow">
        <div className="grid grid-cols-2 gap-x-6 gap-y-[35px]">
          {fields.map((field, index) => (
            <motion.div
              key={field.key}
              className="min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <label className="text-xs leading-tight text-zinc-500 block mb-1">{field.label}</label>
              <p className="text-sm leading-tight text-neutral-600 break-words" title={field.value || "-"}>
                {field.value || "-"}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Edit Button - positioned at bottom to align with metrics chart */}
        <div className="flex justify-end mt-auto pt-[80px]">
          <motion.button
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold leading-5 text-white bg-[#488BBE] rounded-md min-h-7 w-[82px] hover:bg-[#3399E9] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Edit
          </motion.button>
        </div>
      </div>
    </motion.section>
  )
}

// Development Component
export const SharedDevelopment = ({ data, mentalHealthHistory, type = "student" }) => {
  const profile = data?.studentProfile || data?.employeeProfile || data || {}
  const fullName = data?.fullName || "Siswa"

  // State to track current month and month range
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [monthRangeStart, setMonthRangeStart] = useState(0) // 0 = Jan-Jun, 1 = Jul-Dec

  // All 12 months for metrics data
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Get notes from mental health history
  const getMonthlyNotes = () => {
    if (!mentalHealthHistory || mentalHealthHistory.length === 0) {
      return allMonths.map((_, index) => "Belum ada catatan perkembangan")
    }

    // Create a map of month to notes
    const notesMap = {}
    mentalHealthHistory.forEach((record) => {
      const date = new Date(record.date)
      const month = date.getMonth()
      if (!notesMap[month] || new Date(record.date) > new Date(notesMap[month].date)) {
        notesMap[month] = {
          date: record.date,
          notes: record.notes || "Belum ada catatan perkembangan",
        }
      }
    })

    // Fill in missing months
    return allMonths.map((_, index) => {
      return notesMap[index]?.notes || "Belum ada catatan perkembangan"
    })
  }

  const monthlyNotes = getMonthlyNotes()

  // Generate chart data from mental health history
  const generateChartData = () => {
    if (mentalHealthHistory && mentalHealthHistory.length > 0) {
      // Create a map of month to status
      const statusMap = {}
      mentalHealthHistory.forEach((record) => {
        const date = new Date(record.date)
        const month = date.getMonth()
        if (!statusMap[month] || new Date(record.date) > new Date(statusMap[month].date)) {
          statusMap[month] = {
            date: record.date,
            status: record.status,
          }
        }
      })

      // Convert status to value
      return allMonths.map((month, index) => {
        const status = statusMap[index]?.status || "stable"
        return {
          month,
          value: getStatusValue(status),
          status: status,
        }
      })
    } else {
      // Default data if no history
      const seedValues = [1, 2, 3, 2, 2, 3, 3, 2, 1, 2, 3, 3]
      const seedStatus = [
        "at_risk",
        "monitored",
        "stable",
        "monitored",
        "monitored",
        "stable",
        "stable",
        "monitored",
        "at_risk",
        "monitored",
        "stable",
        "stable",
      ]
      return allMonths.map((month, index) => ({
        month,
        value: seedValues[index],
        status: seedStatus[index],
      }))
    }
  }

  const getStatusValue = (status) => {
    const statusValues = {
      at_risk: 1,
      monitored: 2,
      stable: 3,
      not_screened: 2,
    }
    return statusValues[status] || 3
  }

  const fullYearChartData = generateChartData()
  const visibleChartData = fullYearChartData.slice(monthRangeStart * 6, monthRangeStart * 6 + 6)

  // Handle previous month click
  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1)
    } else if (monthRangeStart > 0) {
      setMonthRangeStart(0)
      setCurrentMonthIndex(5)
    }
  }

  // Handle next month click
  const handleNextMonth = () => {
    if (currentMonthIndex < 5) {
      setCurrentMonthIndex(currentMonthIndex + 1)
    } else if (monthRangeStart === 0) {
      setMonthRangeStart(1)
      setCurrentMonthIndex(0)
    }
  }

  const absoluteMonthIndex = monthRangeStart * 6 + currentMonthIndex
  const isPrevDisabled = absoluteMonthIndex === 0
  const isNextDisabled = absoluteMonthIndex === 11

  // Custom dot component with colorful dots
  const CustomDot = (props) => {
    const { cx, cy, payload, index } = props
    const isActive = index === currentMonthIndex

    const getColor = (value) => {
      if (value <= 1.5) return "#EE4266" // Berisiko - Red
      if (value <= 2.5) return "#EED142" // Pengawasan - Yellow
      return "#9BCA61" // Stabil - Green
    }

    const dotColor = getColor(payload.value)

    if (isActive) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="white" stroke={dotColor} strokeWidth={3} />
          <circle cx={cx} cy={cy} r={5} fill={dotColor} />
        </g>
      )
    }

    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="white" stroke="#3B82F6" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill={dotColor} />
      </g>
    )
  }

  return (
    <motion.section
      className="flex flex-col w-full min-w-0 max-w-[679px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Development Section */}
      <motion.h2
        className="text-xl font-semibold text-[#488BBE] mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Perkembangan {type === "student" ? "Siswa" : "Karyawan"}
      </motion.h2>

      <motion.article
        className="relative flex flex-col w-full h-[208px] text-sm leading-5 rounded-xl border border-gray-300 bg-[#FCFCFC] text-neutral-600 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Arrow Icons - Fixed position */}
        <button
          className={`absolute left-3 top-[104px] transform -translate-y-1/2 ${
            isPrevDisabled ? "text-gray-300 cursor-not-allowed" : "text-[#488BBE] cursor-pointer"
          } w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors`}
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
        >
          <span className="material-icons text-2xl">chevron_left</span>
        </button>

        <button
          className={`absolute right-3 top-[104px] transform -translate-y-1/2 ${
            isNextDisabled ? "text-gray-300 cursor-not-allowed" : "text-[#488BBE] cursor-pointer"
          } w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors`}
          onClick={handleNextMonth}
          disabled={isNextDisabled}
        >
          <span className="material-icons text-2xl">chevron_right</span>
        </button>

        {/* Content - No month label as requested */}
        <div className="px-16 flex flex-col items-center justify-center h-full py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={absoluteMonthIndex}
              className="text-center w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-base leading-relaxed">{monthlyNotes[absoluteMonthIndex]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.article>

      {/* Mental Health Chart */}
      <motion.h2
        className="text-xl font-semibold text-[#488BBE] mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Perkembangan Status Kesehatan Mental ({fullName})
      </motion.h2>

      <motion.div
        className="flex overflow-hidden w-full h-[291px] rounded-xl border border-[#535353] bg-[#FCFCFC]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Y-axis labels - Correctly positioned with proper spacing */}
        <div
          className="flex flex-col justify-between text-right w-20 px-3"
          style={{ paddingTop: "20px", paddingBottom: "72.8px" }}
        >
          <div style={{ height: "45px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <p className="font-bold text-[#9BCA61] leading-[13px] text-sm">Stabil</p>
          </div>
          <div style={{ height: "58px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <p className="font-bold text-[#EED142] leading-[13px] text-sm">Pengawasan</p>
          </div>
          <div style={{ height: "58px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <p className="font-bold text-[#EE4266] leading-[13px] text-sm">Berisiko</p>
          </div>
          <div style={{ height: "27.6px", display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <p className="text-[#828898] leading-[13px] text-sm">0</p>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex flex-col flex-1 text-center text-slate-500 min-w-0">
          <div
            className="w-full flex-1 relative"
            style={{ paddingTop: "20px", paddingBottom: "27.6px", paddingLeft: "15px", paddingRight: "15px" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <YAxis domain={[0, 4]} hide />

                {/* 5 Garis putus-putus yang benar dengan warna dan jarak yang tepat */}
                <ReferenceLine y={4} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine y={3} stroke="#9BCA61" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine y={2} stroke="#EED142" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine y={1} stroke="#EE4266" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#828898" strokeWidth={1} strokeDasharray="3 3" />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={<CustomDot />}
                  activeDot={false}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Month labels */}
          <div className="flex justify-between px-8 pb-6">
            {visibleChartData.map((data, index) => (
              <span
                key={index}
                className={`text-sm ${index === currentMonthIndex ? "text-[#488BBE] font-medium" : "text-[#828898]"}`}
              >
                {data.month}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}

// Divider Component
export const Divider = ({ sidebarExpanded = false }) => (
  <motion.div
    className="hidden lg:block shrink-0 my-auto h-[400px]"
    style={{
      background: "linear-gradient(180deg, #FFFFFF 0%, #488BBA 50%, #FFFFFF 100%)",
      width: "1px",
    }}
    initial={{ opacity: 0, scaleY: 0.8 }}
    animate={{
      opacity: 1,
      scaleY: 1,
      marginLeft: sidebarExpanded ? "20px" : "50px",
      marginRight: sidebarExpanded ? "20px" : "50px",
    }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  />
)

// Main Layout Component
export const DetailPageLayout = ({ children, sidebarExpanded = false }) => {
  return (
    <main className="bg-white min-h-screen">
      <LanguageSwitcher />

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar placeholder dengan lebar yang sesuai */}
        <motion.aside
          className="hidden lg:block flex-shrink-0"
          initial={false}
          animate={{ width: sidebarExpanded ? "200px" : "64px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {/* Content area dengan layout yang dinamis dan responsive */}
        <div className="flex-1 min-w-0">
          <motion.div
            className="flex flex-col lg:flex-row lg:items-start mt-2 pb-8 w-full"
            initial={false}
            animate={{
              paddingLeft: sidebarExpanded ? "12px" : "36px",
              paddingRight: "24px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start w-full max-w-none">{children}</div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
