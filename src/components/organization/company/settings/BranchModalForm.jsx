import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { branchFormSchema } from "@/schemas/validationSchema"
import { branchService } from "@/services/branchService"

const BranchModalForm = ({ branch, onClose }) => {
  const isEdit = !!branch
  const [errorMessage, setErrorMessage] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: regionsData } = branchService.useRegions()
  const regions = regionsData?.data || []

  const createMutation = branchService.useCreateBranch()
  const updateMutation = branchService.useUpdateBranch()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: branch?.name || "",
      regionId: branch?.regionId || "",
    },
  })

  const onSubmit = (data) => {
    setErrorMessage("")
    const mutation = isEdit ? updateMutation : createMutation
    const payload = isEdit ? { id: branch.id, ...data } : data

    mutation.mutate(payload, {
      onSuccess: () => onClose(),
      onError: (err) => {
        setErrorMessage(err.response?.data?.message || "Terjadi kesalahan")
      },
    })
  }

  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleClose} />
      <div className="bg-white rounded-xl w-[480px] relative z-10 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Cabang" : "Tambah Cabang"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Nama Cabang */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Cabang <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Masukkan nama cabang"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#488BBE] focus:border-transparent ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Wilayah */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wilayah <span className="text-red-500">*</span>
            </label>
            <select
              {...register("regionId")}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#488BBE] focus:border-transparent ${
                errors.regionId ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">Pilih wilayah</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.regionId && (
              <p className="mt-1 text-xs text-red-500">{errors.regionId.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 bg-[#488BBE] text-white rounded-lg text-sm font-medium hover:bg-[#3a7aab] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending
                ? "Menyimpan..."
                : "Simpan"}
            </button>
          </div>
        </form>
      </div>

      {/* Unsaved changes confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" />
          <div className="bg-white rounded-lg w-[400px] py-8 px-6 relative z-10 flex flex-col items-center">
            <div className="mb-4">
              <div className="w-24 h-24 rounded-full bg-[#F5385D] flex items-center justify-center text-white">
                <span className="material-icons text-5xl">error_outline</span>
              </div>
            </div>
            <p className="text-gray-500 mb-2 text-center">Perubahan yang belum disimpan akan hilang.</p>
            <h3 className="text-[#F5385D] font-bold text-xl mb-6 text-center">Apakah kamu yakin?</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-10 py-2 border border-[#F5385D] rounded-full text-[#F5385D] hover:bg-red-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={onClose}
                className="px-10 py-2 bg-[#F5385D] rounded-full text-white hover:bg-red-600 transition-colors"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BranchModalForm
