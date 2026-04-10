// src/pages/organization/school/SchoolDashboard.jsx - Fixed with proper context handling

import { useOutletContext } from "react-router-dom"
import SharedDashboard from "@/components/shared/dashboard/SharedDashboard"
import { useAuth } from "@/hooks/useAuth"
import SuccessModal from "@/components/organization/school/SuccessModal"
import Breadcrumb from "@/components/shared/Breadcrumb"

const SchoolDashboard = () => {
  const context = useOutletContext() || {}
  const { 
    sidebarExpanded = false, 
    selectedDashboardTab = "home", 
    onDashboardTabChange = () => {},
    dashboardMetrics = null
  } = context

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/school/dashboard" },
          { label: "Dashboard" },
        ]} />
      </div>
      <SharedDashboard
        type="student"
        config={{
          entityName: "Siswa",
          defaultFilter: "X", 
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

export default SchoolDashboard
