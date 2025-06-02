// src/pages/organization/company/SchoolDashboard.jsx

import SharedDashboard from "@/components/shared/dashboard/SharedDashboard"
import { useDashboard, useDashboardTabData } from "@/hooks/useDashboard"
import SuccessModal from "@/components/organization/school/SuccessModal"

const SchoolDashboard = () => {
  return (
    <SharedDashboard
      type="student"
      useDashboardHook={useDashboard}
      useTabDataHook={useDashboardTabData}
      SuccessModalComponent={SuccessModal}
      config={{
        entityName: "Siswa",
        defaultFilter: "X",
        filterLabel: "Kelas",
        filterOptions: ["X", "XI", "XII"],
      }}
    />
  )
}

export default SchoolDashboard
