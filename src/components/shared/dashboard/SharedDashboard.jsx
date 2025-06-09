// src/components/shared/dashboard/SharedDashboard.jsx

import { useState, useCallback, useMemo, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import DashboardHome from "./DashboardHome"
import DashboardTabList from "./DashboardTabList"
import { ErrorBoundary } from "../error/ErrorBoundary"

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
  useDashboardHook,
  useTabDataHook,
  useAuth,
  SuccessModalComponent,
  config = {},
  selectedDashboardTab = "home", // Tambah prop dari sidebar
  onDashboardTabChange = () => {}, // Tambah prop dari sidebar
}) => {
  // State management
  const [showingList, setShowingList] = useState(selectedDashboardTab !== "home")
  const [activeCard, setActiveCard] = useState(selectedDashboardTab === "home" ? "at_risk" : selectedDashboardTab)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("")

  // Parse URL query params for initial filter values
  const [selectedFilter, setSelectedFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get("filter") || config.defaultFilter || (type === "student" ? "X" : "Finance")
    }
    return config.defaultFilter || (type === "student" ? "X" : "Finance")
  })

  const [selectedGrade, setSelectedGrade] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get("grade") || ""
    }
    return ""
  })

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

  // Always call hooks - fix hooks order violation
  const dashboardData = useDashboardHook?.(type, filters) || {}

  // Always call tabDataHook but control with enabled parameter
  const tabDataQuery =
    useTabDataHook?.(type, activeCard, {
      limit: 10,
      enabled: showingList, // Control query execution
    }) || {}

  // Process tab data
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

    return {
      data: tabDataQuery.data?.data || { students: [], employees: [] },
      metadata: tabDataQuery.data?.metadata || { totalData: 0, hasNextPage: false },
      isLoading: tabDataQuery.isLoading || false,
      hasNextPage: tabDataQuery.data?.metadata?.hasNextPage || false,
      fetchNextPage: tabDataQuery.fetchNextPage || (() => {}),
      isFetchingNextPage: tabDataQuery.isFetchingNextPage || false,
    }
  }, [showingList, tabDataQuery, type])

  // Extract dashboard data safely
  const {
    metrics = {},
    options = {},
    isLoading = false,
    isError = false,
    error = null,
    refetch = () => {},
  } = dashboardData

  // Handle filter changes without page refresh - FIXED: prevent page refresh entirely
  const handleFilterChange = useCallback((filter, grade = "") => {
    // Prevent default behavior and page refresh
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      
      // Only update URL if values actually changed
      const currentFilter = url.searchParams.get("filter")
      const currentGrade = url.searchParams.get("grade")
      
      if (currentFilter !== filter || currentGrade !== grade) {
        url.searchParams.set("filter", filter)
        
        if (grade) {
          url.searchParams.set("grade", grade)
        } else if (grade === "") {
          url.searchParams.delete("grade")
        }
        
        // Use replaceState instead of pushState to avoid page refresh
        window.history.replaceState({}, "", url.toString())
      }
    }
    
    // Update state only if changed
    if (filter !== selectedFilter) {
      setSelectedFilter(filter)
    }
    if (grade !== selectedGrade) {
      setSelectedGrade(grade)
    }
  }, [selectedFilter, selectedGrade])

  // Event handlers
  const handleCardClick = useCallback(
    (cardId) => {
      setActiveCard(cardId)
      setShowingList(true)
      onDashboardTabChange(cardId) // Update sidebar state

      // Update URL query params without page reload
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", cardId)
        window.history.replaceState({}, "", url.toString())
      }
    },
    [onDashboardTabChange],
  )

  const handleReturnHome = useCallback(() => {
    setShowingList(false)
    onDashboardTabChange("home") // Update sidebar state

    // Update URL query params without page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("tab")
      window.history.replaceState({}, "", url.toString())
    }
  }, [onDashboardTabChange])

  const handleReport = useCallback((reportType) => {
    setReportType(reportType)
    setShowReportModal(true)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-zinc-400 text-sm">
        <span className="material-icons animate-spin mr-2">refresh</span>
        Memuat dashboard...
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data dashboard</p>
          <p className="text-gray-600 mb-4 text-sm">{error?.message || "Terjadi kesalahan saat mengambil data."}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

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