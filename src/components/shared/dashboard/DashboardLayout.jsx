"use client"

// src/components/shared/dashboard/DashboardLayout.jsx - Updated to use useAuth and support tab view
import { useState } from "react"
import { useAuth } from "../../../hooks/useAuth"
import MetricCard from "./MetricCard"
import DashboardTabView from "./DashboardTabView"
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics"

/**
 * Modular dashboard layout that works for both schools and companies
 */
const DashboardLayout = ({
  type = "student", // 'student' or 'employee'
  view = "home", // 'home' or 'report'
  filters = {},
  onCardClick,
  onReportClick,
  children, // For additional content like charts, tables, etc.
}) => {
  const { user } = useAuth() // Use useAuth instead of separate hook
  const { data: metrics, isLoading, error } = useDashboardMetrics(type, filters)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("")

  const handleReport = (reportTitle) => {
    setReportType(reportTitle)
    setShowReportModal(true)
    if (onReportClick) {
      onReportClick(reportTitle)
    }
  }

  const getConfig = () => {
    if (type === "student") {
      return {
        title: `Halo, ${user?.fullName || user?.organization?.name || "SMA Veteran 007"}`,
        cards: [
          {
            id: "at_risk",
            title: "Total Siswa Berisiko",
            count: metrics?.summary?.atRisk?.count || 0,
            total: metrics?.summary?.atRisk?.total || 0,
            icon: "warning",
            type: "at_risk",
            reportTitle: "Daftar Siswa Berisiko",
          },
          {
            id: "not_screened",
            title: "Total Siswa Belum Skrining",
            count: metrics?.summary?.notScreened?.count || 0,
            total: metrics?.summary?.notScreened?.total || 0,
            icon: "assignment",
            type: "not_screened",
            reportTitle: "Daftar Siswa Belum Skrining",
          },
          {
            id: "not_counseled",
            title: "Total Siswa Belum Konseling",
            count: metrics?.summary?.notCounseled?.count || 0,
            total: metrics?.summary?.notCounseled?.total || 0,
            icon: "groups",
            type: "not_counseled",
            reportTitle: "Daftar Siswa Belum Konseling",
          },
        ],
      }
    } else {
      return {
        title: `Halo, ${user?.fullName || user?.organization?.name || "Admin Perusahaan"}`,
        cards: [
          {
            id: "at_risk",
            title: "Total Karyawan Berisiko",
            count: metrics?.summary?.atRisk?.count || 0,
            total: metrics?.summary?.atRisk?.total || 0,
            icon: "warning",
            type: "at_risk",
            reportTitle: "Daftar Karyawan Berisiko",
          },
          {
            id: "not_screened",
            title: "Total Karyawan Belum Skrining",
            count: metrics?.summary?.notScreened?.count || 0,
            total: metrics?.summary?.notScreened?.total || 0,
            icon: "assignment",
            type: "not_screened",
            reportTitle: "Daftar Karyawan Belum Skrining",
          },
          {
            id: "not_counseled",
            title: "Total Karyawan Belum Konseling",
            count: metrics?.summary?.notCounseled?.count || 0,
            total: metrics?.summary?.notCounseled?.total || 0,
            icon: "groups",
            type: "not_counseled",
            reportTitle: "Daftar Karyawan Belum Konseling",
          },
        ],
      }
    }
  }

  const config = getConfig()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <span className="material-icons animate-spin text-[#488BBE] text-3xl mb-2">refresh</span>
          <p className="text-[#488BBE] text-sm">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data dashboard</p>
          <p className="text-gray-600 mb-4 text-sm">{error?.message || "Terjadi kesalahan saat mengambil data."}</p>
        </div>
      </div>
    )
  }

  // If view is 'report', show the tab view instead of home view
  if (view === "report") {
    return (
      <main className="flex relative flex-col items-start w-full bg-white min-h-screen">
        {/* Header with greeting */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#488BBE] mb-8">{config.title}</h1>
        </div>

        {/* Dashboard Tab View */}
        <DashboardTabView type={type} cards={config.cards} onReportClick={handleReport} />

        {/* Success Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <span className="material-icons text-green-500 text-4xl mb-4 block">check_circle</span>
                <h3 className="text-lg font-semibold mb-2">Laporan Berhasil Dikirim</h3>
                <p className="text-gray-600 mb-4">{reportType} telah dikirim ke email Anda.</p>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-[#488BBE] text-white rounded-lg hover:bg-[#3399E9] transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // Default home view
  return (
    <main className="flex relative flex-col items-start w-full bg-white min-h-screen">
      {/* Header with greeting */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#488BBE] mb-8">{config.title}</h1>
      </div>

      {/* Dashboard content section with background containers */}
      <section
        className="flex absolute flex-col items-start w-full h-auto left-0 sm:left-[257px] max-w-full sm:max-w-[1163px] top-[100px] sm:top-[150px] px-4 sm:px-0"
        role="region"
        aria-label="Dashboard content"
      >
        {/* Cards container with blue background */}
        <div className="flex relative flex-col gap-4 items-start py-4 sm:py-0 pr-4 sm:pr-16 pl-4 sm:pl-96 w-full sm:w-[825px] mb-4">
          <article className="relative w-full bg-blue-100 rounded-xl p-6 min-h-[156px]">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {config.cards.map((card) => (
                <MetricCard
                  key={card.id}
                  title={card.title}
                  count={card.count}
                  total={card.total}
                  icon={card.icon}
                  type={card.type}
                  onCardClick={() => onCardClick && onCardClick(card.id)}
                  onReportClick={() => handleReport(card.reportTitle)}
                  isActive={true}
                />
              ))}
            </div>
          </article>
        </div>

        {/* Main content area with blue background */}
        <article className="relative w-full bg-blue-100 rounded-xl min-h-[517px] p-6">
          {children || (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <span className="material-icons text-gray-400 text-6xl mb-4 block">
                  {type === "student" ? "school" : "business"}
                </span>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {type === "student" ? "Data Siswa" : "Data Karyawan"}
                </h3>
                <p className="text-gray-500">Konten tambahan dapat ditambahkan di sini</p>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* Success Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <span className="material-icons text-green-500 text-4xl mb-4 block">check_circle</span>
              <h3 className="text-lg font-semibold mb-2">Laporan Berhasil Dikirim</h3>
              <p className="text-gray-600 mb-4">{reportType} telah dikirim ke email Anda.</p>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-[#488BBE] text-white rounded-lg hover:bg-[#3399E9] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default DashboardLayout
