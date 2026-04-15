// src/pages/organization/company/EmployeeListPage.jsx - Clean implementation
import React from "react"
import { useOutletContext } from "react-router-dom"
import SharedListPage from "@/components/shared/list/SharedListPage"
import EmployeeFilters from "@/components/organization/company/list/EmployeeFilters"
import Breadcrumb from "@/components/shared/Breadcrumb"

const EmployeeListPage = () => {
  const context = useOutletContext() || {}
  const { sidebarExpanded = false } = context

  return (
    <>
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/company/dashboard" },
          { label: "Daftar Karyawan" },
        ]} />
      </div>
      <SharedListPage
      type="employee"
      FiltersComponent={EmployeeFilters}
      sidebarExpanded={sidebarExpanded}
    />
    </>
  )
}

export default EmployeeListPage