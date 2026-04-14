import { branchService } from "@/services/branchService"

const BranchFilter = ({ value, onChange }) => {
  const { data: regionsData } = branchService.useRegions()
  const regions = regionsData?.data || []

  return (
    <div className="mb-4">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#488BBE] focus:border-transparent min-w-[220px]"
      >
        <option value="">Semua Wilayah</option>
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default BranchFilter
