// src/pages/organization/school/StudentListPage.jsx - Clean implementation
import React from "react"
import { useOutletContext } from "react-router-dom"
import SharedListPage from "@/components/shared/list/SharedListPage"
import StudentFilters from "@/components/organization/school/list/StudentFilter"

const StudentListPage = () => {
  const context = useOutletContext() || {}
  const { sidebarExpanded = false } = context

  return (
    <SharedListPage
      type="student"
      FiltersComponent={StudentFilters}
      sidebarExpanded={sidebarExpanded}
    />
  )
}

export default StudentListPage