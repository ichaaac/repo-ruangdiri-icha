// src/pages/organization/company/EmployeeListPage.jsx - Updated to use reusable components
import React from "react";
import ListPage from "@/components/shared/list/ListPage";
import { useEmployeeData, useDepartments } from "../../../hooks/useEmployeeData";
import { useEmployeeFilters } from "../../../hooks/useEmployeeFilter";
import EmployeeFilters from "../../../components/organization/company/list/EmployeeFilters";
import EmployeeTable from "../../../components/organization/company/list/EmployeeTable";

/**
 * Employee List Page - Now uses reusable ListPage component
 */
const EmployeeListPage = () => {
  return (
    <ListPage
      type="employee"
      title="" // Empty title since we don't show greeting for company
      searchPlaceholder="Cari Nama atau ID Karyawan..."
      statsConfig={{
        totalLabel: "Karyawan"
      }}
      useDataHook={useEmployeeData}
      useFiltersHook={useEmployeeFilters}
      useOptionsHook={useDepartments}
      TableComponent={EmployeeTable}
      FiltersComponent={EmployeeFilters}
      icons={{
        total: "groups",
        female: "face_2",
        male: "face"
      }}
    />
  );
};

export default EmployeeListPage;