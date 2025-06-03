// src/components/shared/dashboard/DashboardHome.jsx - Dashboard Home with Charts
import { useState } from "react"
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics"
import MetricCard from "./MetricCard"

/**
 * Dashboard Home component with charts and metrics
 */
const DashboardHome = ({ type = "student", filters = {}, onCardClick, onReportClick, user }) => {
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
            count: metrics?.summary?.atRisk?.count || 76,
            total: metrics?.summary?.atRisk?.total || 490,
            icon: "warning",
            type: "at_risk",
            reportTitle: "Daftar Siswa Berisiko",
            color: "#ED8768",
            bgColor: "#FFC1AF",
          },
          {
            id: "not_counseled",
            title: "Total Siswa Belum Konseling",
            count: metrics?.summary?.notCounseled?.count || 51,
            total: metrics?.summary?.notCounseled?.total || 76,
            icon: "groups",
            type: "not_counseled",
            reportTitle: "Daftar Siswa Belum Konseling",
            color: "#979797",
            bgColor: "#D9D9D9",
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
            color: "#ED8768",
            bgColor: "#FFC1AF",
          },
          {
            id: "not_counseled",
            title: "Total Karyawan Belum Konseling",
            count: metrics?.summary?.notCounseled?.count || 0,
            total: metrics?.summary?.notCounseled?.total || 0,
            icon: "groups",
            type: "not_counseled",
            reportTitle: "Daftar Karyawan Belum Konseling",
            color: "#979797",
            bgColor: "#D9D9D9",
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

  return (
    <main className="flex-1 p-6 bg-[#F7F7F9] min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-medium text-[#488BBE] mb-8">{config.title}</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {config.cards.map((card) => (
          <MetricCard
            key={card.id}
            title={card.title}
            count={card.count}
            total={card.total}
            icon={card.icon}
            color={card.color}
            bgColor={card.bgColor}
            isActive={true}
            onCardClick={() => onCardClick && onCardClick(card.id)}
            onReportClick={() => handleReport(card.reportTitle)}
          />
        ))}
      </div>

      {/* Charts Section - Blue background container */}
      <div className="bg-blue-100 rounded-xl p-6 min-h-[517px]">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <span className="material-icons text-gray-400 text-6xl mb-4 block">
              {type === "student" ? "school" : "business"}
            </span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {type === "student" ? "Data Siswa" : "Data Karyawan"}
            </h3>
            <p className="text-gray-500">Charts dan visualisasi data akan ditampilkan di sini</p>
          </div>
        </div>
      </div>

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

export default DashboardHome
