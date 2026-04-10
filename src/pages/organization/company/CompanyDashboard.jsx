// src/pages/organization/company/CompanyDashboard.jsx - Fixed with proper context handling

import { useOutletContext } from "react-router-dom"
import SharedDashboard from "@/components/shared/dashboard/SharedDashboard"
import { useAuth } from "@/hooks/useAuth"
import SuccessModal from "@/components/organization/company/SuccessModal"
import Breadcrumb from "@/components/shared/Breadcrumb"

const CompanyDashboard = () => {
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
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/company/dashboard" },
          { label: "Dashboard" },
        ]} />
      </div>
      <SharedDashboard
        type="employee"
        config={{
          entityName: "Karyawan",
          defaultFilter: "Finance", // Required for API - default department
          filterLabel: "Departemen",
          filterOptions: [
            "Engineering",
            "Marketing", 
            "Operations",
            "Creative",
            "Finance",
            "Human Resources",
            "Sales",
            "IT",
          ],
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

export default CompanyDashboard