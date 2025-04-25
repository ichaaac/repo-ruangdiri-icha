import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SchoolSettings from "./school/SchoolSettingsPage";
import CompanySettings from "./company/CompanySettingsPage";
/**
 * Main Settings page component that determines whether to show school or company settings
 * Uses React Query to determine the organization type
 * 
 * @returns {JSX.Element} Either SchoolSettings or CompanySettings based on URL
 */
const SettingsPage = () => {
  // Determine organization type based on URL path
  const location = useLocation();
  
  // Use React Query to determine the organization type
  const { data: orgType } = useQuery({
    queryKey: ['organizationType'],
    queryFn: () => {
      return location.pathname.includes("/organization/school") ? "school" : "company";
    },
    staleTime: Infinity, // This won't change during the component lifecycle
  });
  
  return (
    <div className="min-h-screen">
      {/* Render the appropriate settings component based on organization type */}
      {orgType === "school" ? <SchoolSettings /> : <CompanySettings />}
    </div>
  );
};

export default SettingsPage;