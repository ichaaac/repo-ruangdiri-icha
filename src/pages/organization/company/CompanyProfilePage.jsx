// src/pages/organization/company/CompanyProfilePage.jsx - Updated to use reusable components
import React from "react";
import ProfilePage from "@/components/shared/profile/ProfilePage";

/**
 * Company Profile Page - Now uses reusable ProfilePage component
 */
const CompanyProfilePage = () => {
  return (
    <ProfilePage
      organizationType="company"
      organizationLabel="Perusahaan"
      organizationInfoTitle="Informasi Perusahaan"
      organizationNameLabel="Nama Perusahaan"
      addressLabel="Alamat Perusahaan"
    />
  );
};

export default CompanyProfilePage;