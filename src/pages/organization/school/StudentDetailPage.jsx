"use client"

// src/pages/organization/school/StudentDetailPage.jsx - Clean responsive student detail page
import { useState } from "react"
import { useParams } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { useStudentDetail } from "@/hooks/useStudentDetail"
import {
  DetailPageLayout,
  SharedProfile,
  SharedDevelopment,
  Divider,
  Modal,
  SuccessModal,
} from "@/components/shared/detail/DetailComponents"
import EditModal from "@/components/shared/detail/EditModal"

const StudentDetailPage = () => {
  const { studentId } = useParams()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Use the original student hook
  const { student, mentalHealthHistory, isLoading, isError, error, refetch, updateStudent } =
    useStudentDetail(studentId)

  const handleEditSuccess = (message) => {
    setShowEditModal(false)
    setSuccessMessage(message || "Data siswa berhasil diperbarui!")
    setShowSuccessModal(true)

    setTimeout(() => {
      setShowSuccessModal(false)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <span className="material-icons animate-spin text-[#488BBE]">sync</span>
          <span className="text-[#488BBE]">Memuat data siswa...</span>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-red-600 mb-2">Gagal Memuat Data</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            {error?.message || "Gagal memuat data siswa. Silakan coba beberapa saat lagi."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#488BBE] text-white rounded-full hover:bg-[#3399E9] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <DetailPageLayout>
      {/* Left Section - Student Profile */}
      <SharedProfile data={student} type="student" onEdit={() => setShowEditModal(true)} title="Profil Siswa" />

      {/* Divider */}
      <Divider />

      {/* Right Section - Student Development */}
      <SharedDevelopment data={student} mentalHealthHistory={mentalHealthHistory} type="student" />

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <Modal isOpen={true} onClose={() => setShowEditModal(false)}>
            <EditModal
              data={student}
              type="student"
              onClose={() => setShowEditModal(false)}
              onSuccess={handleEditSuccess}
              updateMutation={updateStudent}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <SuccessModal isOpen={true} message={successMessage} onClose={() => setShowSuccessModal(false)} />
        )}
      </AnimatePresence>
    </DetailPageLayout>
  )
}

export default StudentDetailPage
