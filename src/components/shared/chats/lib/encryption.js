// src/components/shared/chats/lib/encryption.js - FIXED: Using ENV Encryption Key

import CryptoJS from 'crypto-js';

// Get encryption key from environment
const getEncryptionKey = () => {
  const key = import.meta.env.VITE_CHAT_ENCRYPTION_KEY || process.env.REACT_APP_CHAT_ENCRYPTION_KEY;
  return key;
};

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES',
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
  keySize: 256 / 32, // 256-bit key
  ivSize: 128 / 32,  // 128-bit IV
  iterations: 1000
};

// Encryption Logger
const EncryptionLogger = {
  log: (level, operation, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;',
      crypto: 'color: #FF9800; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] CRYPTO-${operation.toUpperCase()}:`,
      styles[level] || styles.info,
      data || ''
    );
  }
};

/**
 * Chat Encryption Manager - Using ENV Key
 */
class ChatEncryption {
  constructor() {
    this.encryptionKey = getEncryptionKey();
    this.isEnabled = true;
    
    EncryptionLogger.log('info', 'INIT', {
      hasKey: !!this.encryptionKey,
      keyLength: this.encryptionKey?.length || 0
    });
  }

  /**
   * Generate a random IV for encryption
   */
  generateIV() {
    return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize * 4);
  }

  /**
   * Encrypt message using AES-256-CBC
   */
  encrypt(message, sessionId = '') {
    try {
      if (!message || typeof message !== 'string') {
        EncryptionLogger.log('warn', 'ENCRYPT', 'Invalid message input');
        return message;
      }

      if (!this.encryptionKey) {
        EncryptionLogger.log('error', 'ENCRYPT', 'No encryption key available');
        return message;
      }

      // Generate random IV
      const iv = this.generateIV();
      
      // Parse the key
      const key = CryptoJS.enc.Hex.parse(this.encryptionKey);
      
      // Encrypt the message
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: ENCRYPTION_CONFIG.mode,
        padding: ENCRYPTION_CONFIG.padding
      });

      // Combine IV + encrypted data
      const encryptedData = {
        iv: iv.toString(CryptoJS.enc.Hex),
        data: encrypted.toString(),
        version: '1.0'
      };

      const result = JSON.stringify(encryptedData);
      
      EncryptionLogger.log('crypto', 'ENCRYPT', {
        sessionId: sessionId?.slice(-8) || 'unknown',
        originalLength: message.length,
        encryptedLength: result.length,
        hasIV: !!encryptedData.iv
      });

      return result;
    } catch (error) {
      EncryptionLogger.log('error', 'ENCRYPT', error);
      return message; // Return original message on error
    }
  }

  /**
   * Decrypt message using AES-256-CBC
   */
  decrypt(encryptedMessage, sessionId = '') {
    try {
      if (!encryptedMessage || typeof encryptedMessage !== 'string') {
        EncryptionLogger.log('warn', 'DECRYPT', 'Invalid encrypted message input');
        return encryptedMessage;
      }

      if (!this.encryptionKey) {
        EncryptionLogger.log('error', 'DECRYPT', 'No encryption key available');
        return encryptedMessage;
      }

      // Try to parse as JSON (encrypted format)
      let encryptedData;
      try {
        encryptedData = JSON.parse(encryptedMessage);
      } catch {
        EncryptionLogger.log('warn', 'DECRYPT', 'Message not in encrypted format, returning as-is');
        return encryptedMessage; // Not encrypted, return as-is
      }

      // Validate encrypted data structure
      if (!encryptedData.iv || !encryptedData.data) {
        EncryptionLogger.log('warn', 'DECRYPT', 'Invalid encrypted data structure');
        return encryptedMessage;
      }

      // Parse key and IV
      const key = CryptoJS.enc.Hex.parse(this.encryptionKey);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

      // Decrypt the message
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key, {
        iv: iv,
        mode: ENCRYPTION_CONFIG.mode,
        padding: ENCRYPTION_CONFIG.padding
      });

      const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedMessage) {
        throw new Error('Decryption failed - empty result');
      }

      EncryptionLogger.log('crypto', 'DECRYPT', {
        sessionId: sessionId?.slice(-8) || 'unknown',
        encryptedLength: encryptedMessage.length,
        decryptedLength: decryptedMessage.length,
        version: encryptedData.version
      });

      return decryptedMessage;
    } catch (error) {
      EncryptionLogger.log('error', 'DECRYPT', error);
      return encryptedMessage; // Return encrypted text on error
    }
  }

  /**
   * Check if message is encrypted
   */
  isEncrypted(message) {
    if (!message || typeof message !== 'string') return false;
    
    try {
      const parsed = JSON.parse(message);
      return !!(parsed.iv && parsed.data && parsed.version);
    } catch {
      return false;
    }
  }

  /**
   * Test encryption/decryption
   */
  test() {
    const testMessage = "Test encryption message 🔒";
    const testSessionId = "test-session-123";
    
    console.log('🧪 Testing chat encryption...');
    console.log('Original:', testMessage);
    
    // Encrypt
    const encrypted = this.encrypt(testMessage, testSessionId);
    console.log('Encrypted:', encrypted);
    console.log('Is encrypted:', this.isEncrypted(encrypted));
    
    // Decrypt
    const decrypted = this.decrypt(encrypted, testSessionId);
    console.log('Decrypted:', decrypted);
    
    const success = testMessage === decrypted;
    console.log('Test result:', success ? '✅ SUCCESS' : '❌ FAILED');
    
    return success;
  }

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      hasKey: !!this.encryptionKey,
      keyLength: this.encryptionKey?.length || 0,
      algorithm: 'AES-256-CBC',
      version: '1.0'
    };
  }

  /**
   * Rotate encryption key (for future use)
   */
  rotateKey(newKey) {
    if (!newKey || typeof newKey !== 'string') {
      throw new Error('Invalid new key');
    }
    
    EncryptionLogger.log('info', 'ROTATE_KEY', {
      oldKeyLength: this.encryptionKey?.length || 0,
      newKeyLength: newKey.length
    });
    
    this.encryptionKey = newKey;
    return true;
  }
}

// Create singleton instance
const chatEncryption = new ChatEncryption();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.chatEncryption = chatEncryption;
  window.testChatEncryption = () => chatEncryption.test();
}

export default chatEncryption;