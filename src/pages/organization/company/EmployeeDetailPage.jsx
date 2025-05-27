// src/pages/organization/company/EmployeeDetailPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEmployeeDetail } from "@/hooks/useEmployeeDetail";
import { 
  DetailPageLayout, 
  SharedProfile, 
  SharedDevelopment, 
  Divider, 
  Modal, 
  SuccessModal 
} from "@/components/shared/detail/SharedDetailComponents";
import EmployeeProfileEditModal from "../../../components/organization/company/employee-detail/EmployeeProfileEditModal";

const EmployeeDetailPage = () => {
  const { employeeId } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Use the employee detail hook
  const { 
    employee,
    mentalHealthHistory,
    isLoading,
    isLoadingHistory,
    isError,
    error,
    refetch,
    updateEmployee
  } = useEmployeeDetail(employeeId);

  const handleEditSuccess = (message) => {
    setShowEditModal(false);
    setSuccessMessage(message || "Data karyawan berhasil diperbarui!");
    setShowSuccessModal(true);
    
    // Auto-hide success message after 2 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-[#488BBE]">sync</span>
          <span className="text-[#488BBE]">Memuat data karyawan...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-screen p-6">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            <span className="material-icons" style={{ fontSize: "6rem" }}>
              error_outline
            </span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Gagal Memuat Data
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            {error?.message || "Gagal memuat data karyawan. Silakan coba beberapa saat lagi."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488BBE] text-white rounded-full hover:bg-[#3399E9] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <DetailPageLayout>
      {/* Left Section - Employee Profile */}
      <SharedProfile 
        data={employee} 
        type="employee"
        onEdit={() => setShowEditModal(true)}
        title="Profil Karyawan"
      />
      
      {/* Divider */}
      <Divider />
      
      {/* Right Section - Employee Development */}
      <SharedDevelopment 
        data={employee}
        mentalHealthHistory={mentalHealthHistory}
        type="employee"
      />
      
      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <Modal isOpen={true} onClose={() => setShowEditModal(false)}>
            <EmployeeProfileEditModal
              employeeData={employee}
              onClose={() => setShowEditModal(false)}
              onSuccess={handleEditSuccess}
              updateEmployeeMutation={updateEmployee}
            />
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal
            isOpen={true}
            message={successMessage}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </AnimatePresence>
    </DetailPageLayout>
  );
};

export default EmployeeDetailPage;

