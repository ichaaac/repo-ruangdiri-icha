// src/components/shared/dashboard/SharedDashboard.jsx - FIXED data flow and prevent multiple fetches

import { useState, useEffect, useMemo } from "react"
import DashboardHome from "./DashboardHome"
import DashboardTabList from "./DashboardTabList"
import { useDashboard, useDashboardTabData } from "../../../hooks/useDashboardMetrics"
import { getCurrentDateInfo } from "../../../lib/date"

const SharedDashboard = ({
  type = "student",
  config = {},
  selectedDashboardTab = "home",
  onDashboardTabChange = () => {},
  useAuth,
  SuccessModalComponent,
  sidebarExpanded = false,
}) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Get current user with fallback
  const { user } = useAuth?.() || { user: {} }
  const currentDate = getCurrentDateInfo()

  // FIXED: Get dashboard data with proper error handling
  const {
    metrics,
    options,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErrorDetails,
    refetch: refetchDashboard,
    currentDate: dashboardCurrentDate,
  } = useDashboard(type)

  // FIXED: Only fetch tab data when not on home tab
  const shouldFetchTabData = selectedDashboardTab !== "home"
  const {
    data: tabDataQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: tabLoading,
    isError: tabError,
  } = useDashboardTabData(
    type,
    selectedDashboardTab,
    {
      enabled: shouldFetchTabData,
      limit: 10
    }
  )

  // FIXED: Process tab data with better structure handling
  const tabData = useMemo(() => {
    if (!shouldFetchTabData || !tabDataQuery?.pages) {
      return {
        data: { students: [], employees: [] },
        metadata: { totalData: 0, hasNextPage: false },
        hasNextPage: false,
        fetchNextPage: () => {},
        isFetchingNextPage: false,
      }
    }

    // Flatten all pages with proper structure preservation
    const allData = tabDataQuery.pages.reduce((acc, page) => {
      const pageData = page.data || { students: [], employees: [] }
      
      // Handle both direct arrays and nested structure
      if (type === "student") {
        const studentsArray = Array.isArray(pageData.students) ? pageData.students : []
        acc.students = [...acc.students, ...studentsArray]
      } else {
        const employeesArray = Array.isArray(pageData.employees) ? pageData.employees : []
        acc.employees = [...acc.employees, ...employeesArray]
      }
      
      return acc
    }, { students: [], employees: [] })

    const lastPage = tabDataQuery.pages[tabDataQuery.pages.length - 1]
    const metadata = lastPage?.metadata || { totalData: 0, hasNextPage: false }

    // Return structured data that DashboardTable can handle
    return {
      data: allData, // Keep the full structure for DashboardTable
      metadata: {
        ...metadata,
        // Don't override totalData - let MetricCard use monthly stats
        totalData: metadata.totalData || 0,
      },
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
    }
  }, [tabDataQuery, shouldFetchTabData, type, hasNextPage, fetchNextPage, isFetchingNextPage])

  // FIXED: Handle card clicks with data validation from monthly stats
  const handleCardClick = (tabType) => {
    // Check if there's data for this tab from monthly stats (not tabData)
    const hasData = getTabDataCount(tabType) > 0
    
    if (hasData) {
      onDashboardTabChange(tabType)
    }
  }

  // Handle return to home
  const handleReturnHome = () => {
    onDashboardTabChange("home")
  }

  // Handle report click - now handled by individual components with modal
  const handleReportClick = (reportName) => {
    console.log(`Report triggered: ${reportName}`)
    // Individual components now handle their own modals
  }

  // FIXED: Get count for specific tab type from monthly stats ONLY
  const getTabDataCount = (tabType) => {
    switch (tabType) {
      case "at_risk":
        return metrics?.summary?.atRisk?.count || 0
      case "not_screened":
        return metrics?.summary?.notScreened?.count || 0
      case "not_counseled":
        return metrics?.summary?.notCounseled?.count || 0
      default:
        return 0
    }
  }

  // Format date display
  const dateDisplay = `${currentDate.monthName} ${currentDate.year}`

  // Enhanced config with defaults and detail paths
  const enhancedConfig = {
    entityName: type === "student" ? "Siswa" : "Karyawan",
    defaultFilter: type === "student" ? "X" : "Finance",
    filterLabel: type === "student" ? "Kelas" : "Departemen",
    detailPath: type === "student" ? "/dashboard/student/detail" : "/dashboard/employee/detail",
    ...config,
  }

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#488BBE]"></div>
          <p className="text-[#488BBE] font-medium">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">
            <span className="material-icons" style={{ fontSize: "4rem" }}>error_outline</span>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Gagal Memuat Dashboard</h2>
          <p className="text-gray-600 mb-6">
            {dashboardErrorDetails?.message || "Terjadi kesalahan saat memuat data dashboard."}
          </p>
          <button
            onClick={() => refetchDashboard()}
            className="px-6 py-2 bg-[#488BBE] text-white rounded-lg hover:bg-[#3399E9] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">
      {/* Simple conditional rendering without animations to avoid lag/refresh */}
      {selectedDashboardTab === "home" ? (
        <DashboardHome
          type={type}
          metrics={metrics}
          options={options}
          config={enhancedConfig}
          user={user}
          dateDisplay={dateDisplay}
          onCardClick={handleCardClick}
          onReportClick={handleReportClick}
          refetchDashboard={refetchDashboard}
          sidebarExpanded={sidebarExpanded}
        />
      ) : (
        <DashboardTabList
          type={type}
          activeCard={selectedDashboardTab}
          tabData={tabData}
          config={enhancedConfig}
          metrics={metrics} // FIXED: Pass metrics for MetricCard counts
          user={user}
          onClose={() => handleReturnHome()}
          onCardClick={handleCardClick}
          onReturnHome={handleReturnHome}
          isLoading={tabLoading}
          isError={tabError}
          sidebarExpanded={sidebarExpanded}
        />
      )}

      {/* Success Modal - kept for backward compatibility */}
      {showSuccessModal && SuccessModalComponent && (
        <SuccessModalComponent
          isOpen={showSuccessModal}
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  )
}

export default SharedDashboard