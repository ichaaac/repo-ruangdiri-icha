// src/pages/organization/school/SchoolProfilePage.jsx - Updated to use reusable components
import React from "react";
import ProfilePage from "@/components/shared/profile/ProfilePage";

/**
 * School Profile Page - Now uses reusable ProfilePage component
 */
const SchoolProfilePage = () => {
  return (
    <ProfilePage
      organizationType="school"
      organizationLabel="Sekolah"
      organizationInfoTitle="Informasi Sekolah"
      organizationNameLabel="Nama Sekolah"
      addressLabel="Alamat"
    />
  );
};

export default SchoolProfilePage;