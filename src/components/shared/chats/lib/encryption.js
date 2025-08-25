// src/components/shared/chats/lib/encryption.js - Frontend-Only End-to-End Encryption

import CryptoJS from 'crypto-js';

// 🔐 ENCRYPTION CONFIG
const ENCRYPTION_CONFIG = {
  algorithm: 'AES',
  keySize: 256 / 32, // 256 bits
  ivSize: 128 / 32,   // 128 bits 
  iterations: 1000,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
};

// 🔑 Get encryption key from environment
const getEncryptionKey = () => {
  // Get from environment variables
  const key = process.env.REACT_APP_CHAT_ENCRYPTION_KEY || 
              import.meta.env.VITE_CHAT_ENCRYPTION_KEY ||
              'ruangdiri-default-chat-key-2024'; // fallback for development
  
  console.log('🔑 Encryption key status:', {
    hasReactAppKey: !!process.env.REACT_APP_CHAT_ENCRYPTION_KEY,
    hasViteKey: !!import.meta.env.VITE_CHAT_ENCRYPTION_KEY,
    usingFallback: !process.env.REACT_APP_CHAT_ENCRYPTION_KEY && !import.meta.env.VITE_CHAT_ENCRYPTION_KEY,
    keyLength: key?.length || 0
  });
  
  return key;
};

// 🛡️ ENCRYPTION CLASS
class ChatEncryption {
  constructor() {
    this.encryptionKey = getEncryptionKey();
    this.isEnabled = true;
    
    // Validate key
    if (!this.encryptionKey || this.encryptionKey.length < 16) {
      console.error('❌ Invalid encryption key! Messages will not be encrypted properly.');
      this.isEnabled = false;
    }
    
    console.log('🔐 ChatEncryption initialized:', {
      keyLength: this.encryptionKey?.length || 0,
      isEnabled: this.isEnabled
    });
  }

  /**
   * Generate a random IV for encryption
   */
  generateIV() {
    return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize);
  }

  /**
   * Derive key from master key using PBKDF2
   */
  deriveKey(masterKey, salt) {
    return CryptoJS.PBKDF2(masterKey, salt, {
      keySize: ENCRYPTION_CONFIG.keySize,
      iterations: ENCRYPTION_CONFIG.iterations
    });
  }

  /**
   * Encrypt message text
   * @param {string} plaintext - The message to encrypt
   * @param {string} sessionId - Session ID for additional entropy
   * @returns {string} Encrypted message in format: iv:salt:encrypted
   */
  encrypt(plaintext, sessionId = '') {
    if (!this.isEnabled || !plaintext || typeof plaintext !== 'string') {
      console.warn('⚠️ Encryption disabled or invalid input, returning plaintext');
      return plaintext;
    }

    try {
      // Generate random IV and salt
      const iv = this.generateIV();
      const salt = CryptoJS.lib.WordArray.random(128 / 8); // 128-bit salt
      
      // Create session-specific entropy
      const sessionSalt = sessionId ? CryptoJS.SHA256(sessionId + salt.toString()).toString() : salt.toString();
      
      // Derive encryption key
      const derivedKey = this.deriveKey(this.encryptionKey + sessionSalt, salt);
      
      // Encrypt the plaintext
      const encrypted = CryptoJS.AES.encrypt(plaintext, derivedKey, {
        iv: iv,
        mode: ENCRYPTION_CONFIG.mode,
        padding: ENCRYPTION_CONFIG.padding
      });

      // Combine IV + salt + encrypted data
      const result = `${iv.toString()}:${salt.toString()}:${encrypted.toString()}`;
      
      console.log('🔒 Message encrypted:', {
        originalLength: plaintext.length,
        encryptedLength: result.length,
        sessionId: sessionId?.slice(-8) || 'none'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return plaintext; // Fallback to plaintext
    }
  }

  /**
   * Decrypt message text
   * @param {string} encryptedText - The encrypted message in format: iv:salt:encrypted
   * @param {string} sessionId - Session ID for additional entropy
   * @returns {string} Decrypted message or original text if decryption fails
   */
  decrypt(encryptedText, sessionId = '') {
    if (!this.isEnabled || !encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }

    // Check if text is encrypted (contains our format)
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      console.log('📝 Text not encrypted, returning as-is');
      return encryptedText; // Not encrypted, return as-is
    }

    try {
      const [ivHex, saltHex, encryptedData] = parts;
      
      // Parse components
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const salt = CryptoJS.enc.Hex.parse(saltHex);
      
      // Create session-specific entropy
      const sessionSalt = sessionId ? CryptoJS.SHA256(sessionId + salt.toString()).toString() : salt.toString();
      
      // Derive the same key used for encryption
      const derivedKey = this.deriveKey(this.encryptionKey + sessionSalt, salt);
      
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(encryptedData, derivedKey, {
        iv: iv,
        mode: ENCRYPTION_CONFIG.mode,
        padding: ENCRYPTION_CONFIG.padding
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error('Decryption resulted in empty string');
      }
      
      console.log('🔓 Message decrypted successfully:', {
        encryptedLength: encryptedText.length,
        decryptedLength: decryptedText.length,
        sessionId: sessionId?.slice(-8) || 'none'
      });
      
      return decryptedText;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      console.warn('⚠️ Returning encrypted text as fallback');
      return encryptedText; // Return original if decryption fails
    }
  }

  /**
   * Test encryption/decryption with sample data
   */
  test() {
    const testMessage = "Hello, this is a test message! 🔒";
    const testSessionId = "test-session-123";
    
    console.log('🧪 Testing encryption...');
    console.log('Original:', testMessage);
    
    const encrypted = this.encrypt(testMessage, testSessionId);
    console.log('Encrypted:', encrypted);
    
    const decrypted = this.decrypt(encrypted, testSessionId);
    console.log('Decrypted:', decrypted);
    
    const success = testMessage === decrypted;
    console.log('Test result:', success ? '✅ SUCCESS' : '❌ FAILED');
    
    return success;
  }

  /**
   * Get encryption status and info
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      hasValidKey: this.encryptionKey && this.encryptionKey.length >= 16,
      keySource: process.env.REACT_APP_CHAT_ENCRYPTION_KEY ? 'environment' : 'fallback',
      algorithm: 'AES-256-CBC',
      keyDerivation: 'PBKDF2'
    };
  }
}

// 🏭 Create singleton instance
const chatEncryption = new ChatEncryption();

// 🧪 Auto-test in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    console.log('🔐 Encryption Status:', chatEncryption.getStatus());
    chatEncryption.test();
  }, 1000);
}

// 🌍 Expose to window for debugging
if (typeof window !== 'undefined') {
  window.chatEncryption = chatEncryption;
  window.testChatEncryption = () => chatEncryption.test();
}

export default chatEncryption;