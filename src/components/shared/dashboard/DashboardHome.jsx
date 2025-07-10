
// src/components/shared/dashboard/DashboardHome.jsx - Smooth zoom with moving labels

import { useCallback, useState, useEffect, useRef } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts"
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

  // Tooltip states
  const [showOverallTooltip, setShowOverallTooltip] = useState(false)
  const [showScreeningTooltip, setShowScreeningTooltip] = useState(false)
  const [showCounselingTooltip, setShowCounselingTooltip] = useState(false)

  // Timeout refs
  const hoverTimeoutRef = useRef(null)
  const screeningTimeoutRef = useRef(null)
  const counselingTimeoutRef = useRef(null)
  const tooltipTimeoutRef = useRef(null)
  const screeningTooltipTimeoutRef = useRef(null)
  const counselingTooltipTimeoutRef = useRef(null)

  const HOVER_DELAY = 25

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

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (screeningTimeoutRef.current) clearTimeout(screeningTimeoutRef.current)
      if (counselingTimeoutRef.current) clearTimeout(counselingTimeoutRef.current)
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current)
      if (screeningTooltipTimeoutRef.current) clearTimeout(screeningTooltipTimeoutRef.current)
      if (counselingTooltipTimeoutRef.current) clearTimeout(counselingTooltipTimeoutRef.current)
    }
  }, [])

  const { user: authUser } = useAuth?.() || { user: {} }

  const { data: yearlyStatsData } = useYearlyStats(type, {
    year: "2025",
    ...(type === "student"
      ? { classroom: barChartClassroom, grade: barChartGrade }
      : { department: barChartClassroom }),
  })

  const handleBarChartClassroomChange = useCallback(
    (classroom) => {
      if (classroom !== barChartClassroom) {
        setBarChartClassroom(classroom)
        if (type === "student" && options?.grades?.length > 0) {
          setBarChartGrade(options.grades[0] || "A")
        }
      }
    },
    [barChartClassroom, type, options?.grades],
  )

  const handleBarChartGradeChange = useCallback(
    (grade) => {
      if (grade !== barChartGrade) setBarChartGrade(grade)
    },
    [barChartGrade],
  )

  const handleBarChartDepartmentChange = useCallback(
    (department) => {
      if (department !== barChartClassroom) setBarChartClassroom(department)
    },
    [barChartClassroom],
  )

  const getSemesterData = useCallback(() => {
    const yearlyData = yearlyStatsData?.data || []
    const allMonths =
      currentHalf === "firstHalf"
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
      return yearlyData.some((item) => secondHalfMonths.includes(item.month))
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

  const handleReportClickWithModal = (reportTitle) => {
    setReportName(reportTitle)
    setShowEmailModal(true)
    onReportClick(reportTitle)
  }

  // Enhanced label renderer yang ikut bergerak dengan zoom
  const renderCustomizedLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, index }, hoveredIndex) => {
      if (value === 0) return null

      const RADIAN = Math.PI / 180
      // Adjust radius based on hover state - jika di-hover, radius lebih besar
      const isHovered = hoveredIndex === index
      const adjustedOuterRadius = isHovered ? outerRadius + 10 : outerRadius
      const radius = innerRadius + (adjustedOuterRadius - innerRadius) * 0.5
      const x = cx + radius * Math.cos(-midAngle * RADIAN)
      const y = cy + radius * Math.sin(-midAngle * RADIAN)

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          style={{
            pointerEvents: "none",
            transition: "all 0.25s ease-out", // Smooth transition untuk label
          }}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      )
    },
    [],
  )

  // Active shape dengan smooth zoom
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            transition: "all 0.25s ease-out",
          }}
        />
      </g>
    )
  }

  const createDelayedHoverHandlers = (setHoveredIndex, setShowTooltip, hoverTimeoutRef, tooltipTimeoutRef) => {
    const handleMouseEnter = (_, index) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current)

      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredIndex(index)
      }, HOVER_DELAY)

      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true)
      }, HOVER_DELAY)
    }

    const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
        tooltipTimeoutRef.current = null
      }

      setHoveredIndex(-1)
      setShowTooltip(false)
    }

    return { handleMouseEnter, handleMouseLeave }
  }

  const overallHandlers = createDelayedHoverHandlers(
    setHoveredPieIndex,
    setShowOverallTooltip,
    hoverTimeoutRef,
    tooltipTimeoutRef,
  )

  const screeningHandlers = createDelayedHoverHandlers(
    setScreeningHoveredIndex,
    setShowScreeningTooltip,
    screeningTimeoutRef,
    screeningTooltipTimeoutRef,
  )

  const counselingHandlers = createDelayedHoverHandlers(
    setCounselingHoveredIndex,
    setShowCounselingTooltip,
    counselingTimeoutRef,
    counselingTooltipTimeoutRef,
  )

  const renderEnhancedPieChart = (data, hoveredIndex, showTooltip, handlers) => {
    return (
      <div style={{ width: "280px", height: "280px", margin: "0 auto" }} onMouseLeave={handlers.handleMouseLeave}>
        <PieChart width={280} height={280}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) => renderCustomizedLabel(props, hoveredIndex)} // Pass hoveredIndex ke label
            outerRadius="80%"
            innerRadius="50%"
            dataKey="value"
            isAnimationActive={false}
            activeIndex={hoveredIndex}
            activeShape={renderActiveShape}
            onMouseEnter={handlers.handleMouseEnter}
            onMouseLeave={handlers.handleMouseLeave}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg text-sm p-2">
                      <p className="font-semibold text-gray-900">{data.name}</p>
                      <p className="text-gray-600">{`Jumlah: ${data.value}`}</p>
                    </div>
                  )
                }
                return null
              }}
            />
          )}
        </PieChart>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <TopRightControl isAbsolute />
      <div className="px-4 sm:px-6 lg:px-8 xl:px-20 mt-6 sm:mt-8 pt-[72px]">
      <div className="w-full lg:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || authUser?.fullName || "User"}
          </h1>
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-6">
            <div className="w-full">
              <MetricCard
                title={`Total ${config.entityName} Berisiko`}
                count={metrics.summary?.atRisk?.count || 0}
                total={metrics.summary?.atRisk?.total || 0}
                icon="assignment_late"
                isActive={true}
                isDisabled={(metrics.summary?.atRisk?.count || 0) === 0}
                isReportEnabled={(metrics.summary?.atRisk?.count || 0) > 0}
                onCardClick={() => onCardClick("at_risk")}
                onReportClick={() => handleReportClickWithModal(`Daftar ${config.entityName} Berisiko`)}
              />
            </div>
            <div className="w-full">
              <MetricCard
                title={`Total ${config.entityName} Belum Skrining`}
                count={metrics.summary?.notScreened?.count || 0}
                total={metrics.summary?.notScreened?.total || 0}
                icon="article"
                isActive={true}
                isDisabled={(metrics.summary?.notScreened?.count || 0) === 0}
                isReportEnabled={(metrics.summary?.notScreened?.count || 0) > 0}
                onCardClick={() => onCardClick("not_screened")}
                onReportClick={() => handleReportClickWithModal(`Daftar ${config.entityName} Belum Skrining`)}
              />
            </div>
            <div className="w-full">
              <MetricCard
                title={`Total ${config.entityName} Belum Konseling`}
                count={metrics.summary?.notCounseled?.count || 0}
                total={metrics.summary?.notCounseled?.total || 0}
                icon="article"
                isActive={true}
                isDisabled={(metrics.summary?.notCounseled?.count || 0) === 0}
                isReportEnabled={(metrics.summary?.notCounseled?.count || 0) > 0}
                onCardClick={() => onCardClick("not_counseled")}
                onReportClick={() => handleReportClickWithModal(`Daftar ${config.entityName} Belum Konseling`)}
              />
            </div>
          </div>
        </div>

        <div
          className="bg-blue-50 rounded-tl-xl rounded-tr-xl p-3 sm:p-5"
          style={{
            width: "100%",
            maxWidth: `calc(100% - 40px)`,
            marginLeft: "20px",
            marginRight: "20px",
            position: "relative",
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
                  <p className="text-s sm:text-md">Status Kesehatan Mental {config.entityName} Keseluruhan</p>
                  <p className="text-xs sm:text-sm text-right">{dateDisplay}</p>
                </div>
                <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full relative">
                  <div className="absolute inset-0">
                    {renderEnhancedPieChart(getOverallPieData(), hoveredPieIndex, showOverallTooltip, overallHandlers)}
                  </div>
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
                style={{ position: "relative", zIndex: 2 }}
              >
                <div
                  className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-between w-full text-sm leading-6 text-zinc-500 mb-4"
                  style={{ position: "relative", zIndex: 10 }}
                >
                  <p className="text-xs sm:text-sm">
                    Status Kesehatan Mental{" "}
                    <span className="font-extrabold">
                      {config.entityName} {type === "student" ? "Kelas " : ""}
                      {barChartClassroom}
                      {type === "student" && barChartGrade ? ` ${barChartGrade}` : ""}
                    </span>
                  </p>
                  <div className="flex gap-2 flex-shrink-0" style={{ position: "relative", zIndex: 1000 }}>
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
                  <h3 className="text-lg font-bold text-gray-700">2025</h3>
                </div>

                <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full relative overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getSemesterData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="atRisk" fill="#ED8768" name="Berisiko" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="monitored" fill="#FCBC03" name="Pengawasan" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="stable" fill="#9BCA61" name="Aman" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <button
                    disabled={!canNavigatePrev()}
                    onClick={handlePrev}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-full transition-colors z-10 ${
                      canNavigatePrev()
                        ? "text-[#488BBE] hover:text-[#3a7ba8] hover:bg-blue-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-icons text-2xl sm:text-3xl">chevron_left</span>
                  </button>
                  <button
                    disabled={!canNavigateNext()}
                    onClick={handleNext}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-full transition-colors z-10 ${
                      canNavigateNext()
                        ? "text-[#488BBE] hover:text-[#3a7ba8] hover:bg-blue-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-icons text-2xl sm:text-3xl">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 w-full">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 mb-6">
              <div className="w-full lg:w-6/12">
                <h2 className="text-base sm:text-lg leading-4 text-primary mb-4">
                  Status <span className="font-bold">Skrining {config.entityName}</span>
                </h2>
                <div className="w-full bg-white rounded-xl border border-solid border-zinc-300 overflow-hidden">
                  <div className="px-4 py-4">
                    <p className="text-xs sm:text-sm text-right mb-4 text-zinc-500">{dateDisplay}</p>

                    <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full relative">
                      <div className="absolute inset-0">
                        {renderEnhancedPieChart(
                          getScreeningData(),
                          screeningHoveredIndex,
                          showScreeningTooltip,
                          screeningHandlers,
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
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
              </div>

              <div className="w-full lg:w-6/12">
                <h2 className="text-base sm:text-lg leading-4 text-primary mb-4">
                  Status <span className="font-bold">Konseling {config.entityName}</span>
                </h2>
                <div className="w-full bg-white rounded-xl border border-solid border-zinc-300 overflow-hidden">
                  <div className="px-4 py-4">
                    <p className="text-xs sm:text-sm text-right mb-4 text-zinc-500">{dateDisplay}</p>

                    <div className="h-[250px] sm:h-[280px] lg:h-[300px] w-full relative">
                      <div className="absolute inset-0">
                        {renderEnhancedPieChart(
                          getCounselingData(),
                          counselingHoveredIndex,
                          showCounselingTooltip,
                          counselingHandlers,
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
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
      </div>

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
