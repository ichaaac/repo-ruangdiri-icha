// src/components/shared/ListPage.jsx - Improved Floating Scrollbar Component

import { useMemo, useRef, useState, useCallback, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import useDebounce from "@/hooks/useDebounce"
import SharedTable from "./Table"
import clsx from "clsx"
import TopRightControl from "../layout/TopRightControl"

/**
 * Improved Floating Table Scrollbar with better responsive behavior
 * FIXED: Proper sidebar adaptation and cleanup with configurable timing
 */
const FloatingTableScrollbar = ({ tableRef, sidebarExpanded }) => {
const scrollbarRef = useRef(null)
const thumbRef = useRef(null)
const resizeObserverRef = useRef(null)
const animationFrameRef = useRef(null)

const [isDragging, setIsDragging] = useState(false)
const [scrollbarState, setScrollbarState] = useState({
  visible: false,
  thumbWidth: 20,
  thumbLeft: 0,
  scrollbarWidth: 0,
  scrollbarLeft: 0,
})

// TIMING CONFIGURATION - Adjust these values to match your sidebar animation
const TIMING_CONFIG = {
  // Sidebar animation duration in your CSS/Layout component
  sidebarAnimationDuration: 300, // Default: 300ms (check your Layout.jsx transition duration)
  
  // Additional buffer time to ensure animation is complete
  bufferTime: 50, // Default: 50ms buffer
  
  // Total delay = sidebarAnimationDuration + bufferTime
  get totalDelay() {
    return this.sidebarAnimationDuration + this.bufferTime
  }
}

// DEBUGGING HELPER - Enable this to see timing in console
const DEBUG_TIMING = false // Set to true to debug timing issues

// FIXED: Centralized scrollbar calculation with proper responsive logic
const calculateScrollbarMetrics = useCallback(() => {
  if (!tableRef.current) {
    return {
      visible: false,
      thumbWidth: 20,
      thumbLeft: 0,
      scrollbarWidth: 0,
      scrollbarLeft: 0,
    }
  }

  const table = tableRef.current
  const { scrollLeft, scrollWidth, clientWidth } = table
  const tableRect = table.getBoundingClientRect()
  
  // Check if horizontal scrolling is needed
  const maxScroll = scrollWidth - clientWidth
  const needsScrollbar = maxScroll > 10

  if (!needsScrollbar) {
    return {
      visible: false,
      thumbWidth: 20,
      thumbLeft: 0,
      scrollbarWidth: 0,
      scrollbarLeft: 0,
    }
  }

  // Calculate thumb dimensions
  const visibleRatio = clientWidth / scrollWidth
  const thumbWidth = Math.max(visibleRatio * 100, 15) // Min 15% width
  const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0
  const thumbLeft = scrollRatio * (100 - thumbWidth)

  // FIXED: Better responsive positioning
  const scrollbarWidth = Math.max(clientWidth - 20, 200) // Min 200px, with 20px padding
  const scrollbarLeft = Math.max(tableRect.left + 10, 10) // 10px min from left edge

  return {
    visible: true,
    thumbWidth,
    thumbLeft,
    scrollbarWidth,
    scrollbarLeft,
    maxScroll,
    scrollRatio,
  }
}, [tableRef])

// FIXED: Optimized update function with requestAnimationFrame
const updateScrollbar = useCallback(() => {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current)
  }

  animationFrameRef.current = requestAnimationFrame(() => {
    const metrics = calculateScrollbarMetrics()
    setScrollbarState(metrics)

    // Update thumb position directly for smoother animation
    if (thumbRef.current && metrics.visible) {
      thumbRef.current.style.left = `${metrics.thumbLeft}%`
      thumbRef.current.style.width = `${metrics.thumbWidth}%`
    }

    if (DEBUG_TIMING) {
      console.log('Scrollbar updated:', metrics)
    }
  })
}, [calculateScrollbarMetrics])

// FIXED: Setup scrollbar with ResizeObserver and proper event listeners
useEffect(() => {
  if (!tableRef.current) return

  const table = tableRef.current

  // Event handlers
  const handleScroll = () => updateScrollbar()
  const handleResize = () => updateScrollbar()

  // Setup event listeners
  table.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })

  // FIXED: Use ResizeObserver for better table size detection
  if (ResizeObserver) {
    resizeObserverRef.current = new ResizeObserver(() => {
      updateScrollbar()
    })
    resizeObserverRef.current.observe(table)
  }

  // Initial update
  updateScrollbar()

  // Cleanup function
  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    table.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
    }
  }
}, [tableRef, updateScrollbar])

