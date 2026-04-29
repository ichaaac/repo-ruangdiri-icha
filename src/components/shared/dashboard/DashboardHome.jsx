import { useCallback, useMemo, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
  Legend,
} from "recharts"
import { Menu } from "@headlessui/react"
import SummaryCard from "./SummaryCard"
import ChartCard from "./ChartCard"
import MonthChip from "./MonthChip"
import CustomBranchingDropdown from "./CustomBranchingDropdown"
import { useAuth } from "../../../hooks/useAuth"
import { useYearlyStats } from "../../../hooks/useDashboardMetrics"
import { getCurrentDateInfo } from "../../../lib/date"

const CHART_COLORS = {
  risk: "#FF7D7D",
  watch: "#FFCB8E",
  safe: "#6DC5D1",
}

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #E2E8F0",
          fontSize: 13,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {label && (
          <p style={{ fontWeight: 600, color: "#334155", marginBottom: 4 }}>
            {label}
          </p>
        )}
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: entry.color || entry.payload?.color,
              }}
            />
            <span style={{ color: "#64748B" }}>{entry.name}:</span>
            <span style={{ fontWeight: 600, color: "#1E293B" }}>{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const DashboardHome = ({
  type = "student",
  metrics = {},
  options = {},
  config = {},
  user = {},
  dateDisplay = "",
  onCardClick = () => {},
}) => {
  const getCurrentYear = () => {
    const currentDate = getCurrentDateInfo()
    return parseInt(currentDate.year)
  }

  const [selectedYear, setSelectedYear] = useState(getCurrentYear())
  const [barChartClassroom, setBarChartClassroom] = useState("")
  const [barChartGrade, setBarChartGrade] = useState("")

  useEffect(() => {
    if (type === "student") {
      if (!barChartClassroom && options?.classrooms?.length > 0) {
        setBarChartClassroom("All")
      }
      if (!barChartGrade && options?.grades?.length > 0) {
        setBarChartGrade("All")
      }
    } else {
      if (!barChartClassroom && options?.departments?.length > 0) {
        setBarChartClassroom("All")
      }
    }
  }, [options, type, barChartClassroom, barChartGrade])

  const { user: authUser } = useAuth?.() || { user: {} }
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.replace(/\/dashboard$/, "")

  const yearlyStatsFilters = useMemo(() => {
    const filters = { year: selectedYear.toString() }
    if (type === "student") {
      filters.classroom = barChartClassroom === "All" ? "All" : (barChartClassroom || "All")
      filters.grade = barChartGrade === "All" ? "All" : (barChartGrade || "All")
    } else {
      filters.department = barChartClassroom === "All" ? "All" : (barChartClassroom || "All")
    }
    return filters
  }, [type, barChartClassroom, barChartGrade, selectedYear])

  const { data: yearlyStatsData } = useYearlyStats(type, yearlyStatsFilters)

  const handleBarChartClassroomChange = useCallback(
    (classroom) => {
      if (classroom !== barChartClassroom) {
        setBarChartClassroom(classroom)
        if (type === "student" && options?.grades?.length > 0) {
          if (barChartGrade !== "All") {
            setBarChartGrade("All")
          } else if (!barChartGrade) {
            setBarChartGrade("All")
          }
        }
      }
    },
    [barChartClassroom, type, options?.grades, barChartGrade],
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
    return yearlyStatsData?.data || []
  }, [yearlyStatsData])

  const getOverallPieData = useCallback(() => {
    const overall = metrics?.mentalHealth?.overall || {}
    const data = [
      { name: "Berisiko", value: overall.atRisk || 0, color: CHART_COLORS.risk },
      { name: "Pengawasan", value: overall.monitored || 0, color: CHART_COLORS.watch },
      { name: "Aman", value: overall.stable || 0, color: CHART_COLORS.safe },
    ]
    const hasData = data.some((item) => item.value > 0)
    if (!hasData) return [{ name: "Tidak ada data", value: 1, color: "#D9D9D9" }]
    return data
  }, [metrics?.mentalHealth?.overall])

  const getScreeningData = useCallback(() => {
    const screening = metrics?.status?.screening || {}
    const data = [
      { name: "Belum Skrining", value: screening.notCompleted || 0, color: CHART_COLORS.safe },
      { name: "Sudah Skrining", value: screening.completed || 0, color: CHART_COLORS.risk },
    ]
    const hasData = data.some((item) => item.value > 0)
    if (!hasData) return [{ name: "Tidak ada data", value: 1, color: "#D9D9D9" }]
    return data
  }, [metrics?.status?.screening])

  const getCounselingData = useCallback(() => {
    const counseling = metrics?.status?.counseling || {}
    const data = [
      { name: "Belum Konseling", value: counseling.notCompleted || 0, color: CHART_COLORS.risk },
      { name: "Sudah Konseling", value: counseling.completed || 0, color: CHART_COLORS.safe },
    ]
    const hasData = data.some((item) => item.value > 0)
    if (!hasData) return [{ name: "Tidak ada data", value: 1, color: "#D9D9D9" }]
    return data
  }, [metrics?.status?.counseling])

  const canNavigateNext = useCallback(() => selectedYear < getCurrentYear() + 1, [selectedYear])
  const canNavigatePrev = useCallback(() => selectedYear > 2024, [selectedYear])
  const handleNext = () => { if (canNavigateNext()) setSelectedYear((prev) => prev + 1) }
  const handlePrev = () => { if (canNavigatePrev()) setSelectedYear((prev) => prev - 1) }

  const renderDonutChart = (data, innerR = 85, outerR = 110) => {
    const total = data.reduce((s, d) => s + d.value, 0)
    const withPct = data.map((d) => ({
      ...d,
      percentage: total > 0 ? `${Math.round((d.value / total) * 100)}%` : "0%",
    }))

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={withPct}
            cx="50%"
            cy="50%"
            innerRadius={innerR}
            outerRadius={outerR}
            paddingAngle={3}
            cornerRadius={6}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {withPct.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={12}
            formatter={(value) => {
              const item = withPct.find((d) => d.name === value)
              return (
                <span style={{ color: "#334155", fontSize: 14, fontWeight: 400, marginLeft: 4 }}>
                  {value} ({item?.percentage || "0%"})
                </span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const summary = metrics?.summary || {}

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <div
        className="flex flex-col"
        style={{ padding: "40px", paddingTop: 40, gap: 32 }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: 24,
              lineHeight: "120%",
              fontWeight: 500,
              color: "#0B0F1A",
            }}
          >
            Halo, {user?.fullName || authUser?.fullName || "Admin"}!
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: "140%",
              fontWeight: 400,
              color: "#6F7480",
              marginTop: 8,
            }}
          >
            Selamat datang kembali! Berikut ringkasan data hari ini.
          </p>
        </div>

        {/* Summary Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 20 }}
        >
          <SummaryCard
            title={`${config.entityName} Belum Skrining`}
            count={summary.notScreened?.count || 0}
            total={summary.notScreened?.total || 0}
            icon="group"
            variant="blue"
            onLihatLaporan={() => navigate(`${basePath}/detail-laporan?type=belum-skrining`)}
          />
          <SummaryCard
            title={`${config.entityName} Berisiko`}
            count={summary.atRisk?.count || 0}
            total={summary.atRisk?.total || 0}
            icon="error_outline"
            variant="pink"
            onLihatLaporan={() => navigate(`${basePath}/detail-laporan?type=berisiko`)}
          />
          <SummaryCard
            title={`${config.entityName} Belum Konseling`}
            count={summary.notCounseled?.count || 0}
            total={summary.notCounseled?.total || 0}
            icon="schedule"
            variant="neutral"
            progressLabel="Progress"
            onLihatLaporan={() => navigate(`${basePath}/detail-laporan?type=belum-konseling`)}
          />
        </div>

        {/* Charts Section */}
        <div className="flex flex-col" style={{ gap: 24 }}>
          <h2
            style={{
              fontSize: 24,
              lineHeight: "120%",
              fontWeight: 500,
              color: "#0B0F1A",
              margin: 0,
            }}
          >
            Status Kesehatan Mental {config.entityName}
          </h2>

          {/* Row 1: Overall donut + Bar chart */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: 24 }}
          >
            <ChartCard
              title={
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 400, color: "#6F7480", lineHeight: "140%", margin: 0 }}>
                    Status Kesehatan Mental {config.entityName}
                  </h3>
                </div>
              }
              chipSlot={<MonthChip label={dateDisplay} />}
              className="min-h-[420px]"
            >
              {renderDonutChart(getOverallPieData(), 85, 110)}
            </ChartCard>

            <ChartCard
              title={
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 400, color: "#6F7480", lineHeight: "140%", margin: 0 }}>
                    Status Kesehatan Mental
                  </h3>
                  <h4 style={{ fontSize: 20, fontWeight: 500, color: "#0F172B", lineHeight: "140%", margin: 0, marginTop: 2 }}>
                    {config.entityName} {type === "student" ? "Kelas " : ""}
                    {barChartClassroom === "All" ? "Semua" : barChartClassroom}
                    {type === "student" && barChartGrade && barChartGrade !== "All" ? ` ${barChartGrade}` : ""}
                    {" - "}{selectedYear}
                  </h4>
                </div>
              }
              chipSlot={
                <div className="flex gap-2" style={{ position: "relative", zIndex: 99999 }}>
                  {type === "student" ? (
                    <CustomBranchingDropdown
                      selectedClassroom={barChartClassroom}
                      selectedGrade={barChartGrade}
                      onClassroomSelect={handleBarChartClassroomChange}
                      onGradeSelect={handleBarChartGradeChange}
                      classrooms={options?.classrooms || []}
                      grades={options?.grades || []}
                      showAllOption={true}
                    />
                  ) : (
                    <Menu as="div" className="relative" style={{ zIndex: 99999 }}>
                      <Menu.Button
                        className="flex items-center gap-1 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: "#EAF2FF",
                          padding: "8px 12px",
                          borderRadius: 12,
                          color: "#2F65CB",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        <span>{barChartClassroom === "All" ? "Semua" : (barChartClassroom || config.filterLabel)}</span>
                        <span className="material-icons text-sm">keyboard_arrow_down</span>
                      </Menu.Button>
                      <Menu.Items
                        className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        style={{ zIndex: 99999 }}
                      >
                        <Menu.Item key="All">
                          {({ active }) => (
                            <div
                              className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                                barChartClassroom === "All"
                                  ? "bg-[#3399E9] text-white font-semibold"
                                  : active ? "bg-[#E2F9FF] text-gray-900" : "text-gray-700 hover:bg-gray-50"
                              }`}
                              onClick={() => handleBarChartDepartmentChange("All")}
                            >
                              Semua
                            </div>
                          )}
                        </Menu.Item>
                        {(options?.departments || []).map((department) => (
                          <Menu.Item key={department}>
                            {({ active }) => (
                              <div
                                className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                                  barChartClassroom === department
                                    ? "bg-[#3399E9] text-white font-semibold"
                                    : active ? "bg-[#E2F9FF] text-gray-900" : "text-gray-700 hover:bg-gray-50"
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
              }
              className="min-h-[420px]"
            >
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getSemesterData()}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                    barGap={6}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 13 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 13 }}
                      domain={[0, 200]}
                      ticks={[0, 50, 100, 150, 200]}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="atRisk" fill={CHART_COLORS.risk} name="Berisiko" radius={[8, 8, 0, 0]} barSize={18} />
                    <Bar dataKey="monitored" fill={CHART_COLORS.watch} name="Pengawasan" radius={[8, 8, 0, 0]} barSize={18} />
                    <Bar dataKey="stable" fill={CHART_COLORS.safe} name="Aman" radius={[8, 8, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Year nav chevrons */}
                <button
                  disabled={!canNavigatePrev()}
                  onClick={handlePrev}
                  className={`absolute flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    canNavigatePrev() ? "text-[#488BBE] hover:text-[#3a7ba8]" : "text-gray-300 cursor-not-allowed"
                  }`}
                  style={{ zIndex: 1, top: "50%", left: "-16px", transform: "translateY(-50%)" }}
                >
                  <span className="material-icons text-2xl">chevron_left</span>
                </button>
                <button
                  disabled={!canNavigateNext()}
                  onClick={handleNext}
                  className={`absolute flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    canNavigateNext() ? "text-[#488BBE] hover:text-[#3a7ba8]" : "text-gray-300 cursor-not-allowed"
                  }`}
                  style={{ zIndex: 1, top: "50%", right: "-16px", transform: "translateY(-50%)" }}
                >
                  <span className="material-icons text-2xl">chevron_right</span>
                </button>
              </div>
            </ChartCard>
          </div>

          {/* Row 2: Screening donut + Counseling donut */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: 24 }}
          >
            <ChartCard
              title={
                <h3 style={{ fontSize: 20, fontWeight: 500, color: "#0F172B", lineHeight: "140%", margin: 0 }}>
                  Status Skrining {config.entityName}
                </h3>
              }
              chipSlot={<MonthChip label={dateDisplay} />}
              className="min-h-[380px]"
            >
              {renderDonutChart(getScreeningData(), 70, 95)}
            </ChartCard>

            <ChartCard
              title={
                <h3 style={{ fontSize: 20, fontWeight: 500, color: "#0F172B", lineHeight: "140%", margin: 0 }}>
                  Status Konseling {config.entityName}
                </h3>
              }
              chipSlot={<MonthChip label={dateDisplay} />}
              className="min-h-[380px]"
            >
              {renderDonutChart(getCounselingData(), 70, 95)}
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
