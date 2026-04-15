// src/pages/organization/school/StudentListPage.jsx - Clean implementation
import React from "react"
import { useOutletContext } from "react-router-dom"
import SharedListPage from "@/components/shared/list/SharedListPage"
import StudentFilters from "@/components/organization/school/list/StudentFilter"
import Breadcrumb from "@/components/shared/Breadcrumb"

const StudentListPage = () => {
  const context = useOutletContext() || {}
  const { sidebarExpanded = false } = context

  return (
    <>
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/school/dashboard" },
          { label: "Daftar Siswa" },
        ]} />
      </div>
      <SharedListPage
        type="student"
        FiltersComponent={StudentFilters}
        sidebarExpanded={sidebarExpanded}
      />
    </>
  )
}

export default StudentListPage