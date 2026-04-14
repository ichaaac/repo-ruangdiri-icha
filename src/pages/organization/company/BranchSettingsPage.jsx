import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { branchService } from "@/services/branchService"
import BranchTable from "@/components/organization/company/settings/BranchTable"
import BranchFilter from "@/components/organization/company/settings/BranchFilter"
import BranchModalForm from "@/components/organization/company/settings/BranchModalForm"
import DeleteConfirmation from "@/components/organization/company/settings/DeleteConfirmation"

const BranchSettingsPage = () => {
  const navigate = useNavigate()
  const { getAdminLevel, getOrganizationType } = useAuth()
  const orgType = getOrganizationType()

  // Guard: only admin pusat
  if (getAdminLevel() !== "pusat") {
    navigate(`/organization/${orgType}/dashboard`, { replace: true })
    return null
  }

  const [regionFilter, setRegionFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editBranch, setEditBranch] = useState(null)
  const [deleteBranch, setDeleteBranch] = useState(null)

  const { data: branchesData, isLoading } = branchService.useBranches(regionFilter || undefined)
  const branches = branchesData?.data || []

  const handleEdit = (branch) => {
    setEditBranch(branch)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditBranch(null)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditBranch(null)
  }

  const handleDeleteClose = () => {
    setDeleteBranch(null)
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span
          className="hover:text-gray-700 cursor-pointer"
          onClick={() => navigate(`/organization/${orgType}/dashboard`)}
        >
          Home
        </span>
        <span>/</span>
        <span className="text-gray-800 font-medium">Pengaturan Cabang</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pengaturan Cabang</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data cabang organisasi Anda</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#488BBE] text-white rounded-lg hover:bg-[#3a7aab] transition-colors text-sm font-medium"
        >
          <span className="material-icons text-lg">add</span>
          Tambah Cabang
        </button>
      </div>

      {/* Filter */}
      <BranchFilter value={regionFilter} onChange={setRegionFilter} />

      {/* Table */}
      <BranchTable
        branches={branches}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={setDeleteBranch}
      />

      {/* Create/Edit Modal */}
      {modalOpen && (
        <BranchModalForm
          branch={editBranch}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation */}
      {deleteBranch && (
        <DeleteConfirmation
          branch={deleteBranch}
          onClose={handleDeleteClose}
        />
      )}
    </div>
  )
}

export default BranchSettingsPage
