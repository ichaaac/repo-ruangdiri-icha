// src/components/organization/company/layout/CompanyLayout.jsx
import React from "react";
import Layout from "../../../shared/layout/Layout";

const CompanyLayout = () => {
  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: "/organization/company/dashboard",
      hasDropdown: true,
      dropdownItems: [
        { label: "Dashboard Home", path: "/organization/company/dashboard" },
        { label: "Dashboard Tab Laporan", path: "/organization/company/dashboard/reports" }
      ]
    },
    {
      icon: "table_chart",
      label: "Daftar Karyawan",
      path: "/organization/company/employee-list",
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: "/organization/company/schedule",
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: "/organization/company/profile",
    },
  ];

  return (
    <Layout
      organizationType="company"
      menuItems={menuItems}
      startExpanded={false} // Company starts collapsed
    />
  );
};

export default CompanyLayout;