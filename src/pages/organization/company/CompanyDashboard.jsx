// src/pages/organization/company/CompanyDashboard.jsx
import SharedDashboard from "@/components/shared/dashboard/SharedDashboard"
import { useDashboard, useDashboardTabData } from "@/hooks/useDashboard"
import SuccessModal from "@/components/organization/company/SuccessModal"

const CompanyDashboard = () => {
  return (
    <SharedDashboard
      type="employee"
      useDashboardHook={useDashboard}
      useTabDataHook={useDashboardTabData}
      SuccessModalComponent={SuccessModal}
      config={{
        entityName: "Karyawan",
        defaultFilter: "Finance",
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
    />
  )
}

export default CompanyDashboard
