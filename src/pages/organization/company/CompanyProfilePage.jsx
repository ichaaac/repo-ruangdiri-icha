import React from "react";
import OrganizationProfile from "@/components/shared/profile/OrganizationProfile";

const CompanyProfilePage = () => {
  return (
    <OrganizationProfile
      organizationType="company"
      organizationLabel="Perusahaan"
      dashboardPath="/organization/company/dashboard"
    />
  );
};

export default CompanyProfilePage;