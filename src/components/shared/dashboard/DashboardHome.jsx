// src/components/shared/dashboard/DashboardHome.jsx - Enhanced with hover effects and modal

import { useCallback, useState, useEffect } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Menu } from "@headlessui/react"
import MetricCard from "./MetricCard"
import CustomBranchingDropdown from "./CustomBranchingDropdown"
import EmailNotificationModal from "./EmailNotificationModal"
import { useAuth } from "../../../hooks/useAuth"
import { useYearlyStats } from "../../../hooks/useDashboardMetrics"
import TopRightControl from "../layout/TopRightControl"

const DashboardHome = ({
  type = "student",
  metrics = {},
  options = {},
  config = {},
  user = {},
  dateDisplay = "",
  onCardClick = () => {},
  onReportClick = () => {},
  sidebarExpanded = false,
}) => {
  const [currentHalf, setCurrentHalf] = useState("firstHalf")
  const [barChartClassroom, setBarChartClassroom] = useState("")
  const [barChartGrade, setBarChartGrade] = useState("")
  
  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [reportName, setReportName] = useState("")
  
  // PieChart hover states
  const [hoveredPieIndex, setHoveredPieIndex] = useState(-1)
  const [screeningHoveredIndex, setScreeningHoveredIndex] = useState(-1)
  const [counselingHoveredIndex, setCounselingHoveredIndex] = useState(-1)
  
  useEffect(() => {
    if (type === "student") {
      if (!barChartClassroom && options?.classrooms?.length > 0) {
        setBarChartClassroom(options.classrooms[0] || "X")
      }
      if (!barChartGrade && options?.grades?.length > 0) {
        setBarChartGrade(options.grades[0] || "A")
      }
    } else {
      if (!barChartClassroom && options?.departments?.length > 0) {
        setBarChartClassroom(options.departments[0] || "Finance")
      }
    }
  }, [options, type, barChartClassroom, barChartGrade])
  
  const { user: authUser } = useAuth?.() || { user: {} }

  const { data: yearlyStatsData } = useYearlyStats(type, {
    year: "2025",
    ...(type === "student" 
      ? { classroom: barChartClassroom, grade: barChartGrade }
      : { department: barChartClassroom }),
  })

  const handleBarChartClassroomChange = useCallback((classroom) => {
    if (classroom !== barChartClassroom) {
      setBarChartClassroom(classroom)
      // Reset grade when classroom changes for student type
      if (type === "student" && options?.grades?.length > 0) {
        setBarChartGrade(options.grades[0] || "A")
      }
    }
  }, [barChartClassroom, type, options?.grades])

  const handleBarChartGradeChange = useCallback((grade) => {
    if (grade !== barChartGrade) setBarChartGrade(grade)
  }, [barChartGrade])

  const handleBarChartDepartmentChange = useCallback((department) => {
    if (department !== barChartClassroom) setBarChartClassroom(department)
  }, [barChartClassroom])

  const getSemesterData = useCallback(() => {
    const yearlyData = yearlyStatsData?.data || []
    const allMonths = currentHalf === "firstHalf"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      : ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return allMonths.map((month) => {
      const existingData = yearlyData.find((item) => item.month === month)
      return existingData || { month, atRisk: 0, monitored: 0, stable: 0 }
    })
  }, [yearlyStatsData, currentHalf])

  const getOverallPieData = useCallback(() => {
    const overall = metrics?.mentalHealth?.overall || {}
    return [
      { name: "Berisiko", value: overall.atRisk || 0, color: "#ED8768" },
      { name: "Pengawasan", value: overall.monitored || 0, color: "#FCBC03" },
      { name: "Aman", value: overall.stable || 0, color: "#9BCA61" },
    ]
  }, [metrics?.mentalHealth?.overall])

  const getScreeningData = useCallback(() => {
    const screening = metrics?.status?.screening || {}
    return [
      { name: "Belum Skrining", value: screening.notCompleted || 0, color: "#6DC4C6" },
      { name: "Sudah Skrining", value: screening.completed || 0, color: "#E284B3" },
    ]
  }, [metrics?.status?.screening])

  const getCounselingData = useCallback(() => {
    const counseling = metrics?.status?.counseling || {}
    return [
      { name: "Belum Konseling", value: counseling.notCompleted || 0, color: "#C194E9" },
      { name: "Sudah Konseling", value: counseling.completed || 0, color: "#F1D961" },
    ]
  }, [metrics?.status?.counseling])

  const canNavigateNext = useCallback(() => {
    const yearlyData = yearlyStatsData?.data || []
    if (currentHalf === "firstHalf") {
      const secondHalfMonths = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return yearlyData.some(item => secondHalfMonths.includes(item.month))
    }
    return false
  }, [yearlyStatsData, currentHalf])

  const canNavigatePrev = useCallback(() => currentHalf === "secondHalf", [currentHalf])

  const handleNext = () => {
    if (canNavigateNext() && currentHalf === "firstHalf") {
      setCurrentHalf("secondHalf")
    }
  }

  const handlePrev = () => {
    if (canNavigatePrev()) setCurrentHalf("firstHalf")
  }

  // Handle report click with modal
  const handleReportClickWithModal = (reportTitle) => {
    setReportName(reportTitle)
    setShowEmailModal(true)
    onReportClick(reportTitle) // Still call original handler
  }

  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }, [])

  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (value === 0) return null

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }, [])

  // Enhanced PieChart with hover effects
  const renderEnhancedPieChart = (data, hoveredIndex, setHoveredIndex, chartKey) => {
    return (
      <ResponsiveContainer width="100%" height="100%" key={`${chartKey}-pie-enhanced`}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            innerRadius="50%"
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={false}
            onMouseEnter={(_, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={hoveredIndex === index ? entry.color : "none"}
                strokeWidth={hoveredIndex === index ? 3 : 0}
                style={{
                  filter: hoveredIndex === index ? "brightness(1.1)" : "none",
                  transform: hoveredIndex === index ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "all 0.2s ease-in-out"
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-black/80 text-white text-sm rounded-md p-2 shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p>{`Jumlah: ${data.value}`}</p>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <TopRightControl isAbsolute />

      <div className="px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8 pt-[72px]">
        <div className="w-full lg:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || authUser?.fullName || "User"}
          </h1>
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <MetricCard
              title={`Total ${config.entityName} Berisiko`}
              count={metrics.summary?.atRisk?.count || 0}
              total={metrics.summary?.atRisk?.total || 0}
              color="#ED8768"
              bgColor="#FFEBE5"
              borderColor="#ED8768"
              icon="warning"
              isActive={true}
              isDisabled={(metrics.summary?.atRisk?.count || 0) === 0}
              onCardClick={() => onCardClick("at_risk")}
              onReportClick={() => handleReportClickWithModal(`Daftar ${config.entityName} Berisiko`)}
            />
            <MetricCard
              title={`Total ${config.entityName} Belum Skrining`}
              count={metrics.summary?.notScreened?.count || 0}
              total={metrics.summary?.notScreened?.total || 0}
              color="#8CC3EE"
              bgColor="#E7FEFF"
              borderColor="#B2FDFF"
              icon="assignment"
              isActive={true}
              isDisabled={(metrics.summary?.notScreened?.count || 0) === 0}
              onCardClick={() => onCardClick("not_screened")}
              onReportClick={() => handleReportClickWithModal(`Daftar ${config.entityName} Belum Skrining`)}
            />
            <MetricCard
              title={`Total ${config.entityName} Belum Konseling`}
              count={metrics.summary?.notCounseled?.count || 0}
              total={metrics.summary?.notCounseled?.total || 0}
              color="#A08CE2"
              bgColor="#F3E6FF"
              borderColor="#E4C6FF"
              icon="groups"
              isActive={true}
              isDisabled={(metrics.summary?.notCounseled?.count || 0) === 0}
              onCardClick={() => onCardClick("not_counseled")}
              onReportClick={() => handleReportClickWithModal(`Daftar ${config.entityName} Belum Konseling`)}
            />
          </div>
        </div>

        <div 
          className="bg-blue-50 rounded-tl-xl rounded-tr-xl p-3 sm:p-5"
          style={{
            width: '100%',
            maxWidth: `calc(100% - 40px)`,
            marginLeft: '20px',
            marginRight: '20px',
            position: 'relative',
            zIndex: 1,
          }}          
        >
          <h2 className="text-lg leading-4 text-primary mb-4">
            Status <span className="font-bold">Kesehatan Mental </span>
            <span className="font-bold text-primary">{config.entityName}</span>
          </h2>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
            <div className="w-full lg:w-2/5">
              <div className="flex flex-col h-full px-3 sm:px-4 py-4 sm:py-5 w-full text-sm bg-white rounded-2xl border border-solid border-zinc-300 text-zinc-500">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 justify-between w-full mb-4">
                  <p className="text-xs sm:text-sm">Status Kesehatan Mental {config.entityName} Keseluruhan</p>
                  <p className="text-xs sm:text-sm text-right">{dateDisplay}</p>
                </div>
                <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full">
                  {renderEnhancedPieChart(getOverallPieData(), hoveredPieIndex, setHoveredPieIndex, "overall")}
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center mt-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#ED8768]"></div>
                    <p className="text-xs sm:text-sm">Berisiko</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FCBC03]"></div>
                    <p className="text-xs sm:text-sm">Pengawasan</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#9BCA61]"></div>
                    <p className="text-xs sm:text-sm">Aman</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-3/5">
              <div 
                className="h-full px-3 sm:px-4 pt-4 pb-4 w-full bg-white rounded-2xl border border-solid border-zinc-300 flex flex-col"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <div 
                  className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-between w-full text-sm leading-6 text-zinc-500 mb-4"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <p className="text-xs sm:text-sm">
                    Status Kesehatan Mental{" "}
                    <span className="font-extrabold">
                      {config.entityName} {barChartClassroom}
                      {type === "student" && barChartGrade ? ` ${barChartGrade}` : ""}
                    </span>
                  </p>
                  <div className="flex gap-2 flex-shrink-0" style={{ position: 'relative', zIndex: 1000 }}>
                    {type === "student" ? (
                      <div className="relative">
                        <CustomBranchingDropdown
                          selectedClassroom={barChartClassroom}
                          selectedGrade={barChartGrade}
                          onClassroomSelect={handleBarChartClassroomChange}
                          onGradeSelect={handleBarChartGradeChange}
                          classrooms={options?.classrooms || []}
                          grades={options?.grades || []}
                        />
                      </div>
                    ) : (
                      <Menu as="div" className="relative">
                        <Menu.Button className="flex gap-1 items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors bg-white cursor-pointer text-gray-700">
                          <span className="self-stretch my-auto">{barChartClassroom || config.filterLabel}</span>
                          <span className="material-icons text-sm text-gray-500">keyboard_arrow_down</span>
                        </Menu.Button>
                        <Menu.Items 
                          className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                          style={{ zIndex: 9999 }}
                        >
                          {(options?.departments || []).map((department) => (
                            <Menu.Item key={department}>
                              {({ active }) => (
                                <div
                                  className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                                    barChartClassroom === department 
                                      ? "bg-[#3399E9] text-white font-semibold" 
                                      : active 
                                        ? "bg-[#E2F9FF] text-gray-900" 
                                        : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                  onClick={() => handleBarChartDepartmentChange(department)}
                                >
                                  {department}
                                </div>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Menu>
                    )}
                  </div>
                </div>
                
                <div className="text-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-600">2025</h3>
                </div>
                
                <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full relative overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getSemesterData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="atRisk" fill="#ED8768" name="Berisiko" />
                      <Bar dataKey="monitored" fill="#FCBC03" name="Pengawasan" />
                      <Bar dataKey="stable" fill="#9BCA61" name="Aman" />
                    </BarChart>
                  </ResponsiveContainer>

                  <button
                    disabled={!canNavigatePrev()}
                    onClick={handlePrev}
                    className={`absolute left-1 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full transition-colors z-0 ${
                      canNavigatePrev()
                        ? "text-[#488BBE] hover:text-[#3a7ba8] hover:bg-blue-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-icons text-xl sm:text-2xl">chevron_left</span>
                  </button>
                  <button
                    disabled={!canNavigateNext()}
                    onClick={handleNext}
                    className={`absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full transition-colors z-0 ${
                      canNavigateNext()
                        ? "text-[#488BBE] hover:text-[#3a7ba8] hover:bg-blue-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-icons text-xl sm:text-2xl">chevron_right</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center mt-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#ED8768]"></div>
                    <p className="text-xs sm:text-sm">Berisiko</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#FCBC03]"></div>
                    <p className="text-xs sm:text-sm">Pengawasan</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#9BCA61]"></div>
                    <p className="text-xs sm:text-sm">Aman</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 w-full">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 mb-6">
              {/* Status Skrining Section */}
              <div className="w-full lg:w-6/12">
                <h2 className="text-base sm:text-lg leading-4 text-primary mb-4">
                  Status <span className="font-bold">Skrining {config.entityName}</span>
                </h2>
                <div className="w-full bg-white rounded-xl border border-solid border-zinc-300 overflow-hidden">
                  <div className="px-4 py-4">
                    <p className="text-xs sm:text-sm text-right mb-4 text-zinc-500">{dateDisplay}</p>
                    
                    <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full">
                      {renderEnhancedPieChart(getScreeningData(), screeningHoveredIndex, setScreeningHoveredIndex, "screening")}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center w-full mt-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#6DC4C6]"></div>
                        <p className="text-xs sm:text-sm">Belum Skrining</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#E284B3]"></div>
                        <p className="text-xs sm:text-sm">Sudah Skrining</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Konseling Section */}
              <div className="w-full lg:w-6/12">
                <h2 className="text-base sm:text-lg leading-4 text-primary mb-4">
                  Status <span className="font-bold">Konseling {config.entityName}</span>
                </h2>
                <div className="w-full bg-white rounded-xl border border-solid border-zinc-300 overflow-hidden">
                  <div className="px-4 py-4">
                    <p className="text-xs sm:text-sm text-right mb-4 text-zinc-500">{dateDisplay}</p>
                    
                    <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full">
                      {renderEnhancedPieChart(getCounselingData(), counselingHoveredIndex, setCounselingHoveredIndex, "counseling")}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center w-full mt-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#C194E9]"></div>
                        <p className="text-xs sm:text-sm">Belum Konseling</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#F1D961]"></div>
                        <p className="text-xs sm:text-sm">Sudah Konseling</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Notification Modal */}
      <EmailNotificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportName={reportName}
        entityName={config.entityName}
        userEmail={user?.email || authUser?.email || "a******@gmail.com"}
      />
    </div>
  )
}

export default DashboardHome