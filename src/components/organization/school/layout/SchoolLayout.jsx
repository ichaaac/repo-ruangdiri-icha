// src/components/organization/school/layout/SchoolLayout.jsx - Responsive School Layout
import React from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../../shared/layout/Layout";

const SchoolLayout = () => {
  const location = useLocation();

  // Check if this is a development route
  const isDev = location.pathname.startsWith('/dev/school');

  // Configure menu items based on route type
  const basePath = isDev ? '/dev/school' : '/organization/school';

  const menuItems = [
    {
      icon: "bar_chart",
      label: "Dashboard",
      path: `${basePath}/dashboard`,
      hasDropdown: true,
      dropdownItems: [
        { label: "Dashboard Home", path: `${basePath}/dashboard` },
        { label: "Dashboard Tab Laporan", path: `${basePath}/dashboard/reports` }
      ]
    },
    {
      icon: "table_chart",
      label: "Daftar Siswa",
      path: `${basePath}/student-list`,
    },
    {
      icon: "calendar_month",
      label: "Jadwal",
      path: `${basePath}/schedule`,
    },
    {
      icon: "brightness_5",
      label: "Pengaturan",
      path: `${basePath}/profile`,
    },
  ];

  return (
    <Layout
      organizationType="school"
      menuItems={menuItems}
      startExpanded={false} // Responsive: start collapsed
    />
  );
};

export default SchoolLayout;