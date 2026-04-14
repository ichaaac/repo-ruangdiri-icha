const BranchTable = ({ branches, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
        Memuat data...
      </div>
    )
  }

  if (!branches.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <span className="material-icons text-gray-300 text-5xl mb-3 block">store</span>
        <p className="text-gray-500">Belum ada data cabang</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nama Cabang
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Wilayah
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                {branch.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {branch.regionName}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(branch)}
                    className="p-1.5 text-gray-400 hover:text-[#488BBE] hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <span className="material-icons text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => onDelete(branch)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Hapus"
                  >
                    <span className="material-icons text-lg">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BranchTable
