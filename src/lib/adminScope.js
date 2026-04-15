/**
 * Admin Scope Utility
 *
 * Hierarchy: Pusat > Wilayah > Cabang
 * - Pusat: sees all data (no scope params)
 * - Wilayah: sees branches in their region (regionId)
 * - Cabang: sees only their branch (branchId)
 */

export const ADMIN_LEVEL = {
  CABANG: "cabang",
  WILAYAH: "wilayah",
  PUSAT: "pusat",
}

export const ADMIN_LEVEL_RANK = {
  [ADMIN_LEVEL.CABANG]: 1,
  [ADMIN_LEVEL.WILAYAH]: 2,
  [ADMIN_LEVEL.PUSAT]: 3,
}

const parseScope = () => {
  try {
    const raw = localStorage.getItem("adminScope")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getAdminScopeParams = () => {
  const scope = parseScope()
  if (!scope) return {}
  if (scope.branchId) return { branchId: scope.branchId }
  if (scope.regionId) return { regionId: scope.regionId }
  return {}
}

export const getAdminScopeLabel = () => {
  return parseScope()?.label || null
}

/**
 * Stable string key for React Query cache.
 * Avoids object reference inequality on every render.
 */
export const getAdminScopeKey = () => {
  const scope = parseScope()
  if (!scope) return ""
  if (scope.branchId) return `branch:${scope.branchId}`
  if (scope.regionId) return `region:${scope.regionId}`
  return ""
}

/**
 * Append scope params to an existing URLSearchParams instance.
 */
export const appendScopeParams = (urlSearchParams) => {
  const scope = getAdminScopeParams()
  Object.entries(scope).forEach(([k, v]) => urlSearchParams.append(k, v))
}
