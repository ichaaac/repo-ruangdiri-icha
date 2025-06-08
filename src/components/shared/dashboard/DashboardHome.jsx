"use client"

import { useCallback, useState } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Menu } from "@headlessui/react"
import MetricCard from "./MetricCard"
import CustomBranchingDropdown from "./CustomBranchingDropdown"
import { useAuth } from "../../../hooks/useAuth"

const DashboardHome = ({
  type = "student",
  metrics = {},
  options = {},
  config = {},
  user = {},
  dateDisplay = "",
  currentSemester = "first-half",
  selectedFilter = "",
  selectedGrade = "",
  setSelectedFilter = () => {},
  setSelectedGrade = () => {},
  onCardClick = () => {},
  onReportClick = () => {},
  refetchDashboard = () => {}, // Add refetch function
}) => {
  const [currentHalf, setCurrentHalf] = useState("firstHalf")
  const [isUpdating, setIsUpdating] = useState(false)

  // Get user role to handle permissions
  const { user: authUser } = useAuth?.() || { user: {} }
  const userRole = authUser?.role || ""

  // Fetch data based on user role - use options from useDashboard instead of separate calls
  const classroomOptions = options?.classrooms || []
  const gradeOptions = options?.grades || []
  const departmentOptions = options?.departments || []

  // Handle dropdown changes without page reload - trigger refetch
  const handleClassroomChange = useCallback(
    (classroom) => {
      if (isUpdating) return

      setIsUpdating(true)
      setSelectedFilter(classroom)

      // Prevent multiple rapid updates
      setTimeout(() => {
        setIsUpdating(false)
      }, 300)
    },
    [setSelectedFilter, isUpdating],
  )

  const handleGradeChange = useCallback(
    (grade) => {
      if (isUpdating) return

      setIsUpdating(true)
      setSelectedGrade(grade)

      // Prevent multiple rapid updates
      setTimeout(() => {
        setIsUpdating(false)
      }, 300)
    },
    [setSelectedGrade, isUpdating],
  )

  const handleDepartmentChange = useCallback(
    (department) => {
      if (isUpdating) return

      setIsUpdating(true)
      setSelectedFilter(department)

      // Prevent multiple rapid updates
      setTimeout(() => {
        setIsUpdating(false)
      }, 300)
    },
    [setSelectedFilter, isUpdating],
  )

  // Chart data processors
  const getSemesterData = useCallback(() => {
    const byMonth = metrics?.mentalHealth?.byMonth || {}
    const currentData = byMonth[currentHalf] || []

    // Ensure all months are present
    const allMonths =
      currentHalf === "firstHalf"
        ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        : ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return allMonths.map((month) => {
      const existingData = currentData.find((item) => item.month === month)
      return (
        existingData || {
          month,
          atRisk: 0,
          monitored: 0,
          stable: 0,
        }
      )
    })
  }, [metrics?.mentalHealth?.byMonth, currentHalf])

  const getOverallPieData = useCallback(() => {
    const overall = metrics?.mentalHealth?.overall || {}
    return [
      { name: "Beresiko", value: overall.atRisk || 0, color: "#ED8768" },
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

  // Navigation functions
  const canNavigateNext = useCallback(() => {
    const byMonth = metrics?.mentalHealth?.byMonth || {}
    if (currentHalf === "firstHalf") {
      return byMonth.secondHalf && byMonth.secondHalf.length > 0
    }
    return false
  }, [metrics?.mentalHealth?.byMonth, currentHalf])

  const canNavigatePrev = useCallback(() => {
    return currentHalf === "secondHalf"
  }, [currentHalf])

  const handleNext = () => {
    if (canNavigateNext()) {
      if (currentHalf === "firstHalf") {
        setCurrentHalf("secondHalf")
      }
    }
  }

  const handlePrev = () => {
    if (canNavigatePrev()) {
      setCurrentHalf("firstHalf")
    }
  }

  // Chart components
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
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }, [])

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-end px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[#8b8b8b] text-xs sm:text-sm font-medium">ID / EN</span>
          <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">notifications</span>
        </div>
      </div>

      {/* Title - Use ListPage approach */}
      <div className="px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8">
        <div className="max-w-[1110px] mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || authUser?.fullName || ""}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="px-2 sm:px-4 lg:px-6 mt-4 sm:mt-6">
        <div className="max-w-[1110px] mx-auto">
          {/* Metrics Cards */}
          <div className="flex gap-5 mb-6" style={{ paddingLeft: "calc(20px)", paddingRight: "calc(20px)" }}>
            <MetricCard
              title={`Total ${config.entityName} Beresiko`}
              count={metrics.summary?.atRisk?.count || 0}
              total={metrics.summary?.atRisk?.total || 0}
              color="#ED8768"
              bgColor="#FFEBE5"
              borderColor="#ED8768"
              icon="warning"
              isActive={false}
              onCardClick={() => onCardClick("at_risk")}
              onReportClick={() => onReportClick(`Daftar ${config.entityName} Beresiko`)}
            />
            <MetricCard
              title={`Total ${config.entityName} Belum Skrining`}
              count={metrics.summary?.notScreened?.count || 0}
              total={metrics.summary?.notScreened?.total || 0}
              color="#8CC3EE"
              bgColor="#E7FEFF"
              borderColor="#B2FDFF"
              icon="assignment"
              isActive={false}
              onCardClick={() => onCardClick("not_screened")}
              onReportClick={() => onReportClick(`Daftar ${config.entityName} Belum Skrining`)}
            />
            <MetricCard
              title={`Total ${config.entityName} Belum Konseling`}
              count={metrics.summary?.notCounseled?.count || 0}
              total={metrics.summary?.notCounseled?.total || 0}
              color="#A08CE2"
              bgColor="#F3E6FF"
              borderColor="#E4C6FF"
              icon="groups"
              isActive={false}
              onCardClick={() => onCardClick("not_counseled")}
              onReportClick={() => onReportClick(`Daftar ${config.entityName} Belum Konseling`)}
            />
          </div>

          {/* Dashboard Content */}
          <div className="flex flex-col px-5 pt-7 pb-4 w-full bg-blue-50 rounded-xl">
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
                  <div className="h-[336px] mt-4">
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
                  <div className="flex gap-3.5 items-center justify-center mt-4 whitespace-nowrap">
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

              {/* Filtered Chart */}
              <div className="ml-5 w-3/5 max-md:ml-0 max-md:w-full">
                <div className="px-3 pt-4 pb-4 w-full bg-white rounded-2xl border border-solid border-zinc-300">
                  <div className="flex flex-wrap gap-5 justify-between w-full text-sm leading-6 text-zinc-500">
                    <p>
                      Status Kesehatan Mental{" "}
                      <span className="font-extrabold">
                        {config.entityName} {selectedFilter} {selectedGrade}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      {type === "student" ? (
                        <CustomBranchingDropdown
                          selectedClassroom={selectedFilter}
                          selectedGrade={selectedGrade}
                          onClassroomSelect={handleClassroomChange}
                          onGradeSelect={handleGradeChange}
                          classrooms={classroomOptions}
                          grades={gradeOptions}
                        />
                      ) : (
                        <Menu as="div" className="relative">
                          <Menu.Button className="flex gap-px items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors">
                            <p className="self-stretch my-auto">{selectedFilter || config.filterLabel}</p>
                            <span className="material-icons text-sm">keyboard_arrow_down</span>
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            {departmentOptions.map((department) => (
                              <Menu.Item key={department}>
                                {({ active }) => (
                                  <button
                                    type="button"
                                    className={`${active ? "bg-blue-100" : ""} ${
                                      selectedFilter === department ? "bg-[#3399E9] text-white font-semibold" : ""
                                    } w-full text-left px-4 py-2 text-sm`}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleDepartmentChange(department)
                                    }}
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
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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

                    {/* Navigation arrows */}
                    <button
                      disabled={!canNavigatePrev()}
                      onClick={handlePrev}
                      className={`absolute left-0 top-[168px] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full ${
                        canNavigatePrev()
                          ? "bg-[#488BBE] hover:bg-[#3a7ba8] text-white"
                          : "bg-gray-300 cursor-not-allowed text-gray-500"
                      }`}
                    >
                      <span className="material-icons text-white">chevron_left</span>
                    </button>
                    <button
                      disabled={!canNavigateNext()}
                      onClick={handleNext}
                      className={`absolute right-0 top-[168px] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full ${
                        canNavigateNext()
                          ? "bg-[#488BBE] hover:bg-[#3a7ba8] text-white"
                          : "bg-gray-300 cursor-not-allowed text-gray-500"
                      }`}
                    >
                      <span className="material-icons text-white">chevron_right</span>
                    </button>
                  </div>

                  {/* Legend only - removed year display */}
                  <div className="flex gap-3.5 items-center justify-center mt-4 whitespace-nowrap">
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

            {/* Status Sections */}
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
