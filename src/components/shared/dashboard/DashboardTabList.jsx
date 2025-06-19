import { useState } from "react"
import DashboardTable from "./DashboardTable"
import MetricCard from "./MetricCard"
import EmailNotificationModal from "./EmailNotificationModal"
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll"
import { useAuth } from "../../../hooks/useAuth"
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
  
  // Modal states for email notification
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [reportName, setReportName] = useState("")

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

  // Handle report click with modal
  const handleReportClick = (reportTitle) => {
    setReportName(reportTitle)
    setShowEmailModal(true)
  }

  // Get appropriate report title based on active card
  const getReportTitle = (cardId) => {
    switch (cardId) {
      case "at_risk":
        return `Daftar ${config.entityName} Berisiko`
      case "not_screened":
        return `Daftar ${config.entityName} Belum Skrining`
      case "not_counseled":
        return `Daftar ${config.entityName} Belum Konseling`
      default:
        return `Laporan ${config.entityName}`
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
      <TopRightControl isAbsolute />

      <div className="px-2 sm:px-4 lg:px-6 mt-6 sm:mt-8 pt-[72px]">
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
            
            // Logika untuk mengaktifkan tombol "Kirim Laporan"
            const isReportEnabled = isActive && !isCountZero

            return (
              <div key={metric.cardId} className="w-full relative">
                {isActive && (
                  <div 
                    className="absolute bg-[#D7EDFF] rounded-tl-xl rounded-tr-xl z-0"
                    style={{
                      top: "-12px",
                      left: "-12px", 
                      right: "-12px",
                      bottom: "-20px",
                      borderBottomLeftRadius: "0px",
                      borderBottomRightRadius: "0px"
                    }}
                  />
                )}
                
                <div className="relative z-10 w-full">
                  <MetricCard
                    title={metric.title}
                    count={isActive ? (tabData?.metadata?.totalData || 0) : metric.count}
                    total={metric.total}
                    icon={metric.icon}
                    isActive={isActive}
                    isInactive={!isActive}
                    isDisabled={isCountZero}
                    isReportEnabled={isReportEnabled}
                    onCardClick={() => {
                      // Jangan lakukan apa-apa kalo count=0. Kalo aktif, balik ke home. Kalo ga aktif, klik.
                      if (isCountZero) return
                      if (isActive) {
                        onReturnHome()
                      } else {
                        onCardClick(metric.cardId)
                      }
                    }}
                    onReportClick={() => handleReportClick(getReportTitle(metric.cardId))}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div 
          className="bg-[#D7EDFF] min-h-[400px] rounded-xl overflow-hidden -mt-3"
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

export default DashboardTabList