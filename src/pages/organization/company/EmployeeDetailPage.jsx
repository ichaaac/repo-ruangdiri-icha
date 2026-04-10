// src/pages/organization/company/EmployeeDetailPage.jsx - CORRECTED for New API Structure

import { useState } from "react"
import { useParams, useOutletContext } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useEmployeeDetail } from "@/hooks/useEmployeeDetail"
import {
  DetailPageLayout,
  SharedProfile,
  SharedDevelopment,
  Divider,
  Modal,
  SuccessModal,
} from "@/components/shared/detail/DetailComponents"
import EditModal from "@/components/shared/detail/EditModal"
import Breadcrumb from "@/components/shared/Breadcrumb"

const EmployeeDetailPage = () => {
  const { employeeId } = useParams()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Get sidebar state from layout context
  const context = useOutletContext() || {}
  const { sidebarExpanded = false } = context

  // CORRECTED: No longer destructuring mentalHealthHistory
  const { employee, isLoading, isError, error, refetch, updateEmployee } = useEmployeeDetail(employeeId)

  const handleEditSuccess = (message) => {
    setShowEditModal(false)
    setSuccessMessage(message || "Data karyawan berhasil diperbarui!")
    setShowSuccessModal(true)

    setTimeout(() => {
      setShowSuccessModal(false)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-[#488BBE] text-2xl">sync</span>
          <span className="text-[#488BBE] text-sm lg:text-base">Memuat data karyawan...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 lg:p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl lg:text-6xl mb-4">
            <span className="material-icons" style={{ fontSize: "4rem" }}>
              error_outline
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-red-600 mb-2">Gagal Memuat Data</h1>
          <p className="text-gray-600 mb-6 text-sm lg:text-base">
            {error?.message || "Gagal memuat data karyawan. Silakan coba beberapa saat lagi."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488BBE] text-white rounded-full hover:bg-[#3399E9] transition-colors text-sm lg:text-base"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // Debug log for development
  console.log("📋 EmployeeDetailPage rendering with data:", {
    employee,
    screenings: employee?.screenings || [],
    counselings: employee?.counselings || [],
  })

  return (
    <DetailPageLayout sidebarExpanded={sidebarExpanded}>
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/company/dashboard" },
          { label: "Daftar Karyawan", to: "/organization/company/employee-list" },
          { label: "Detail Karyawan" },
        ]} />
      </div>
      <SharedProfile
        data={employee}
        type="employee"
        onEdit={() => setShowEditModal(true)}
        title="Profil Karyawan"
        sidebarExpanded={sidebarExpanded}
      />

      <Divider sidebarExpanded={sidebarExpanded} />

      {/* CORRECTED: Only passing data and type, no mentalHealthHistory */}
      <SharedDevelopment 
        data={employee} 
        type="employee" 
      />

      <AnimatePresence>
        {showEditModal && (
          <Modal isOpen={true} onClose={() => setShowEditModal(false)}>
            <EditModal
              data={employee}
              type="employee"
              onClose={() => setShowEditModal(false)}
              onSuccess={handleEditSuccess}
              updateMutation={updateEmployee}
            />
          </Modal>
        )}
      </AnimatePresence>

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
  )
}

export default EmployeeDetailPage