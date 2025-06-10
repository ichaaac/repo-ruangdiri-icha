// src/components/shared/dashboard/SharedDashboard.jsx

import { useState, useCallback, useMemo, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import DashboardHome from "./DashboardHome"
import DashboardTabList from "./DashboardTabList"
import { ErrorBoundary } from "../error/ErrorBoundary"
import { useDashboard, useDashboardTabData } from "../../../hooks/useDashboardMetrics"

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
    <div className="flex flex-col items-center text-center p-6 max-w-md">
      <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
      <p className="text-red-500 font-semibold mb-2">Terjadi kesalahan pada dashboard</p>
      <p className="text-gray-600 mb-4 text-sm">{error.message || "Silakan coba muat ulang halaman."}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9]"
      >
        Coba Lagi
      </button>
    </div>
  </div>
)

/**
 * Reusable Dashboard Component untuk School dan Company
 */
const SharedDashboard = ({
  type = "student",
  config = {},
  selectedDashboardTab = "home", // Tambah prop dari sidebar
  onDashboardTabChange = () => {}, // Tambah prop dari sidebar
  useAuth,
  SuccessModalComponent,
}) => {
  // State management
  const [showingList, setShowingList] = useState(selectedDashboardTab !== "home")
  const [activeCard, setActiveCard] = useState(selectedDashboardTab === "home" ? "at_risk" : selectedDashboardTab)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("")

  const [selectedFilter, setSelectedFilter] = useState(
    config.defaultFilter || (type === "student" ? "X" : "Finance")
  )

  const [selectedGrade, setSelectedGrade] = useState("A")

  const [currentSemester, setCurrentSemester] = useState("first-half")

  // Get user data from useAuth hook
  const auth = useAuth?.() || { user: {} }
  const { user } = auth

  // Sync with selectedDashboardTab from sidebar
  useEffect(() => {
    if (selectedDashboardTab === "home") {
      setShowingList(false)
    } else {
      setShowingList(true)
      setActiveCard(selectedDashboardTab)
    }
  }, [selectedDashboardTab])

  // Date display
  const dateDisplay = useMemo(() => {
    const now = new Date()
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
  }, [])

  // Dashboard filters
  const filters = useMemo(
    () => ({
      year: "2025",
      ...(type === "student" ? { classroom: selectedFilter, grade: selectedGrade } : { department: selectedFilter }),
    }),
    [type, selectedFilter, selectedGrade],
  )

  // Use the new dashboard hook - always returns data, never loading
  const dashboardData = useDashboard(type, filters)

  // Use the new tab data hook with infinite scroll
  const tabDataQuery = useDashboardTabData(type, activeCard, {
    enabled: showingList,
    limit: 30,
  })

  // Process tab data with infinite scroll support
  const tabData = useMemo(() => {
    if (!showingList || !tabDataQuery.data) {
      return {
        data: { students: [], employees: [] },
        metadata: { totalData: 0, hasNextPage: false },
        isLoading: false,
        hasNextPage: false,
        fetchNextPage: () => {},
        isFetchingNextPage: false,
      }
    }

    // Flatten all pages into single array for display
    const allData = tabDataQuery.data.pages?.flatMap(page => 
      type === "student" ? page.data?.students || [] : page.data?.employees || []
    ) || []

    const metadata = tabDataQuery.data.pages?.[0]?.metadata || { totalData: 0, hasNextPage: false }

    return {
      data: type === "student" ? { students: allData, employees: [] } : { students: [], employees: allData },
      metadata: {
        ...metadata,
        totalData: allData.length, // Use actual data length
        hasNextPage: tabDataQuery.hasNextPage
      },
      isLoading: false, // Never show loading
      hasNextPage: tabDataQuery.hasNextPage,
      fetchNextPage: tabDataQuery.fetchNextPage,
      isFetchingNextPage: tabDataQuery.isFetchingNextPage || false,
    }
  }, [showingList, tabDataQuery, type])

  // Extract dashboard data safely - always available
  const {
    metrics = {},
    options = {},
    refetch = () => {},
  } = dashboardData

  // Handle filter changes - PURE React state updates only
  const handleFilterChange = useCallback((filter, grade = "") => {
    // Update state only - let React Query handle refetching automatically
    if (filter !== selectedFilter) {
      setSelectedFilter(filter)
    }
    if (grade !== selectedGrade) {
      setSelectedGrade(grade)
    }
  }, [selectedFilter, selectedGrade, setSelectedFilter, setSelectedGrade])

  // Event handlers - NO URL manipulation
  const handleCardClick = useCallback(
    (cardId) => {
      // Check if card is disabled (count is 0)
      const metric = metrics?.summary?.[cardId === "at_risk" ? "atRisk" : cardId === "not_screened" ? "notScreened" : "notCounseled"]
      if (metric?.count === 0) {
        return // Don't allow click if no data
      }

      setActiveCard(cardId)
      setShowingList(true)
      onDashboardTabChange(cardId) // Update sidebar state only
    },
    [onDashboardTabChange, metrics],
  )

  const handleReturnHome = useCallback(() => {
    setShowingList(false)
    onDashboardTabChange("home") // Update sidebar state only
  }, [onDashboardTabChange])

  const handleReport = useCallback((reportType) => {
    setReportType(reportType)
    setShowReportModal(true)
  }, [])

  // Never show loading states - data is always available
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="w-full min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait">
          {showingList ? (
            <DashboardTabList
              key="table-view"
              type={type}
              activeCard={activeCard}
              tabData={tabData}
              config={config}
              metrics={metrics}
              user={user}
              onClose={handleReturnHome}
              onCardClick={handleCardClick}
              onReturnHome={handleReturnHome}
            />
          ) : (
            <DashboardHome
              key="dashboard-view"
              type={type}
              metrics={metrics}
              options={options}
              config={config}
              user={user}
              dateDisplay={dateDisplay}
              currentSemester={currentSemester}
              selectedFilter={selectedFilter}
              selectedGrade={selectedGrade}
              setSelectedFilter={(filter) => handleFilterChange(filter, selectedGrade)}
              setSelectedGrade={(grade) => handleFilterChange(selectedFilter, grade)}
              onCardClick={handleCardClick}
              onReportClick={handleReport}
              refetchDashboard={refetch} // Pass refetch function
            />
          )}
        </AnimatePresence>

        {showReportModal && SuccessModalComponent && (
          <SuccessModalComponent
            email="emaila******@gmail.com"
            reportType={reportType}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default SharedDashboard