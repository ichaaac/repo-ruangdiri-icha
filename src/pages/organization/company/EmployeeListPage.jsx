// src/pages/organization/company/EmployeeListPage.jsx - Simple wrapper
import React from "react";
import SharedListPage from "@/components/shared/list/ListPage";
import { useEmployeeData, useDepartments } from "../../../hooks/useEmployeeData";
import { useEmployeeFilters } from "../../../hooks/useEmployeeFilter";
import EmployeeFilters from "../../../components/organization/company/list/EmployeeFilters";

const EmployeeListPage = () => {
  return (
    <SharedListPage
      type="employee"
      useDataHook={useEmployeeData}
      useFiltersHook={useEmployeeFilters}
      useOptionsHook={useDepartments}
      FiltersComponent={EmployeeFilters}
    />
  );
};

export default EmployeeListPage;