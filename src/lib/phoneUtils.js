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
 * Sekarang optional - bisa kosong, tapi validasinya lebih strict
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Kalau kosong, skip validasi (optional)
  if (!phoneNumber || phoneNumber.trim() === '' || isEmptyPhone(phoneNumber)) {
    return null; // Valid (kosong diperbolehkan)
  }

  try {
    // Parse dengan default country dulu buat deteksi yang lebih baik
    let parsed;
    
    // Coba parse tanpa default country dulu
    try {
      parsed = parsePhoneNumber(phoneNumber);
    } catch {
      // Kalau gagal, coba dengan default Indonesia
      parsed = parsePhoneNumber(phoneNumber, 'ID');
    }
    
    if (!parsed) {
      return "Format nomor telepon tidak valid";
    }

    // Cek apakah valid untuk negara tersebut
    if (!parsed.isValid()) {
      return "Format nomor telepon tidak valid";
    }

    // Validasi tambahan berdasarkan negara yang terdeteksi
    const country = parsed.country;
    const nationalNumber = parsed.nationalNumber;
    const digitCount = nationalNumber.length;

    if (country === 'ID') {
      // Indonesia: 10-13 digit (contoh: 8131548xxxx)
      if (digitCount < 10 || digitCount > 13) {
        return "Nomor telepon Indonesia harus 10-13 digit";
      }
      // Cek apakah dimulai dengan 8 (mobile) atau area code yang valid
      if (!nationalNumber.startsWith('8') && !nationalNumber.startsWith('2') && !nationalNumber.startsWith('6')) {
        return "Nomor telepon Indonesia tidak valid";
      }
    } else if (country === 'US') {
      // Amerika: harus 10 digit
      if (digitCount !== 10) {
        return "Nomor telepon Amerika harus 10 digit";
      }
    } else if (country === 'MY') {
      // Malaysia: 9-10 digit
      if (digitCount < 9 || digitCount > 10) {
        return "Nomor telepon Malaysia harus 9-10 digit";
      }
    } else if (country === 'SG') {
      // Singapura: 8 digit
      if (digitCount !== 8) {
        return "Nomor telepon Singapura harus 8 digit";
      }
    } else {
      // Negara lain: validasi umum 7-15 digit
      if (digitCount < 7 || digitCount > 15) {
        return `Nomor telepon ${country || 'ini'} tidak valid (7-15 digit)`;
      }
    }

    return null; // Valid
  } catch (error) {
    console.warn('Phone validation error:', error);
    return "Format nomor telepon tidak valid";
  }
};

/**
 * Helper function buat cek apakah phone kosong - lebih comprehensive
 */
export const isEmptyPhone = (phone) => {
  if (!phone || phone.trim() === '') return true;
  
  // Cek format kosong dari react-international-phone
  const commonEmptyFormats = ['+62', '+1', '+44', '+65', '+60', '+86', '+81', '+82', '+91', '+33', '+49', '+39', '+34', '+7'];
  return commonEmptyFormats.includes(phone.trim());
};

/**
 * Helper function buat extract digits aja
 */
export const extractDigits = (phone) => {
  return phone.replace(/\D/g, '');
};