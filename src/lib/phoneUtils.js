// src/lib/phoneUtils.js
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Format phone number untuk display
 */
export const formatPhoneDisplay = (phoneNumber, defaultCountry = 'ID') => {
  if (!phoneNumber) return '-';
  
  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    
    if (parsed && parsed.isValid()) {
      // Format as: +62 | 813-1548-1787
      const countryCode = `+${parsed.countryCallingCode}`;
      let nationalNumber = parsed.nationalNumber;
      
      // Remove leading zero for Indonesia and other countries if exists
      if (nationalNumber.startsWith('0')) {
        nationalNumber = nationalNumber.substring(1);
      }
      
      // Format national number with dashes
      if (nationalNumber.length >= 10) {
        nationalNumber = `${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3, 7)}-${nationalNumber.slice(7)}`;
      } else if (nationalNumber.length >= 7) {
        nationalNumber = `${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3)}`;
      }
      
      return `${countryCode} | ${nationalNumber}`;
    }
  } catch (error) {
    console.warn('Error formatting phone number:', error);
  }
  
  // Return original if parsing fails
  return phoneNumber;
};

/**
 * Validasi phone number pake libphonenumber-js
 * Ini yang handle beda negara
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return "Nomor telepon wajib diisi";
  }

  // Handle empty phone format dari react-international-phone
  if (phoneNumber === '+62' || phoneNumber.length < 4) {
    return "Nomor telepon tidak valid";
  }

  try {
    // Parse tanpa default country biar dia detect sendiri dari +code
    const parsed = parsePhoneNumber(phoneNumber);
    
    if (!parsed) {
      return "Format nomor telepon tidak valid";
    }

    // Cek apakah valid untuk negara tersebut
    if (!parsed.isValid()) {
      const country = parsed.country;
      if (country === 'ID') {
        return "Nomor telepon Indonesia harus 10-13 digit";
      } else if (country === 'US') {
        return "Nomor telepon Amerika harus 10 digit";
      } else if (country === 'MY') {
        return "Nomor telepon Malaysia harus 9-10 digit";
      } else if (country === 'SG') {
        return "Nomor telepon Singapura harus 8 digit";
      } else {
        return `Nomor telepon ${country || 'negara ini'} tidak valid`;
      }
    }

    return null; // Valid
  } catch (error) {
    console.warn('Phone validation error:', error);
    return "Format nomor telepon tidak valid";
  }
};

/**
 * Helper function buat cek apakah phone kosong
 */
export const isEmptyPhone = (phone) => {
  return !phone || phone.trim() === '' || phone === '+62' || phone === '+1' || phone === '+44';
};

/**
 * Helper function buat extract digits aja
 */
export const extractDigits = (phone) => {
  return phone.replace(/\D/g, '');
};