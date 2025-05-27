
// src/pages/organization/school/StudentListPage.jsx - Simple wrapper
import React from "react";
import SharedListPage from "@/components/shared/list/ListPage";
import { useStudentData, useClassrooms } from "../../../hooks/useStudentData";
import { useStudentFilters } from "../../../hooks/useStudentFilter";
import StudentFilters from "../../../components/organization/school/list/StudentFilter";

const StudentListPage = () => {
  return (
    <SharedListPage
      type="student"
      useDataHook={useStudentData}
      useFiltersHook={useStudentFilters}
      useOptionsHook={useClassrooms}
      FiltersComponent={StudentFilters}
    />
  );
};

export default StudentListPage;