// FIXED: Configurable timing for sidebar state changes
useEffect(() => {
  if (DEBUG_TIMING) {
    console.log(`Sidebar changed to: ${sidebarExpanded ? 'expanded' : 'collapsed'}`)
    console.log(`Will update scrollbar after ${TIMING_CONFIG.totalDelay}ms`)
  }

  const timeoutId = setTimeout(() => {
    updateScrollbar()
    
    if (DEBUG_TIMING) {
      console.log('Scrollbar update completed')
    }
  }, TIMING_CONFIG.totalDelay)

  return () => clearTimeout(timeoutId)
}, [sidebarExpanded, updateScrollbar])

// Handle scrollbar track click
const handleScrollbarClick = useCallback((e) => {
  if (!tableRef.current || !scrollbarRef.current || e.target === thumbRef.current) return

  const rect = scrollbarRef.current.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const percentage = clickX / rect.width
  const metrics = calculateScrollbarMetrics()
  
  if (metrics.maxScroll) {
    const newScrollLeft = percentage * metrics.maxScroll
    tableRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, metrics.maxScroll))
  }
}, [tableRef, calculateScrollbarMetrics])

// Handle thumb drag
const handleMouseDown = useCallback((e) => {
  e.preventDefault()
  setIsDragging(true)

  const startX = e.clientX
  const startScrollLeft = tableRef.current?.scrollLeft || 0
  const scrollbarWidth = scrollbarRef.current?.offsetWidth || 1
  const metrics = calculateScrollbarMetrics()

  const handleMouseMove = (moveEvent) => {
    if (!tableRef.current || !metrics.maxScroll) return

    const deltaX = moveEvent.clientX - startX
    const scrollDelta = (deltaX / scrollbarWidth) * metrics.maxScroll
    const newScrollLeft = startScrollLeft + scrollDelta

    tableRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, metrics.maxScroll))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove, { passive: false })
  document.addEventListener('mouseup', handleMouseUp)
}, [tableRef, calculateScrollbarMetrics])

// Don't render if not visible
if (!scrollbarState.visible) return null

