// src/pages/organization/company/EmployeeListPage.jsx - Clean implementation
import React from "react"
import { useOutletContext } from "react-router-dom"
import SharedListPage from "@/components/shared/list/SharedListPage"
import EmployeeFilters from "@/components/organization/company/list/EmployeeFilters"

const EmployeeListPage = () => {
  const context = useOutletContext() || {}
  const { sidebarExpanded = false } = context

  return (
    <SharedListPage
      type="employee"
      FiltersComponent={EmployeeFilters}
      sidebarExpanded={sidebarExpanded}
    />
  )
}

export default EmployeeListPage