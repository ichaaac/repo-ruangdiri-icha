import DashboardTable from "./DashboardTable"
import SummaryCard from "./SummaryCard"
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll"
import { useAuth } from "../../../hooks/useAuth"

const DashboardTabList = ({
  type = "student",
  activeCard = "",
  tabData = {},
  config = {},
  metrics = {},
  user = {},
  onCardClick = () => {},
  onReturnHome = () => {},
  sidebarExpanded = false,
}) => {
  const { user: authUser } = useAuth?.() || { user: {} }

  const allMetrics = [
    {
      title: `${config.entityName} Belum Skrining`,
      count: metrics?.summary?.notScreened?.count || 0,
      total: metrics?.summary?.notScreened?.total || 0,
      icon: "group",
      cardId: "not_screened",
      variant: "blue",
    },
    {
      title: `${config.entityName} Berisiko`,
      count: metrics?.summary?.atRisk?.count || 0,
      total: metrics?.summary?.atRisk?.total || 0,
      icon: "error_outline",
      cardId: "at_risk",
      variant: "pink",
    },
    {
      title: `${config.entityName} Belum Konseling`,
      count: metrics?.summary?.notCounseled?.count || 0,
      total: metrics?.summary?.notCounseled?.total || 0,
      icon: "schedule",
      cardId: "not_counseled",
      variant: "neutral",
    },
  ]

  useInfiniteScroll({
    hasNextPage: tabData?.hasNextPage,
    isFetchingNextPage: tabData?.isFetchingNextPage,
    fetchNextPage: tabData?.fetchNextPage,
  })

  return (
    <div className="w-full min-h-screen overflow-x-hidden relative">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-20 mt-6 sm:mt-8 pt-[72px]">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 break-words leading-tight">
          Halo, {user?.fullName || authUser?.fullName || "Admin"}!
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Selamat datang kembali! Berikut ringkasan data hari ini.
        </p>
      </div>

      <div className="mt-4 sm:mt-6 relative">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6 px-4 sm:px-6 lg:px-8 xl:px-20">
          {allMetrics.map((metric) => {
            const isActive = metric.cardId === activeCard
            const isCountZero = metric.count === 0

            return (
              <SummaryCard
                key={metric.cardId}
                title={metric.title}
                count={metric.count}
                total={metric.total}
                icon={metric.icon}
                variant={metric.variant}
                isActive={isActive}
                isInactive={!isActive}
                onLihatLaporan={() => {
                  if (isCountZero) return
                  if (isActive) {
                    onReturnHome()
                  } else {
                    onCardClick(metric.cardId)
                  }
                }}
              />
            )
          })}
        </div>

        {/* Table */}
        <div
          className="bg-[#D7EDFF] rounded-xl overflow-hidden -mt-3"
          style={{ width: "100%", maxWidth: "calc(100% - 32px)", marginLeft: "16px", marginRight: "16px" }}
        >
          <div className="px-6 py-6 h-full">
            <DashboardTable
              type={type}
              data={type === "student" ? (tabData?.data?.students || []) : (tabData?.data?.employees || [])}
              isLoading={false}
              title=""
              hasNextPage={tabData?.hasNextPage}
              fetchNextPage={tabData?.fetchNextPage}
              isFetchingNextPage={tabData?.isFetchingNextPage}
              config={{
                ...config,
                detailPath: type === "student" ? "/organization/school/student" : "/organization/company/employee"
              }}
            />
          </div>
        </div>

        <div style={{ height: "60px" }}></div>
      </div>
    </div>
  )
}

export default DashboardTabList
