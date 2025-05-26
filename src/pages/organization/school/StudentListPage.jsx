// src/pages/organization/school/StudentListPage.jsx - Fixed implementation
import React from "react";
import ListPage from "@/components/shared/list/ListPage";
import { useStudentData, useClassrooms } from "@/hooks/useStudentData";
import { useStudentFilters } from "@/hooks/useStudentFilter";
import StudentFilters from "@/components/organization/school/list/StudentFilter";
import StudentTable from "@/components/organization/school/list/StudentTable";
import { useAuth } from "@/hooks/useAuth";

/**
 * Student List Page - Uses reusable ListPage component with proper integration
 */
const StudentListPage = () => {
  const { user } = useAuth();

  return (
    <ListPage
      type="student"
      title={`Halo, ${user?.fullName || ""}`}
      searchPlaceholder="Cari Nama atau NIS..."
      statsConfig={{
        totalLabel: "Siswa"
      }}
      useDataHook={useStudentData}
      useFiltersHook={useStudentFilters}
      useOptionsHook={useClassrooms}
      TableComponent={StudentTable}
      FiltersComponent={StudentFilters}
      icons={{
        total: "groups",
        female: "face_2", 
        male: "face"
      }}
    />
  );
};

export default StudentListPage;