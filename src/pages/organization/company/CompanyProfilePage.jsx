// src/pages/organization/company/CompanyProfilePage.jsx - Updated to use reusable components
import React from "react";
import ProfilePage from "@/components/shared/profile/ProfilePage";
import Breadcrumb from "@/components/shared/Breadcrumb";

/**
 * Company Profile Page - Now uses reusable ProfilePage component
 */
const CompanyProfilePage = () => {
  return (
    <>
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/company/dashboard" },
          { label: "Profil Perusahaan" },
        ]} />
      </div>
      <ProfilePage
        organizationType="company"
        organizationLabel="Perusahaan"
        organizationInfoTitle="Informasi Perusahaan"
        organizationNameLabel="Nama Perusahaan"
        addressLabel="Alamat Perusahaan"
      />
    </>
  );
};

export default CompanyProfilePage;