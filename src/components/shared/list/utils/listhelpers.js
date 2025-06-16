// src/components/shared/list/utils/listHelpers.js
import React from 'react'

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 30) => {
  if (!text) return ""
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Search term
 * @returns {React.Element|string} Highlighted text
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text) return text

  const parts = text.split(new RegExp(`(${searchTerm})`, "gi"))
  return parts.map((part, i) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <span key={i} className="font-bold bg-yellow-200">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || phone === null) return "-"
  if (!phone.startsWith("+")) {
    return phone.startsWith("0") ? `+62 ${phone.substring(1)}` : `+62 ${phone}`
  }
  return phone
}

/**
 * Get screening status display info
 * @param {string} status - Screening status
 * @returns {Object} Status info
 */
export const getScreeningStatusInfo = (status) => {
  const statusMap = {
    at_risk: {
      icon: "warning",
      color: "text-red-500",
      bgColor: "bg-red-50",
      text: "Berisiko",
      iconClass: "material-icons text-[24px] leading-none align-middle mr-1.5 text-red-500",
    },
    monitored: {
      icon: "error",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      text: "Pengawasan",
      iconClass: "material-icons text-[24px] leading-none align-middle mr-1.5 text-yellow-500",
    },
    stable: {
      icon: "check_circle",
      color: "text-green-500",
      bgColor: "bg-green-50",
      text: "Stabil",
      iconClass: "material-icons text-[24px] leading-none align-middle mr-1.5 text-green-500",
    },
    not_screened: {
      icon: "remove",
      color: "text-gray-500",
      bgColor: "bg-gray-50",
      text: "Belum Skrining",
      iconClass: "material-icons text-[24px] leading-none align-middle mr-1.5 text-gray-500",
    }
  }

  return statusMap[status] || statusMap.stable
}

/**
 * Get counseling status display info
 * @param {boolean} status - Counseling status
 * @returns {Object} Status info
 */
export const getCounselingStatusInfo = (status) => {
  return {
    text: status ? "Sudah" : "Belum",
    color: status ? "text-[#6DAF31]" : "text-[#EE4266]",
    bgColor: status ? "bg-green-50" : "bg-red-50"
  }
}

/**
 * Calculate responsive table width
 * @param {boolean} sidebarExpanded - Sidebar state
 * @param {string} type - Table type
 * @returns {string} Table width
 */
export const calculateTableWidth = (sidebarExpanded, type = "student") => {
  const sidebarWidth = sidebarExpanded ? 237 : 60
  const availableWidth = window.innerWidth - sidebarWidth - 48

  if (availableWidth <= 768) return "100%"
  if (availableWidth <= 1024) return "100%"

  const minWidth = type === "student" ? 800 : 900
  return `${Math.max(availableWidth, minWidth)}px`
}

/**
 * Format date to Indonesian locale
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-"
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (e) {
    return dateString || "-"
  }
}

/**
 * Get gender display text
 * @param {string} gender - Gender value
 * @returns {string} Display text
 */
export const getGenderDisplay = (gender) => {
  const genderMap = {
    male: "L",
    female: "P"
  }
  return genderMap[gender] || "-"
}