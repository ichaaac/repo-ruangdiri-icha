// src/components/shared/detail/DetailComponents.jsx - Fixed Responsive with Figma-matched Chart

import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { id as indonesianLocale } from "date-fns/locale"
import { LineChart, Line, YAxis, XAxis, ResponsiveContainer, CartesianGrid, Text, ReferenceLine } from "recharts" // Diimpor komponen recharts baru
import { useState } from "react"
import TopRightControl from "../layout/TopRightControl"

// Helper functions (Tidak ada perubahan)
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
      const date = new
      Date(birthDate)
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

// Modal Components (Tidak ada perubahan)
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



// Profile Component - Responsive (Tidak ada perubahan)
export const SharedProfile = ({ data, type = "student", onEdit, title, sidebarExpanded = false }) => {
  const profile = data?.studentProfile || data?.employeeProfile || {}

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
      value: profile.gender === "male" ? "Laki-laki" : profile.gender === "female" ? "Perempuan" : "-",
    },
    { key: "iqCategory", label: "Kategori", value: getIqCategoryDisplay(profile.iqCategory) },
  ]

  const employeeFields = [
    { key: "fullName", label: "Nama Lengkap", value: data?.fullName },
    {
      key: "birthInfo",
      label: "Tempat/Tanggal Lahir",
      value: formatBirthInfo(profile.birthPlace, profile.birthDate),
    },
    { key: "department", label: "Departemen", value: profile.department },
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
      className="flex-shrink-0 flex flex-col w-full max-w-sm lg:max-w-[340px] xl:max-w-[380px] 2xl:max-w-[420px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-lg lg:text-xl font-semibold leading-none text-[#488BBE] mb-4 lg:mb-6 text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {title || `Profil ${type === "student" ? "Siswa" : "Karyawan"}`}
      </motion.h1>

      <motion.div
        className="flex justify-center lg:justify-start mb-8 lg:mb-[51px]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] rounded-full overflow-hidden shadow-sm bg-gray-100 border flex items-center justify-center">
          {data?.profilePicture ? (
            <img
              src={data.profilePicture}
              alt={`${type} profile`}
              className="object-cover w-full h-full"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center" style={{ display: data?.profilePicture ? 'none' : 'flex' }}>
            <span className="material-icons text-gray-400 text-2xl lg:text-3xl">person</span>
          </div>
        </div>
      </motion.div>

      <div className="w-full flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 lg:gap-x-6 gap-y-6 lg:gap-y-[35px]">
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

        <div className="flex justify-end mt-auto pt-12 lg:pt-[80px]">
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


export const SharedDevelopment = ({ data, type = "student" }) => {
  const fullName = data?.fullName || (type === "student" ? "Siswa" : "Karyawan")
  
  const screenings = data?.screenings || []
  const counselings = data?.counselings || []
  const allHistory = [...screenings, ...counselings]

  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth())
  const [monthRangeStart, setMonthRangeStart] = useState(Math.floor(new Date().getMonth() / 6))

  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const getMonthlyNotes = () => {
    if (allHistory.length === 0) {
      return allMonths.map(() => "")
    }

    const notesMap = {}
    allHistory.forEach((record) => {
      if (record.date && record.notes != null) { 
        const date = new Date(record.date)
        const month = date.getMonth()
        if (!notesMap[month] || new Date(record.date) > new Date(notesMap[month].date)) {
          notesMap[month] = {
            date: record.date,
            notes: record.notes,
          }
        }
      }
    })

    return allMonths.map((_, index) => notesMap[index]?.notes || "")
  }

  const monthlyNotes = getMonthlyNotes()

  const getStatusValue = (status) => {
    const statusValues = {
      at_risk: 1.0,
      monitored: 2.0,
      stable: 3.0,
    }
    return statusValues[status] || 0
  }

  const generateChartData = () => {
    const statusMap = {}
    if (screenings.length > 0) {
      screenings.forEach((record) => {
        if (record.date) {
          const date = new Date(record.date)
          const month = date.getMonth()
          if (!statusMap[month] || new Date(record.date) > new Date(statusMap[month].date)) {
            statusMap[month] = {
              date: record.date,
              status: record.screeningStatus,
            }
          }
        }
      })
    }

    return allMonths.map((month, index) => {
      const status = statusMap[index]?.status || "not_screened"
      return {
        month,
        value: getStatusValue(status),
        status: status,
      }
    })
  }
  
  const fullYearChartData = generateChartData()
  const visibleChartData = fullYearChartData.slice(monthRangeStart * 6, monthRangeStart * 6 + 6)
  
  const handlePrevMonth = () => {
    const newAbsoluteIndex = absoluteMonthIndex - 1
    if (newAbsoluteIndex >= 0) {
        setCurrentMonthIndex(newAbsoluteIndex % 6)
        setMonthRangeStart(Math.floor(newAbsoluteIndex / 6))
    }
  }

  const handleNextMonth = () => {
    const newAbsoluteIndex = absoluteMonthIndex + 1
    if (newAbsoluteIndex < 12) {
        setCurrentMonthIndex(newAbsoluteIndex % 6)
        setMonthRangeStart(Math.floor(newAbsoluteIndex / 6))
    }
  }

  const absoluteMonthIndex = monthRangeStart * 6 + currentMonthIndex
  const isPrevDisabled = absoluteMonthIndex === 0
  const isNextDisabled = absoluteMonthIndex === 11

  const CustomDot = (props) => {
    const { cx, cy, payload, index } = props
    
    const isActive = index === currentMonthIndex
    const statusColors = {
      at_risk: "#EE4266",
      monitored: "#EED142",
      stable: "#A3E635",
      not_screened: "#B0B0B0",
    }
    const dotColor = statusColors[payload.status] || "#B0B0B0"

    if (isActive) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="white" stroke={dotColor} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={4} fill={dotColor} />
        </g>
      )
    }
    return <circle cx={cx} cy={cy} r={5} fill={dotColor} />
  }

  // FIX: Ditambahkan `dominantBaseline` untuk alignment vertikal yang presisi
  const CustomYAxisTick = (props) => {
      const { x, y, payload } = props;
      const { value } = payload;
      let label = '';
      let color = '#64748b';
      let fontWeight = 'normal';

      switch (value) {
          case 0: label = '0'; break;
          case 1: label = 'Berisiko'; color = '#EE4266'; fontWeight = 'bold'; break;
          case 2: label = 'Pengawasan'; color = '#EED142'; fontWeight = 'bold'; break;
          case 3: label = 'Stabil'; color = '#A3E635'; fontWeight = 'bold'; break;
          default: return null;
      }

      return (
          <Text x={x} y={y} textAnchor="end" fill={color} fontSize={12} fontWeight={fontWeight} dominantBaseline="middle">
              {label}
          </Text>
      );
  };
  
  const CustomXAxisTick = (props) => {
      const { x, y, payload, index } = props;
      const isActive = index === currentMonthIndex;
      const handleClick = () => {
          const newAbsoluteIndex = monthRangeStart * 6 + index;
          setCurrentMonthIndex(newAbsoluteIndex % 6)
          setMonthRangeStart(Math.floor(newAbsoluteIndex / 6))
      }

      return (
          <g transform={`translate(${x},${y})`}>
              <text
                  x={0} y={0} dy={16}
                  textAnchor="middle"
                  fill={isActive ? '#488BBE' : '#64748b'}
                  fontSize={12}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  onClick={handleClick}
                  className="cursor-pointer hover:fill-[#488BBE] transition-colors"
              >
                  {payload.value}
              </text>
          </g>
      );
  };

  return (
    <motion.section
      className="flex flex-col w-full min-w-0 flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="text-lg lg:text-xl font-semibold text-[#488BBE] mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Perkembangan {type === "student" ? "Siswa" : "Karyawan"}
      </motion.h2>

      <motion.article
        className="relative flex flex-col w-full h-[180px] lg:h-[208px] text-sm leading-5 rounded-xl border border-gray-300 bg-[#FCFCFC] text-neutral-600 mb-6 lg:mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button
          className={`absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 z-10 ${isPrevDisabled ? "text-gray-300 cursor-not-allowed" : "text-[#488BBE] cursor-pointer"} w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors`}
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
        >
          <span className="material-icons text-xl lg:text-2xl">chevron_left</span>
        </button>
        <button
          className={`absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 z-10 ${isNextDisabled ? "text-gray-300 cursor-not-allowed" : "text-[#488BBE] cursor-pointer"} w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors`}
          onClick={handleNextMonth}
          disabled={isNextDisabled}
        >
          <span className="material-icons text-xl lg:text-2xl">chevron_right</span>
        </button>
        <div className="px-12 lg:px-16 flex flex-col items-center justify-center h-full py-4 lg:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={absoluteMonthIndex}
              className="text-center w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {monthlyNotes[absoluteMonthIndex] ? (
                <p className="text-sm lg:text-base leading-relaxed">{monthlyNotes[absoluteMonthIndex]}</p>
              ) : (
                <p className="text-sm lg:text-base leading-relaxed text-gray-400 italic">Tidak ada catatan</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.article>

      <motion.h2
        className="text-lg lg:text-xl font-semibold text-[#488BBE] mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Perkembangan Status Kesehatan Mental ({fullName})
      </motion.h2>

      <motion.div
        className="w-full h-[320px] rounded-xl border-solid bg-zinc-50 border-[0.5px] border-neutral-600 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleChartData}
            margin={{ top: 20, right: 20, left: 30, bottom: 20 }}
          >
            {/* FIX: Buang CartesianGrid, ganti dengan ReferenceLine manual */}
            <ReferenceLine y={3} stroke="#E5E7EB" strokeDasharray="4 2" />
            <ReferenceLine y={2} stroke="#E5E7EB" strokeDasharray="4 2" />
            <ReferenceLine y={1} stroke="#E5E7EB" strokeDasharray="4 2" />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="4 2" />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              interval={0}
            />
            <YAxis
              type="number"
              domain={[-0.7, 3.8]} 
              ticks={[0, 1, 2, 3]}
              axisLine={false}
              tickLine={false}
              width={80}
              tick={<CustomYAxisTick />}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.section>
  )
}

export const Divider = ({ sidebarExpanded = false }) => (
  <motion.div
    className="hidden lg:block shrink-0 my-auto h-[500px] lg:h-[600px] xl:h-[650px]" // Angkanya udah digedein
    style={{
      background: "linear-gradient(180deg, #FFFFFF 0%, #488BBA 50%, #FFFFFF 100%)",
      width: "1px",
    }}
    initial={{ opacity: 0, scaleY: 0.8 }}
    animate={{
      opacity: 1,
      scaleY: 1,
      marginLeft: sidebarExpanded ? "40px" : "80px", 
      marginRight: sidebarExpanded ? "40px" : "80px",
    }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  />
)
// Main Layout Component (Tidak ada perubahan)
export const DetailPageLayout = ({ children, sidebarExpanded = false }) => {
  return (
    <main className="bg-white min-h-screen relative">
      <div className="flex flex-col lg:flex-row">
        <motion.aside
          className="hidden lg:block flex-shrink-0"
          initial={false}
          animate={{ width: sidebarExpanded ? "200px" : "64px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
        <div className="flex-1 min-w-0">
          <motion.div
            className="flex flex-col lg:flex-row lg:items-start w-full px-4 lg:px-0"
            initial={false}
            animate={{
              paddingLeft: sidebarExpanded ? "32px" : "60px",
              paddingRight: "32px",
              paddingTop: "140px",
              paddingBottom: "32px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start w-full max-w-none gap-6 lg:gap-0">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}