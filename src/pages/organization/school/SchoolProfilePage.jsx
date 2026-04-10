// src/pages/organization/school/SchoolProfilePage.jsx - Updated to use reusable components
import React from "react";
import ProfilePage from "@/components/shared/profile/ProfilePage";
import Breadcrumb from "@/components/shared/Breadcrumb";

/**
 * School Profile Page - Now uses reusable ProfilePage component
 */
const SchoolProfilePage = () => {
  return (
    <>
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/school/dashboard" },
          { label: "Profil Sekolah" },
        ]} />
      </div>
      <ProfilePage
        organizationType="school"
        organizationLabel="Sekolah"
        organizationInfoTitle="Informasi Sekolah"
        organizationNameLabel="Nama Sekolah"
        addressLabel="Alamat"
      />
    </>
  );
};

export default SchoolProfilePage;