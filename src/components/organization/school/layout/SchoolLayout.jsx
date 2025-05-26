// src/components/organization/school/layout/SchoolLayout.jsx
import React from "react";
import Layout from "../../../shared/layout/Layout";

const SchoolLayout = () => {
  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: "/organization/school/dashboard",
      hasDropdown: true,
      dropdownItems: [
        { label: "Dashboard Home", path: "/organization/school/dashboard" },
        { label: "Dashboard Tab Laporan", path: "/organization/school/dashboard/reports" }
      ]
    },
    {
      icon: "table_chart",
      label: "Daftar Siswa",
      path: "/organization/school/student-list",
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: "/organization/school/schedule",
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: "/organization/school/profile",
    },
  ];

  return (
    <Layout
      organizationType="school"
      menuItems={menuItems}
      startExpanded={true} // School starts expanded
    />
  );
};

export default SchoolLayout;