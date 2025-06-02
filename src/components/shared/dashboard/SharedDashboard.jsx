// src/components/shared/dashboard/SharedDashboard.jsx - With simplified filters
import { useState, useEffect, useCallback } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import DashboardTable from "./DashboardTable"
import MetricCard from "./MetricCard"
import DashboardFilters from "./DashboardFilters"
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
  // IMPORTANT: All useState hooks must be declared at the top level unconditionally
  const [showingList, setShowingList] = useState(false)
  const [activeCard, setActiveCard] = useState("at_risk")
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState("")
  const [selectedFilter, setSelectedFilter] = useState(config.defaultFilter || (type === "student" ? "X" : "Finance"))
  const [selectedGrade, setSelectedGrade] = useState(type === "student" ? "A" : "")
  const [dateDisplay, setDateDisplay] = useState("")
  const [currentSemester, setCurrentSemester] = useState("first-half")
  
  // Set up tabData state to avoid conditional hook calls
  const [tabData, setTabData] = useState({ 
    data: null, 
    isLoading: false, 
    hasNextPage: false,
    fetchNextPage: () => {},
    isFetchingNextPage: false
  })

  // Gunakan hook yang diberikan dengan parameter yang tepat
  const filters = {
    year: "2025", // Fixed year as shown in your API examples
    ...(type === "student" 
      ? { classroom: selectedFilter, grade: selectedGrade } 
      : { department: selectedFilter }),
  }

  // Always call hooks regardless of showingList
  const dashboardData = useDashboardHook ? useDashboardHook(type, filters) : {}
  
  // Always call tabDataHook but control its enabled state internally
  const tabDataQuery = useTabDataHook ? useTabDataHook(type, activeCard, { limit: 10 }) : {}
  
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
  
  // Update tabData when tabDataQuery changes
  useEffect(() => {
    if (showingList && tabDataQuery) {
      setTabData({
        data: tabDataQuery.data,
        isLoading: tabDataQuery.isLoading,
        hasNextPage: tabDataQuery.data?.metadata?.hasNextPage || false,
        fetchNextPage: tabDataQuery.fetchNextPage || (() => {}),
        isFetchingNextPage: tabDataQuery.isFetchingNextPage || false
      })
    }
  }, [showingList, tabDataQuery, tabDataQuery?.data])

  // Safely extract data from dashboardData to avoid nested optional chaining in JSX
  const { 
    metrics = {}, 
    options = {}, 
    isLoading = false, 
    isError = false, 
    error = null,
    errorMessage = "",
    user = {}, 
    refetch = () => {} 
  } = dashboardData || {}

  // Calculate semester data from byMonth - wrapped in useCallback to prevent rerenders
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

  // Custom tooltip - wrapped in useCallback
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

  // Custom label - wrapped in useCallback
  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent === 0) return null
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
            {errorMessage || error?.message || "Terjadi kesalahan saat mengambil data."}
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
                                data={[
                                  { name: "Beresiko", value: metrics.mentalHealth?.overall?.atRisk || 0, color: "#ED8768" },
                                  { name: "Pengawasan", value: metrics.mentalHealth?.overall?.monitored || 0, color: "#FCBC03" },
                                  { name: "Aman", value: metrics.mentalHealth?.overall?.stable || 0, color: "#9BCA61" },
                                  {
                                    name: "Belum Skrining",
                                    value: metrics.mentalHealth?.overall?.notScreened || 0,
                                    color: "#D9D9D9",
                                  },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                innerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {[
                                  { color: "#ED8768" },
                                  { color: "#FCBC03" },
                                  { color: "#9BCA61" },
                                  { color: "#D9D9D9" },
                                ].map((entry, index) => (
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
                          
                          {/* Using DashboardFilters component */}
                          <DashboardFilters
                            type={type}
                            selectedFilter={selectedFilter}
                            setSelectedFilter={setSelectedFilter}
                            selectedGrade={selectedGrade}
                            setSelectedGrade={setSelectedGrade}
                            options={options}
                            filterLabel={config.filterLabel}
                          />
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
                                    data={[
                                      {
                                        name: "Belum Skrining",
                                        value: metrics.status?.screening?.notCompleted || 0,
                                        color: "#6DC4C6",
                                      },
                                      {
                                        name: "Sudah Skrining",
                                        value: metrics.status?.screening?.completed || 0,
                                        color: "#E284B3",
                                      },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {[{ color: "#6DC4C6" }, { color: "#E284B3" }].map((entry, index) => (
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
                                    data={[
                                      {
                                        name: "Belum Konseling",
                                        value: metrics.status?.counseling?.notCompleted || 0,
                                        color: "#C194E9",
                                      },
                                      {
                                        name: "Sudah Konseling",
                                        value: metrics.status?.counseling?.completed || 0,
                                        color: "#F1D961",
                                      },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {[{ color: "#C194E9" }, { color: "#F1D961" }].map((entry, index) => (
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