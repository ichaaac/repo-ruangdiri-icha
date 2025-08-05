// src/components/shared/dashboard/DashboardTabList.jsx - UPDATED with PDF download support

import { useState } from "react"
import DashboardTable from "./DashboardTable"
import MetricCard from "./MetricCard"
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll"
import { useAuth } from "../../../hooks/useAuth"
import { usePdfReport } from "../../../hooks/useDashboardMetrics"
import TopRightControl from "../layout/TopRightControl"

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
  
  // PDF download hook
  const { downloadPdfReport } = usePdfReport()

  const getAllMetrics = () => [
    {
      title: `Total ${config.entityName} Berisiko`,
      count: metrics?.summary?.atRisk?.count || 0,
      total: metrics?.summary?.atRisk?.total || 0,
      icon: "assignment_late",
      cardId: "at_risk",
    },
    {
      title: `Total ${config.entityName} Belum Skrining`,
      count: metrics?.summary?.notScreened?.count || 0,
      total: metrics?.summary?.notScreened?.total || 0,
      icon: "article",
      cardId: "not_screened",
    },
    {
      title: `Total ${config.entityName} Belum Konseling`,
      count: metrics?.summary?.notCounseled?.count || 0,
      total: metrics?.summary?.notCounseled?.total || 0,
      icon: "article",
      cardId: "not_counseled",
    },
  ]

  // Handle PDF download instead of email modal
  const handleReportDownload = async (reportType) => {
    try {
      const additionalParams = {}
      
      // Add total count to download ALL data instead of just 10
      if (reportType === "at_risk") {
        additionalParams.totalCount = metrics?.summary?.atRisk?.count || 1000
      } else if (reportType === "not_screened") {
        additionalParams.totalCount = metrics?.summary?.notScreened?.count || 1000
      } else if (reportType === "not_counseled") {
        additionalParams.totalCount = metrics?.summary?.notCounseled?.count || 1000
      }

      await downloadPdfReport(type, reportType, additionalParams)
    } catch (error) {
      console.error('Failed to download PDF report:', error)
      // You can add error handling here (toast notification, etc.)
    }
  }

  useInfiniteScroll({
    hasNextPage: tabData?.hasNextPage,
    isFetchingNextPage: tabData?.isFetchingNextPage,
    fetchNextPage: tabData?.fetchNextPage,
  })

  const allMetrics = getAllMetrics()
  const containerPadding = sidebarExpanded 
    ? "px-4 sm:px-6 lg:px-8 xl:pl-20 xl:pr-20"
    : "px-4 sm:px-6 lg:px-8 xl:pl-20 xl:pr-20"

  return (
    <div className="w-full min-h-screen overflow-x-hidden relative">

      <div className="px-4 sm:px-6 lg:px-8 xl:px-20 mt-6 sm:mt-8 pt-[72px]">
        <div className="w-full lg:w-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#488BBE] break-words leading-tight">
            Halo, {user?.fullName || authUser?.fullName || "User"}
          </h1>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 relative">
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-6 ${containerPadding}`}>
          {allMetrics.map((metric) => {
            const isActive = metric.cardId === activeCard
            const isCountZero = metric.count === 0
            
            // FIXED: Always use count from monthly stats (metrics), never from tabData
            // This ensures MetricCard shows consistent data regardless of active state
            const displayCount = metric.count
            
            // Logika untuk mengaktifkan tombol "Kirim Laporan"
            const isReportEnabled = isActive && !isCountZero

            return (
              <div key={metric.cardId} className="w-full relative">
                {isActive && (
                  <div 
                    className="absolute bg-[#D7EDFF] rounded-tl-xl rounded-tr-xl z-0 -mt-2"
                    style={{
                      top: "-12px",
                      left: "-12px", 
                      right: "-12px",
                      bottom: "-12px",
                    }}
                  />
                )}
                
                <div className="relative z-10 w-full">
                  <MetricCard
                    title={metric.title}
                    count={displayCount} // FIXED: Always use monthly stats count
                    total={metric.total}
                    icon={metric.icon}
                    isActive={isActive}
                    isInactive={!isActive}
                    isDisabled={isCountZero}
                    isReportEnabled={isReportEnabled}
                    onCardClick={() => {
                      if (isCountZero) return
                      if (isActive) {
                        onReturnHome()
                      } else {
                        onCardClick(metric.cardId)
                      }
                    }}
                    onReportClick={() => handleReportDownload(metric.cardId)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div 
          className="bg-[#D7EDFF] rounded-xl overflow-hidden -mt-3"
          style={{
            width: '100%',
            maxWidth: `calc(100% - 32px)`,
            marginLeft: '16px',
            marginRight: '16px',
          }}
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

        <div style={{ height: '60px' }}></div>
      </div>
    </div>
  )
}

export default DashboardTabList