return (
  <div
    className="fixed transition-all duration-300 ease-in-out z-[9998]"
    style={{
      bottom: "20px",
      left: `${scrollbarState.scrollbarLeft}px`,
      width: `${scrollbarState.scrollbarWidth}px`,
      height: "20px",
      pointerEvents: "auto",
    }}
  >
    <div className="w-full h-5">
      <div
        ref={scrollbarRef}
        className="relative h-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors shadow-lg border border-gray-300"
        onClick={handleScrollbarClick}
      >
        <div
          ref={thumbRef}
          className={clsx(
            "absolute h-full bg-[#488BBE] rounded-full shadow-sm transition-[background-color,opacity] duration-150",
            isDragging 
              ? "opacity-100 bg-[#3399e9]" 
              : "opacity-90 hover:opacity-100 hover:bg-[#3399e9]"
          )}
          style={{
            width: `${scrollbarState.thumbWidth}%`,
            left: `${scrollbarState.thumbLeft}%`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  </div>
)
}

/**
 * Responsive Shared List Page Component
 * FIXED: Cleaner props passing and better responsive behavior
 */
const SharedListPage = ({
type = "student",
useDataHook,
useFiltersHook,
useOptionsHook,
FiltersComponent,
sidebarExpanded = false,
}) => {
const { user } = useAuth()
const resetEditModeRef = useRef(null)
const tableRef = useRef(null)
const [filtersChanged, setFiltersChanged] = useState(false)

// Move the hook call to the top level
const optionsHookResult = useOptionsHook ? useOptionsHook() : { data: null }
const { data: optionsData } = optionsHookResult

const {
  searchInput,
  setSearchInput,
  appliedSortConfig,
  requestSort,
  getSortIcon,
  filtersInput,
  setFiltersInput,
  appliedFilters,
  handleFilterSelect,
  applyFilters,
  clearFilters,
  hasActiveFilters,
  showFilterModal,
  setShowFilterModal,
} = useFiltersHook()

const debouncedSearchTerm = useDebounce(searchInput, 300)

// Call the data hook
const hookResult = useDataHook(debouncedSearchTerm, appliedSortConfig, appliedFilters)

// Extract data based on hook structure
let listData, totalData, genderCounts, updateFunction

if (type === "student") {
  listData = hookResult.students || []
  totalData = hookResult.totalData || 0
  genderCounts = hookResult.genderCounts || { male: 0, female: 0 }
  updateFunction = hookResult.updateStudent
} else {
  listData = hookResult.data || hookResult.employees || []
  totalData = hookResult.totalData || 0
  genderCounts = hookResult.genderCounts || { male: 0, female: 0 }
  updateFunction = hookResult.updateItem || hookResult.updateEmployee
}

const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } = hookResult

// Reset filters tracking - minimal effect
const handleFiltersChangeCallback = useCallback(() => {
  if (filtersChanged) {
    const timer = setTimeout(() => setFiltersChanged(false), 100)
    return () => clearTimeout(timer)
  }
}, [filtersChanged])

// Enhanced clearFilters function
const handleClearFilters = useCallback(() => {
  if (resetEditModeRef.current) {
    resetEditModeRef.current()
  }
  clearFilters()
  setFiltersChanged(true)
}, [clearFilters])

// Enhanced apply filters function
const handleApplyFilters = useCallback(() => {
  if (resetEditModeRef.current) {
    resetEditModeRef.current()
  }
  applyFilters()
  setFiltersChanged(true)
}, [applyFilters])

// Process options data based on type
const optionsForFilters = useMemo(() => {
  if (type === "employee" && optionsData) {
    return {
      departments: optionsData.departments || [],
      positions: optionsData.positions || [],
    }
  } else if (type === "student" && optionsData) {
    return {
      classrooms: optionsData.classrooms || optionsData.classNumbers || [],
      grades: optionsData.gradesResult || ["A", "B", "C", "D"],
    }
  }

  // Fallback to extracting from data
  const uniqueOptions = { departments: new Set(), positions: new Set(), classrooms: new Set(), grades: new Set() }

  if (listData && listData.length > 0) {
    listData.forEach((item) => {
      if (type === "employee") {
        if (item.department) uniqueOptions.departments.add(item.department)
        if (item.position) uniqueOptions.positions.add(item.position)
      } else if (type === "student") {
        if (item.classroom) uniqueOptions.classrooms.add(item.classroom)
        if (item.grade) uniqueOptions.grades.add(item.grade)
      }
    })
  }

  return {
    departments: Array.from(uniqueOptions.departments).sort(),
    positions: Array.from(uniqueOptions.positions).sort(),
    classrooms: Array.from(uniqueOptions.classrooms).sort(),
    grades: Array.from(uniqueOptions.grades).sort(),
  }
}, [optionsData, listData, type])

// Configure based on type
const config = useMemo(() => {
  if (type === "student") {
    return {
      title: `Halo, ${user?.fullName || ""}`,
      searchPlaceholder: "Cari Nama atau NIS...",
      totalLabel: "Siswa",
      icons: {
        total: "groups",
        female: "face_2",
        male: "face",
      },
    }
  } else {
    return {
      title: `Halo, ${user?.fullName || ""}`,
      searchPlaceholder: "Cari Nama atau ID Karyawan...",
      totalLabel: "Karyawan",
      icons: {
        total: "groups",
        female: "face_2",
        male: "face",
      },
    }
  }
}, [type, user])

// Trigger cleanup
handleFiltersChangeCallback()

if (isError) {
  return (
    <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
      <div className="flex flex-col items-center text-center p-6 max-w-md">
        <span className="material-icons text-red-500 text-3xl sm:text-4xl mb-4">error_outline</span>
        <p className="text-red-500 font-semibold mb-2 text-sm sm:text-base">
          Gagal memuat data {type === "student" ? "siswa" : "karyawan"}
        </p>
        <p className="text-gray-600 mb-4 text-xs sm:text-sm">
          {error?.message || "Terjadi kesalahan saat mengambil data."}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#488bbe] text-white rounded-full hover:bg-[#3399e9] text-xs sm:text-sm"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}

return (
<div className="relative w-full min-h-screen overflow-x-hidden">
<TopRightControl isAbsolute />

    {/* Header section with title and stats */}
    <div className="flex flex-col lg:flex-row items-start justify-between px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8 gap-4 lg:gap-6 pt-[72px]">
      {config.title && (
        <div className="w-full lg:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            {config.title}
          </h1>
        </div>
      )}

      {/* Responsive Stats cards */}
      <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
        {/* Total card */}
        <div className="relative w-[90px] sm:w-[110px] lg:w-[120px] h-[60px] sm:h-[70px] lg:h-[80px]">
          <div
            className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px] lg:h-[70px]"
            style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
          >
            <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
              <span className="material-icons text-[#3399E9] text-base sm:text-lg pb-2 sm:pb-3">
                {config.icons.total}
              </span>
              <div className="flex flex-col items-center ml-auto mr-auto">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#488BBE]">{totalData || 0}</div>
                <div className="text-[10px] sm:text-xs text-[#488BBE]">{config.totalLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Female card */}
        <div className="relative w-[90px] sm:w-[110px] lg:w-[120px] h-[60px] sm:h-[70px] lg:h-[80px]">
          <div
            className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px] lg:h-[70px]"
            style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
          >
            <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
              <span className="material-icons text-[#FF86E1] text-base sm:text-lg pb-2 sm:pb-3">
                {config.icons.female}
              </span>
              <div className="flex flex-col items-center ml-auto mr-auto">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#488BBE]">
                  {genderCounts?.female || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-[#488BBE]">Perempuan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Male card */}
        <div className="relative w-[90px] sm:w-[110px] lg:w-[120px] h-[60px] sm:h-[70px] lg:h-[80px]">
          <div
            className="absolute inset-0 rounded-lg p-[1px] w-full h-[50px] sm:h-[60px] lg:h-[70px]"
            style={{ background: "linear-gradient(to bottom, #FFFFFF, #488BBE)" }}
          >
            <div className="bg-white rounded-lg w-full h-full flex items-center pl-2 sm:pl-3">
              <span className="material-icons text-[#FF7173] text-base sm:text-lg pb-2 sm:pb-3">
                {config.icons.male}
              </span>
              <div className="flex flex-col items-center ml-auto mr-auto">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#488BBE]">
                  {genderCounts?.male || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-[#488BBE]">Laki-laki</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Search and filter section */}
    <div className="px-2 sm:px-4 lg:px-6 mt-4 sm:mt-6 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
        {/* Search input */}
        <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center">
            <span className="material-icons text-[#8b8b8b] text-base sm:text-lg">search</span>
          </span>
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 sm:pl-10 pr-4 py-2 w-full rounded-full border border-[#d9d9d9] focus:outline-none focus:border-[#488bbe] text-xs sm:text-sm md:text-base"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            className="flex items-center justify-center px-3 sm:px-4 py-2 rounded-full text-[#8b8b8b] hover:bg-[#f7f7f9] transition-colors text-xs sm:text-sm flex-1 sm:flex-none"
            onClick={() => setShowFilterModal(true)}
          >
            <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">filter_alt</span>
            <span>Filter</span>
          </button>

          <button
            className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-full ${
              hasActiveFilters
                ? "text-[#488bbe] hover:bg-[#e8f5ff] cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            } transition-colors text-xs sm:text-sm flex-1 sm:flex-none`}
            onClick={hasActiveFilters ? handleClearFilters : undefined}
            disabled={!hasActiveFilters}
          >
            <span className="material-icons mr-1 text-xs sm:text-sm">close</span>
            <span>Clear all</span>
          </button>
        </div>
      </div>
    </div>

    {/* Data table container */}
    <div className="px-2 sm:px-4 lg:px-6">
      <SharedTable
        ref={tableRef}
        type={type}
        data={listData}
        searchInput={debouncedSearchTerm}
        getSortIcon={getSortIcon}
        requestSort={requestSort}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        updateItem={updateFunction}
        optionsData={optionsForFilters}
        resetEditMode={resetEditModeRef}
        filtersChanged={filtersChanged}
        isLoading={isLoading}
        sidebarExpanded={sidebarExpanded}
      />
    </div>

    {/* FIXED: Improved Floating Scrollbar */}
    <FloatingTableScrollbar 
      tableRef={tableRef} 
      sidebarExpanded={sidebarExpanded} 
    />

    {/* Filter modal */}
    <AnimatePresence>
      {showFilterModal && (
        <FiltersComponent
          showModal={showFilterModal}
          setShowModal={setShowFilterModal}
          filtersInput={filtersInput}
          setFiltersInput={setFiltersInput}
          handleFilterSelect={handleFilterSelect}
          applyFilters={handleApplyFilters}
          optionsData={optionsForFilters}
          data={listData}
          style={{ zIndex: 9999 }}
        />
      )}
    </AnimatePresence>
  </div>
)
}

export default SharedListPage
