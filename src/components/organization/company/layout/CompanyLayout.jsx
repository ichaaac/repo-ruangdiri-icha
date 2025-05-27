// src/components/organization/company/layout/CompanyLayout.jsx - Simple configuration
import React from "react";
import { useLocation } from "react-router-dom";
import Layout from "../../../shared/layout/Layout";

const CompanyLayout = () => {
  const location = useLocation();
  
  // Check if this is a development route
  const isDev = location.pathname.startsWith('/dev/company');
  
  // Configure menu items based on route type
  const basePath = isDev ? '/dev/company' : '/organization/company';

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
      label: "Daftar Karyawan",
      path: `${basePath}/employee-list`,
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
      organizationType="company"
      menuItems={menuItems}
      startExpanded={false} // Company starts collapsed
    />
  );
};

export default CompanyLayout;