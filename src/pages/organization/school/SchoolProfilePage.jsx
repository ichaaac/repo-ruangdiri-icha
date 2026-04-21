import React from "react";
import OrganizationProfile from "@/components/shared/profile/OrganizationProfile";

const SchoolProfilePage = () => {
  return (
    <OrganizationProfile
      organizationType="school"
      organizationLabel="Sekolah"
      dashboardPath="/organization/school/dashboard"
    />
  );
};

export default SchoolProfilePage;