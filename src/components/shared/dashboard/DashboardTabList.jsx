"use client"

import { motion } from "framer-motion"
import DashboardTable from "./DashboardTable"
import MetricCard from "./MetricCard"
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll"

const DashboardTabList = ({
  type = "student",
  activeCard = "",
  tabData = {},
  config = {},
  metrics = {},
  user = {},
  onClose = () => {},
  onCardClick = () => {},
  onReturnHome = () => {},
}) => {
  const getAllMetrics = () => [
    {
      title: `Total ${config.entityName} Beresiko`,
      count: metrics?.summary?.atRisk?.count || 0,
      total: metrics?.summary?.atRisk?.total || 0,
      color: "#ED8768",
      bgColor: "#FFEBE5",
      borderColor: "#FFC1AF",
      icon: "warning",
      cardId: "at_risk",
    },
    {
      title: `Total ${config.entityName} Belum Skrining`,
      count: metrics?.summary?.notScreened?.count || 0,
      total: metrics?.summary?.notScreened?.total || 0,
      color: "#8CC3EE",
      bgColor: "#E7FEFF",
      borderColor: "#B2FDFF",
      icon: "assignment",
      cardId: "not_screened",
    },
    {
      title: `Total ${config.entityName} Belum Konseling`,
      count: metrics?.summary?.notCounseled?.count || 0,
      total: metrics?.summary?.notCounseled?.total || 0,
      color: "#A08CE2",
      bgColor: "#F3E6FF",
      borderColor: "#E4C6FF",
      icon: "groups",
      cardId: "not_counseled",
    },
  ]

  // Use custom infinite scroll hook
  useInfiniteScroll({
    hasNextPage: tabData?.hasNextPage,
    isFetchingNextPage: tabData?.isFetchingNextPage,
    fetchNextPage: tabData?.fetchNextPage,
  })

  const allMetrics = getAllMetrics()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-end px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[#8b8b8b] text-xs sm:text-sm font-medium">ID / EN</span>
          <span className="material-icons text-[#8b8b8b] text-lg sm:text-xl">notifications</span>
        </div>
      </div>

      {/* Title */}
      <div className="px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8">
        <div className="max-w-[1110px] mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || user?.name || user?.firstName || "User"}
          </h1>
        </div>
      </div>

      {/* Main content dengan spacing yang konsisten */}
      <div className="px-5 mt-4 sm:mt-6">
        <div className="max-w-none mx-auto">
          {/* Cards section - tampilkan semua 3 cards */}
          <div className="flex gap-5 mb-6" style={{ paddingLeft: "70px", paddingRight: "20px" }}>
            {allMetrics.map((metric, index) => {
              const isActiveCard = metric.cardId === activeCard

              return (
                <div key={metric.cardId} className="flex-1">
                  {isActiveCard ? (
                    <div className="bg-[#D7EDFF] rounded-xl pt-6 px-7 pb-10">
                      <div
                        className="rounded-xl"
                        style={{
                          filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))",
                        }}
                      >
                        <MetricCard
                          title={metric.title}
                          count={tabData?.metadata?.totalData || 0}
                          total={metric.total}
                          color={metric.color}
                          bgColor={metric.bgColor}
                          borderColor={metric.borderColor}
                          icon={metric.icon}
                          isActive={false}
                          onCardClick={() => onReturnHome && onReturnHome()}
                          onReportClick={() => {}}
                        />
                      </div>
                    </div>
                  ) : (
                    // Inactive cards tanpa background container
                    <MetricCard
                      title={metric.title}
                      count={metric.count}
                      total={metric.total}
                      color={metric.color}
                      bgColor={metric.bgColor}
                      borderColor={metric.borderColor}
                      icon={metric.icon}
                      isActive={true}
                      onCardClick={() => onCardClick && onCardClick(metric.cardId)}
                      onReportClick={() => {}}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Table section dengan background yang menyatu dengan active card */}
          <div className="bg-[#D7EDFF] rounded-xl" style={{ margin: "0 20px" }}>
            {/* Gap 50px dari atas */}
            <div style={{ height: "50px" }}></div>

            {/* Table section dengan padding 20px dari kiri-kanan */}
            <div style={{ paddingLeft: "20px", paddingRight: "20px", paddingBottom: "20px" }}>
              <DashboardTable
                type={type}
                data={tabData?.data?.students || tabData?.data?.employees || []}
                isLoading={tabData?.isLoading || false}
                title=""
                hasNextPage={tabData?.hasNextPage}
                fetchNextPage={tabData?.fetchNextPage}
                isFetchingNextPage={tabData?.isFetchingNextPage}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default DashboardTabList
