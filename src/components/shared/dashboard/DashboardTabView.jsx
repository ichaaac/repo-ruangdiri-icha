// src/components/shared/dashboard/DashboardTabView.jsx - Tab view with #D7EDFF container
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDashboardTabData, useDashboardMetrics } from "../../../hooks/useDashboardMetrics"
import MetricCard from "./MetricCard"
import DashboardTable from "./DashboardTable"

/**
 * Dashboard tab view component showing cards and data table
 */
const DashboardTabView = ({ type = "student", filters = {}, onReportClick, onBackToHome, user }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get tab from URL params, default to "at_risk"
  const searchParams = new URLSearchParams(location.search)
  const urlTab = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(urlTab || "at_risk")
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("")

  // Fetch metrics for cards
  const { data: metrics } = useDashboardMetrics(type, filters)

  // Fetch data for the active tab
  const { data: tabData, isLoading, error } = useDashboardTabData(type, activeTab)

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(location.search)
    newSearchParams.set("tab", activeTab)
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true })
  }, [activeTab, location.pathname, location.search, navigate])

  const handleCardClick = (cardId) => {
    setActiveTab(cardId)
    setSelectedStudent(null)
  }

  const handleRowClick = (item) => {
    setSelectedStudent(item.id)
  }

  const handleDetailClick = (item) => {
    const basePath = type === "student" ? "/organization/school/student" : "/organization/company/employee"
    navigate(`${basePath}/${item.id}`)
  }

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
            id: "not_screened",
            title: "Total Siswa Belum Skrining",
            count: metrics?.summary?.notScreened?.count || 260,
            total: metrics?.summary?.notScreened?.total || 750,
            icon: "assignment",
            type: "not_screened",
            reportTitle: "Daftar Siswa Belum Skrining",
            color: "#979797",
            bgColor: "#D9D9D9",
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
            id: "not_screened",
            title: "Total Karyawan Belum Skrining",
            count: metrics?.summary?.notScreened?.count || 0,
            total: metrics?.summary?.notScreened?.total || 0,
            icon: "assignment",
            type: "not_screened",
            reportTitle: "Daftar Karyawan Belum Skrining",
            color: "#979797",
            bgColor: "#D9D9D9",
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

  return (
    <main className="flex-1 p-6 bg-[#F7F7F9] min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-medium text-[#488bbe] mb-8">{config.title}</h1>

      {/* Container #D7EDFF untuk wrap active tab + table */}
      <div className="bg-[#D7EDFF] rounded-xl p-6">
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
              isActive={activeTab === card.id}
              onCardClick={() => handleCardClick(card.id)}
              onReportClick={() => handleReport(card.reportTitle)}
            />
          ))}
        </div>

        {/* Data Table */}
        <DashboardTable
          type={type}
          data={tabData?.data?.students || tabData?.data?.employees || []}
          metadata={tabData?.metadata}
          isLoading={isLoading}
          error={error}
          selectedRow={selectedStudent}
          onRowClick={handleRowClick}
          onDetailClick={handleDetailClick}
          onClose={onBackToHome}
          activeTab={activeTab}
        />
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

export default DashboardTabView
