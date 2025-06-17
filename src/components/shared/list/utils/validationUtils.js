
// src/components/list/utils/validationUtils.js

/**
 * Validate student data
 * @param {Object} data - Student data
 * @returns {Object} Validation errors
 */
export const validateStudentData = (data) => {
    const errors = {}
  
    if (!data.fullName?.trim()) {
      errors.fullName = "Nama lengkap wajib diisi"
    } else if (data.fullName.length > 70) {
      errors.fullName = "Nama lengkap maksimal 70 karakter"
    }
  
    if (!data.nis?.trim()) {
      errors.nis = "NIS wajib diisi"
    }
  
    if (data.iqScore && (isNaN(data.iqScore) || data.iqScore < 0 || data.iqScore > 200)) {
      errors.iqScore = "Skor IQ harus antara 0-200"
    }
  
    if (data.guardianContact && !isValidPhoneNumber(data.guardianContact)) {
      errors.guardianContact = "Format nomor telepon tidak valid"
    }
  
    return errors
  }
  
  /**
   * Validate employee data
   * @param {Object} data - Employee data
   * @returns {Object} Validation errors
   */
  export const validateEmployeeData = (data) => {
    const errors = {}
  
    if (!data.fullName?.trim()) {
      errors.fullName = "Nama lengkap wajib diisi"
    } else if (data.fullName.length > 70) {
      errors.fullName = "Nama lengkap maksimal 70 karakter"
    }
  
    if (!data.department?.trim()) {
      errors.department = "Departemen wajib diisi"
    }
  
    if (!data.position?.trim()) {
      errors.position = "Jabatan wajib diisi"
    }
  
    if (data.age && (isNaN(data.age) || data.age < 0 || data.age > 100)) {
      errors.age = "Usia harus antara 0-100"
    }
  
    if (data.yearsOfService && (isNaN(data.yearsOfService) || data.yearsOfService < 0 || data.yearsOfService > 50)) {
      errors.yearsOfService = "Lama bekerja harus antara 0-50 tahun"
    }
  
    if (data.contact && !isValidPhoneNumber(data.contact)) {
      errors.contact = "Format nomor telepon tidak valid"
    }
  
    return errors
  }
  
  /**
   * Validate phone number
   * @param {string} phone - Phone number
   * @returns {boolean} Is valid
   */
  export const isValidPhoneNumber = (phone) => {
    if (!phone) return true
    
    const phoneRegex = /^[\+]?[0-9]{7,15}$/
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    return phoneRegex.test(cleanPhone)
  }
  
  /**
   * Get changed fields between objects
   * @param {Object} original - Original data
   * @param {Object} current - Current data
   * @returns {Object} Changed fields
   */
  export const getChangedFields = (original, current) => {
    const changes = {}
    
    Object.keys(current).forEach(key => {
      if (current[key] !== original[key]) {
        changes[key] = current[key]
      }
    })
    
    return changes
  }