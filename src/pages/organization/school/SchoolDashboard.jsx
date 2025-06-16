// src/pages/organization/school/SchoolDashboard.jsx - Fixed with proper context handling

import { useOutletContext } from "react-router-dom"
import SharedDashboard from "@/components/shared/dashboard/SharedDashboard"
import { useAuth } from "@/hooks/useAuth"
import SuccessModal from "@/components/organization/school/SuccessModal"

const SchoolDashboard = () => {
  // Get context from Layout with proper fallbacks
  const context = useOutletContext() || {}
  const { 
    sidebarExpanded = false, 
    selectedDashboardTab = "home", 
    onDashboardTabChange = () => {},
    dashboardMetrics = null
  } = context

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <SharedDashboard
        type="student"
        config={{
          entityName: "Siswa",
          defaultFilter: "X", // Required for API - default classroom
          filterLabel: "Kelas",
          filterOptions: ["X", "XI", "XII"],
        }}
        selectedDashboardTab={selectedDashboardTab}
        onDashboardTabChange={onDashboardTabChange}
        useAuth={useAuth}
        SuccessModalComponent={SuccessModal}
        sidebarExpanded={sidebarExpanded}
        dashboardMetrics={dashboardMetrics}
      />
    </div>
  )
}

export default SchoolDashboarda
