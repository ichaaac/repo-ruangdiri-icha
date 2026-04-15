import { useState } from "react"
import { branchService } from "@/services/branchService"

const DeleteConfirmation = ({ branch, onClose }) => {
  const [errorMessage, setErrorMessage] = useState("")
  const deleteMutation = branchService.useDeleteBranch()

  const handleDelete = () => {
    setErrorMessage("")
    deleteMutation.mutate(branch.id, {
      onSuccess: () => onClose(),
      onError: (err) => {
        setErrorMessage(
          err.response?.data?.message || "Gagal menghapus cabang"
        )
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose} />
      <div className="bg-white rounded-lg w-[420px] py-8 px-6 relative z-10 flex flex-col items-center">
        <div className="mb-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <span className="material-icons text-red-500 text-4xl">delete_outline</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Hapus Cabang</h3>
        <p className="text-gray-500 text-sm mb-1 text-center">
          Apakah Anda yakin ingin menghapus cabang
        </p>
        <p className="text-gray-800 font-medium mb-6 text-center">"{branch.name}"?</p>

        {errorMessage && (
          <div className="w-full p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-8 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-8 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmation
