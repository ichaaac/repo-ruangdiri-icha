// src/components/shared/dashboard/SharedDashboard.jsx - Fixed for infinite loop issue
import { useState, useEffect, useCallback, useMemo } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Menu } from "@headlessui/react"
import { motion, AnimatePresence } from "framer-motion"
import DashboardTable from "./DashboardTable"
import MetricCard from "./MetricCard"
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
  type = "student", // "student" atau "employee"
  useDashboardHook,
  useTabDataHook,
  SuccessModalComponent,
  config = {},
}) => {
  // All useState hooks must be declared at the top level
  const [showingList, setShowingList] = useState(false)
  const [activeCard, setActiveCard] = useState("at_risk")
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("")
  const [selectedFilter, setSelectedFilter] = useState(config.defaultFilter || (type === "student" ? "X" : "Finance"))
  const [selectedGrade, setSelectedGrade] = useState(type === "student" ? "A" : "")
  const [dateDisplay, setDateDisplay] = useState("")
  const [currentSemester, setCurrentSemester] = useState("first-half")

  // Gunakan hook yang diberikan dengan parameter yang tepat
  const filters = useMemo(() => ({
    year: "2025", // Fixed year as shown in your API examples
    ...(type === "student" 
      ? { classroom: selectedFilter, grade: selectedGrade } 
      : { department: selectedFilter }),
  }), [type, selectedFilter, selectedGrade]);

  // Always call hooks regardless of showingList - but use memoized dependencies
  const dashboardData = useDashboardHook ? useDashboardHook(type, filters) : {}
  
  // FIXED: Only call tabDataHook when needed with proper dependencies
  // Since useTabDataHook has internal 'enabled' logic, we don't need to conditionally call it
  const tabDataParams = useMemo(() => ({ limit: 10 }), []);
  const tabDataQuery = useTabDataHook ? useTabDataHook(type, activeCard, tabDataParams) : {};
  
  // FIXED: Using useMemo for tabData to avoid recreating objects
  const tabData = useMemo(() => {
    if (!tabDataQuery) return {
      data: null, 
      isLoading: false, 
      hasNextPage: false,
      fetchNextPage: () => {},
      isFetchingNextPage: false
    };
    
    return {
      data: tabDataQuery.data,
      isLoading: tabDataQuery.isLoading,
      hasNextPage: tabDataQuery.data?.metadata?.hasNextPage || false,
      fetchNextPage: tabDataQuery.fetchNextPage,
      isFetchingNextPage: tabDataQuery.isFetchingNextPage
    };
  }, [tabDataQuery, tabDataQuery?.data, tabDataQuery?.isLoading]);
  
  // Set current date - only run once on mount
  useEffect(() => {
    const now = new Date()
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ]
    setDateDisplay(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`)
  }, [])
  
  // REMOVED: The problematic useEffect that was causing infinite renders

  // Safely extract data from dashboardData to avoid nested optional chaining in JSX
  const { 
    metrics = {}, 
    options = {}, 
    isLoading = false, 
    isError = false, 
    error = null,
    user = {}, 
    refetch = () => {} 
  } = dashboardData || {}

  // Calculate semester data from byMonth
  const getSemesterData = useCallback(() => {
    if (!metrics?.mentalHealth?.byMonth || !Array.isArray(metrics.mentalHealth.byMonth) || metrics.mentalHealth.byMonth.length === 0) {
      return []
    }

    const monthData = metrics.mentalHealth.byMonth

    // Group by semester
    const firstHalf = monthData.filter((item) => {
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].indexOf(item.month)
      return monthIndex !== -1
    })

    const secondHalf = monthData.filter((item) => {
      const monthIndex = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(item.month)
      return monthIndex !== -1
    })

    return currentSemester === "first-half" ? firstHalf : secondHalf
  }, [metrics?.mentalHealth?.byMonth, currentSemester])

  // Get data for overall mental health pie chart
  const getOverallPieData = useCallback(() => {
    // Ensure we have the required data
    if (!metrics?.mentalHealth?.overall) {
      return [
        { name: "Beresiko", value: 0, color: "#ED8768" },
        { name: "Pengawasan", value: 0, color: "#FCBC03" },
        { name: "Aman", value: 0, color: "#9BCA61" },
        { name: "Belum Skrining", value: 0, color: "#D9D9D9" },
      ]
    }

    const { atRisk, monitored, stable, notScreened } = metrics.mentalHealth.overall

    return [
      { name: "Beresiko", value: atRisk || 0, color: "#ED8768" },
      { name: "Pengawasan", value: monitored || 0, color: "#FCBC03" },
      { name: "Aman", value: stable || 0, color: "#9BCA61" },
      { name: "Belum Skrining", value: notScreened || 0, color: "#D9D9D9" },
    ]
  }, [metrics?.mentalHealth?.overall])

  // Get data for screening status pie chart
  const getScreeningData = useCallback(() => {
    if (!metrics?.status?.screening) {
      return [
        { name: "Belum Skrining", value: 0, color: "#6DC4C6" },
        { name: "Sudah Skrining", value: 0, color: "#E284B3" },
      ]
    }

    const { completed, notCompleted } = metrics.status.screening

    return [
      { name: "Belum Skrining", value: notCompleted || 0, color: "#6DC4C6" },
      { name: "Sudah Skrining", value: completed || 0, color: "#E284B3" },
    ]
  }, [metrics?.status?.screening])

  // Get data for counseling status pie chart
  const getCounselingData = useCallback(() => {
    if (!metrics?.status?.counseling) {
      return [
        { name: "Belum Konseling", value: 0, color: "#C194E9" },
        { name: "Sudah Konseling", value: 0, color: "#F1D961" },
      ]
    }

    const { completed, notCompleted } = metrics.status.counseling

    return [
      { name: "Belum Konseling", value: notCompleted || 0, color: "#C194E9" },
      { name: "Sudah Konseling", value: completed || 0, color: "#F1D961" },
    ]
  }, [metrics?.status?.counseling])

  const handleCardClick = useCallback((cardId) => {
    if (showingList && activeCard === cardId) {
      // If already showing this card's list, toggle back to dashboard
      setShowingList(false)
    } else {
      // Otherwise show the list for this card
      setShowingList(true)
      setActiveCard(cardId)
    }
  }, [showingList, activeCard])

  const handleCloseList = useCallback(() => {
    setShowingList(false)
  }, [])

  const handleReport = useCallback((reportType) => {
    setReportType(reportType)
    setShowReportModal(true)
  }, [])

  // Custom tooltip
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }, [])

  // Custom label for pie chart
  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (value === 0) return null // Don't show label for zero values
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }, [])

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-zinc-400 text-sm">
        <span className="material-icons animate-spin mr-2">refresh</span>
        Memuat dashboard...
      </div>
    )
  }
  
  // Enhanced error state
  if (isError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[80vh] p-4">
        <div className="flex flex-col items-center text-center p-6 max-w-md">
          <span className="material-icons text-red-500 text-4xl mb-4">error_outline</span>
          <p className="text-red-500 font-semibold mb-2">Gagal memuat data dashboard</p>
          <p className="text-gray-600 mb-4 text-sm">
            {error?.message || "Terjadi kesalahan saat mengambil data."}
          </p>
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

  // Ensure metrics is defined to prevent rendering errors
  if (!metrics || !metrics.summary || !metrics.mentalHealth || !metrics.status) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-zinc-400 text-sm">
        <span className="material-icons text-yellow-500 mr-2">warning</span>
        Data dashboard tidak lengkap
      </div>
    )
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="w-full min-h-screen overflow-x-hidden">
        {/* Header section */}
        <div className="flex items-center justify-end px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[#8b8b8b] text-xs sm:text-sm font-medium">ID / EN</span>
            </div>
            <div className="flex items-center">
              <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">notifications</span>
            </div>
          </div>
        </div>

        {/* Title section */}
        <div className="px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || ""}
          </h1>
        </div>

        {/* Main content */}
        <div className="px-2 sm:px-4 lg:px-6 mt-4 sm:mt-6">
          <div className="max-w-[1110px] mx-auto">
            {/* Metrics Cards */}
            <div className="flex flex-wrap gap-5 mb-4">
              <MetricCard
                title={`Total ${config.entityName} Beresiko`}
                count={metrics.summary?.atRisk?.count || 0}
                total={metrics.summary?.atRisk?.total || 0}
                color="#ED8768"
                bgColor="#FFEBE5"
                borderColor="#ED8768"
                icon="warning"
                isActive={!(activeCard === "at_risk" && showingList)}
                onCardClick={() => handleCardClick("at_risk")}
                onReportClick={() => handleReport(`Daftar ${config.entityName} Beresiko`)}
              />
              <MetricCard
                title={`Total ${config.entityName} Belum Skrining`}
                count={metrics.summary?.notScreened?.count || 0}
                total={metrics.summary?.notScreened?.total || 0}
                color="#8CC3EE"
                bgColor="#E7FEFF"
                borderColor="#B2FDFF"
                icon="assignment"
                isActive={!(activeCard === "not_screened" && showingList)}
                onCardClick={() => handleCardClick("not_screened")}
                onReportClick={() => handleReport(`Daftar ${config.entityName} Belum Skrining`)}
              />
              <MetricCard
                title={`Total ${config.entityName} Belum Konseling`}
                count={metrics.summary?.notCounseled?.count || 0}
                total={metrics.summary?.notCounseled?.total || 0}
                color="#A08CE2"
                bgColor="#F3E6FF"
                borderColor="#E4C6FF"
                icon="groups"
                isActive={!(activeCard === "not_counseled" && showingList)}
                onCardClick={() => handleCardClick("not_counseled")}
                onReportClick={() => handleReport(`Daftar ${config.entityName} Belum Konseling`)}
              />
            </div>

            {/* Toggle between table and dashboard content using AnimatePresence */}
            <AnimatePresence mode="wait">
              {showingList ? (
                <motion.div
                  key="table-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-blue-50 rounded-xl p-4"
                >
                  <DashboardTable
                    type={type}
                    data={tabData?.data?.data?.[type === "student" ? "students" : "employees"] || []}
                    isLoading={tabData?.isLoading || false}
                    onClose={handleCloseList}
                    title={
                      activeCard === "at_risk"
                        ? `${config.entityName} Beresiko`
                        : activeCard === "not_screened"
                          ? `${config.entityName} Belum Skrining`
                          : `${config.entityName} Belum Konseling`
                    }
                    hasNextPage={tabData?.hasNextPage || false}
                    fetchNextPage={tabData?.fetchNextPage || (() => {})}
                    isFetchingNextPage={tabData?.isFetchingNextPage || false}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col px-5 pt-7 pb-4 w-full bg-blue-50 rounded-xl"
                >
                  {/* Mental Health Status Section */}
                  <h2 className="self-start text-lg leading-4 text-primary mb-4">
                    Status <span className="font-bold">Kesehatan Mental </span>
                    <span className="font-bold text-primary-variant1">{config.entityName}</span>
                  </h2>

                  <div className="flex gap-5 max-md:flex-col">
                    {/* Overall Chart */}
                    <div className="w-2/5 max-md:w-full">
                      <div className="flex flex-col px-3.5 py-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500">
                        <div className="flex gap-5 justify-between w-full">
                          <p>Status Kesehatan Mental {config.entityName} Keseluruhan</p>
                          <p className="gap-px self-start leading-6 w-auto">{dateDisplay}</p>
                        </div>
                        <div className="h-[300px] mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getOverallPieData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                innerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {getOverallPieData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex gap-3.5 items-center self-center mt-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-[#ED8768]"></div>
                            <p>Beresiko</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-[#FCBC03]"></div>
                            <p>Pengawasan</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-[#9BCA61]"></div>
                            <p>Aman</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-[#D9D9D9]"></div>
                            <p>Belum Skrining</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtered Chart */}
                    <div className="ml-5 w-3/5 max-md:ml-0 max-md:w-full">
                      <div className="px-3 pt-4 pb-4 w-full bg-white rounded-2xl border border-solid border-zinc-300">
                        <div className="flex flex-wrap gap-5 justify-between w-full text-sm leading-6 text-zinc-500">
                          <p>
                            Status Kesehatan Mental{" "}
                            <span className="font-extrabold">
                              {config.entityName} {config.filterLabel} {selectedFilter}
                              {type === "student" && selectedGrade && ` ${selectedGrade}`}
                            </span>
                          </p>
                          <div className="flex gap-2">
                            {type === "student" ? (
                              <>
                                <Menu as="div" className="relative">
                                  <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
                                    <p className="self-stretch my-auto">{selectedFilter}</p>
                                    <span className="material-icons text-sm">keyboard_arrow_down</span>
                                  </Menu.Button>
                                  <Menu.Items className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    {(options.classrooms || []).map((classroom) => (
                                      <Menu.Item key={classroom}>
                                        {({ active }) => (
                                          <button
                                            className={`${active ? "bg-blue-100 text-primary" : ""} ${
                                              selectedFilter === classroom
                                                ? "bg-primary-light text-primary-variant1 font-semibold"
                                                : ""
                                            } w-full text-left px-4 py-2 text-sm`}
                                            onClick={() => setSelectedFilter(classroom)}
                                          >
                                            {classroom}
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ))}
                                  </Menu.Items>
                                </Menu>
                                <Menu as="div" className="relative">
                                  <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
                                    <p className="self-stretch my-auto">{selectedGrade}</p>
                                    <span className="material-icons text-sm">keyboard_arrow_down</span>
                                  </Menu.Button>
                                  <Menu.Items className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    {(options.grades || ["A", "B", "C", "D"]).map((grade) => (
                                      <Menu.Item key={grade}>
                                        {({ active }) => (
                                          <button
                                            className={`${active ? "bg-blue-100 text-primary" : ""} ${
                                              selectedGrade === grade
                                                ? "bg-primary-light text-primary-variant1 font-semibold"
                                                : ""
                                            } w-full text-left px-4 py-2 text-sm`}
                                            onClick={() => setSelectedGrade(grade)}
                                          >
                                            {grade}
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ))}
                                  </Menu.Items>
                                </Menu>
                              </>
                            ) : (
                              <Menu as="div" className="relative">
                                <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
                                  <p className="self-stretch my-auto">{selectedFilter}</p>
                                  <span className="material-icons text-sm">keyboard_arrow_down</span>
                                </Menu.Button>
                                <Menu.Items className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  {(options.departments || []).map((department) => (
                                    <Menu.Item key={department}>
                                      {({ active }) => (
                                        <button
                                          className={`${active ? "bg-blue-100 text-primary" : ""} ${
                                            selectedFilter === department
                                              ? "bg-primary-light text-primary-variant1 font-semibold"
                                              : ""
                                          } w-full text-left px-4 py-2 text-sm`}
                                          onClick={() => setSelectedFilter(department)}
                                        >
                                          {department}
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ))}
                                </Menu.Items>
                              </Menu>
                            )}
                          </div>
                        </div>
                        <div className="h-[336px] mt-4 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={getSemesterData()}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                              barSize={12}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="atRisk" fill="#ED8768" name="Beresiko" />
                              <Bar dataKey="monitored" fill="#FCBC03" name="Pengawasan" />
                              <Bar dataKey="stable" fill="#9BCA61" name="Aman" />
                            </BarChart>
                          </ResponsiveContainer>

                          {/* Navigation arrows - disabled for now */}
                          <button
                            disabled={true}
                            className="absolute left-0 top-[168px] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 cursor-not-allowed text-gray-500"
                          >
                            <span className="material-icons text-white">chevron_left</span>
                          </button>

                          <button
                            disabled={true}
                            className="absolute right-0 top-[168px] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 cursor-not-allowed text-gray-500"
                          >
                            <span className="material-icons text-white">chevron_right</span>
                          </button>
                        </div>

                        {/* Year display and legend */}
                        <div className="flex flex-col items-center mt-4">
                          <div className="text-sm text-gray-600 mb-2">2025</div>
                          <div className="flex gap-3.5 items-center justify-center whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#ED8768]"></div>
                              <p>Beresiko</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#FCBC03]"></div>
                              <p>Pengawasan</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#9BCA61]"></div>
                              <p>Aman</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Sections - Menyambung dengan background yang sama */}
                  <div className="mt-4 w-full">
                    <div className="flex gap-5 max-md:flex-col">
                      {/* Screening Status */}
                      <div className="w-6/12 max-md:w-full">
                        <div className="flex flex-col grow px-3.5 py-5 w-full bg-white rounded-xl">
                          <h2 className="self-start text-lg leading-4 text-primary">
                            Status <span className="font-bold">Skrining {config.entityName}</span>
                          </h2>
                          <div className="flex flex-col items-end px-5 md:px-10 pt-5 pb-5 mt-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500">
                            <p className="gap-px self-end leading-6 w-auto">{dateDisplay}</p>
                            <div className="h-[300px] w-full mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getScreeningData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {getScreeningData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col md:flex-row gap-3.5 items-center justify-center w-full mt-4">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-[#6DC4C6]"></div>
                                <p>Belum Skrining</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-[#E284B3]"></div>
                                <p>Sudah Skrining</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Counseling Status */}
                      <div className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
                        <div className="flex flex-col grow px-4 py-5 w-full bg-white rounded-xl">
                          <h2 className="self-start text-lg leading-4 text-primary max-md:ml-2">
                            Status <span className="font-bold">Konseling {config.entityName}</span>
                          </h2>
                          <div className="flex flex-col items-end px-5 md:px-10 pt-5 pb-5 mt-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500">
                            <p className="gap-px self-end leading-6 w-auto">{dateDisplay}</p>
                            <div className="h-[300px] w-full mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getCounselingData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {getCounselingData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col md:flex-row gap-3.5 items-center justify-center w-full mt-4">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-[#C194E9]"></div>
                                <p>Belum Konseling</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-[#F1D961]"></div>
                                <p>Sudah Konseling</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Success Modal */}
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