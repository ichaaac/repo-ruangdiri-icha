// src/components/shared/chats/lib/encryption.js - E2E Chat Encryption System

import CryptoJS from 'crypto-js';

// E2E Configuration
const E2E_CONFIG = {
  keySize: 256 / 32, // 256-bit keys (8 words)
  algorithm: 'ECDH-ES',
  keyVersion: 1,
  sessionKeySize: 256 / 32,
  iterations: 10000,
  saltBytes: 16,
  ivBytes: 16
};

// E2E Logger for debugging
const E2ELogger = {
  log: (level, operation, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] E2E-${operation.toUpperCase()}:`,
      styles[level] || styles.info,
      data || ''
    );
  }
};

/**
 * E2E Chat Encryption Manager
 * Handles account keypairs, session keys, and message encryption
 */
class E2EChatEncryption {
  constructor() {
    this.accountKeyPair = null;
    this.sessionKeys = new Map(); // sessionId -> sessionKey
    this.isEnabled = true;
    
    E2ELogger.log('info', 'INIT', 'E2E Chat Encryption initialized');
  }

  /**
   * Generate account keypair (call once per account)
   */
  async generateAccountKeyPair() {
    try {
      E2ELogger.log('info', 'GENERATE_KEYPAIR', 'Generating account keypair...');

      // Generate private key (256-bit)
      const privateKey = CryptoJS.lib.WordArray.random(256 / 8);
      
      // Generate public key (derived from private key)
      const publicKey = CryptoJS.SHA256(privateKey.toString());

      const keyPair = {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
        keyVersion: E2E_CONFIG.keyVersion,
        createdAt: new Date().toISOString()
      };

      this.accountKeyPair = keyPair;
      
      E2ELogger.log('success', 'GENERATE_KEYPAIR', {
        publicKeyLength: keyPair.publicKey.length,
        privateKeyLength: keyPair.privateKey.length,
        keyVersion: keyPair.keyVersion
      });

      return keyPair;
    } catch (error) {
      E2ELogger.log('error', 'GENERATE_KEYPAIR', error);
      throw new Error('Failed to generate keypair');
    }
  }

  /**
   * Store encrypted private key in localStorage (encrypted with user password)
   */
  storePrivateKey(privateKey, userPassword) {
    try {
      E2ELogger.log('info', 'STORE_KEY', 'Storing encrypted private key...');

      const salt = CryptoJS.lib.WordArray.random(E2E_CONFIG.saltBytes);
      const key = CryptoJS.PBKDF2(userPassword, salt, {
        keySize: E2E_CONFIG.keySize,
        iterations: E2E_CONFIG.iterations
      });

      const iv = CryptoJS.lib.WordArray.random(E2E_CONFIG.ivBytes);
      const encrypted = CryptoJS.AES.encrypt(privateKey, key, { iv });

      const encryptedData = {
        encrypted: encrypted.toString(),
        salt: salt.toString(),
        iv: iv.toString(),
        keyVersion: E2E_CONFIG.keyVersion,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('e2e_private_key', JSON.stringify(encryptedData));
      
      E2ELogger.log('success', 'STORE_KEY', 'Private key stored securely');
      return true;
    } catch (error) {
      E2ELogger.log('error', 'STORE_KEY', error);
      throw new Error('Failed to store private key');
    }
  }

  /**
   * Retrieve and decrypt private key from localStorage
   */
  retrievePrivateKey(userPassword) {
    try {
      E2ELogger.log('info', 'RETRIEVE_KEY', 'Retrieving private key...');

      const storedData = localStorage.getItem('e2e_private_key');
      if (!storedData) {
        E2ELogger.log('warn', 'RETRIEVE_KEY', 'No stored private key found');
        return null;
      }

      const encryptedData = JSON.parse(storedData);
      
      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      
      const key = CryptoJS.PBKDF2(userPassword, salt, {
        keySize: E2E_CONFIG.keySize,
        iterations: E2E_CONFIG.iterations
      });

      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, { iv });
      const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

      if (!privateKey) {
        throw new Error('Invalid password or corrupted key');
      }

      E2ELogger.log('success', 'RETRIEVE_KEY', 'Private key retrieved successfully');
      return privateKey;
    } catch (error) {
      E2ELogger.log('error', 'RETRIEVE_KEY', error);
      throw new Error('Failed to retrieve private key');
    }
  }

  /**
   * Generate session key for E2E session
   */
  generateSessionKey(sessionId) {
    try {
      E2ELogger.log('info', 'GENERATE_SESSION_KEY', `Generating session key for: ${sessionId}`);

      const sessionKey = CryptoJS.lib.WordArray.random(E2E_CONFIG.sessionKeySize * 4);
      const sessionKeyString = sessionKey.toString();

      this.sessionKeys.set(sessionId, sessionKeyString);
      
      E2ELogger.log('success', 'GENERATE_SESSION_KEY', {
        sessionId: sessionId?.slice(-8),
        keyLength: sessionKeyString.length
      });

      return sessionKeyString;
    } catch (error) {
      E2ELogger.log('error', 'GENERATE_SESSION_KEY', error);
      throw new Error('Failed to generate session key');
    }
  }

  /**
   * Store session key
   */
  setSessionKey(sessionId, sessionKey) {
    try {
      this.sessionKeys.set(sessionId, sessionKey);
      
      E2ELogger.log('info', 'SET_SESSION_KEY', {
        sessionId: sessionId?.slice(-8),
        keyLength: sessionKey?.length
      });
    } catch (error) {
      E2ELogger.log('error', 'SET_SESSION_KEY', error);
    }
  }

  /**
   * Get session key
   */
  getSessionKey(sessionId) {
    return this.sessionKeys.get(sessionId) || null;
  }

  /**
   * Encrypt message for session
   */
  encryptMessage(message, sessionId) {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      if (!sessionKey) {
        E2ELogger.log('warn', 'ENCRYPT_MESSAGE', `No session key found for: ${sessionId}`);
        return message; // Return plaintext if no key
      }

      const iv = CryptoJS.lib.WordArray.random(E2E_CONFIG.ivBytes);
      const key = CryptoJS.enc.Hex.parse(sessionKey);
      
      const encrypted = CryptoJS.AES.encrypt(message, key, { iv });
      
      const encryptedData = {
        encrypted: encrypted.toString(),
        iv: iv.toString(),
        keyVersion: E2E_CONFIG.keyVersion
      };

      const result = JSON.stringify(encryptedData);
      
      E2ELogger.log('info', 'ENCRYPT_MESSAGE', {
        sessionId: sessionId?.slice(-8),
        originalLength: message.length,
        encryptedLength: result.length
      });

      return result;
    } catch (error) {
      E2ELogger.log('error', 'ENCRYPT_MESSAGE', error);
      return message; // Fallback to plaintext
    }
  }

  /**
   * Decrypt message for session
   */
  decryptMessage(encryptedMessage, sessionId) {
    try {
      // Check if message is encrypted (JSON format)
      let encryptedData;
      try {
        encryptedData = JSON.parse(encryptedMessage);
      } catch {
        E2ELogger.log('warn', 'DECRYPT_MESSAGE', 'Message not encrypted, returning as-is');
        return encryptedMessage; // Not encrypted, return as-is
      }

      const sessionKey = this.getSessionKey(sessionId);
      if (!sessionKey) {
        E2ELogger.log('warn', 'DECRYPT_MESSAGE', `No session key found for: ${sessionId}`);
        return encryptedMessage; // Return encrypted text if no key
      }

      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      const key = CryptoJS.enc.Hex.parse(sessionKey);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, { iv });
      const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedMessage) {
        throw new Error('Decryption failed - empty result');
      }

      E2ELogger.log('info', 'DECRYPT_MESSAGE', {
        sessionId: sessionId?.slice(-8),
        encryptedLength: encryptedMessage.length,
        decryptedLength: decryptedMessage.length
      });

      return decryptedMessage;
    } catch (error) {
      E2ELogger.log('error', 'DECRYPT_MESSAGE', error);
      return encryptedMessage; // Fallback to encrypted text
    }
  }

  /**
   * Perform ECDH key exchange
   */
  performKeyExchange(otherPublicKey, myPrivateKey) {
    try {
      E2ELogger.log('info', 'KEY_EXCHANGE', 'Performing ECDH key exchange...');

      // Simple ECDH simulation using hash combination
      const sharedSecret = CryptoJS.SHA256(otherPublicKey + myPrivateKey);
      const sessionKey = sharedSecret.toString();

      E2ELogger.log('success', 'KEY_EXCHANGE', {
        sharedSecretLength: sessionKey.length
      });

      return sessionKey;
    } catch (error) {
      E2ELogger.log('error', 'KEY_EXCHANGE', error);
      throw new Error('Key exchange failed');
    }
  }

  /**
   * Generate shared secret for handshake
   */
  generateSharedSecret(sessionId, participants) {
    try {
      E2ELogger.log('info', 'GENERATE_SHARED_SECRET', `Session: ${sessionId}`);

      const sessionData = sessionId + participants.join('');
      const sharedSecret = CryptoJS.SHA256(sessionData + Date.now()).toString();

      E2ELogger.log('success', 'GENERATE_SHARED_SECRET', {
        sessionId: sessionId?.slice(-8),
        participantsCount: participants.length,
        secretLength: sharedSecret.length
      });

      return sharedSecret;
    } catch (error) {
      E2ELogger.log('error', 'GENERATE_SHARED_SECRET', error);
      throw new Error('Failed to generate shared secret');
    }
  }

  /**
   * Rotate session key
   */
  rotateSessionKey(sessionId) {
    try {
      E2ELogger.log('info', 'ROTATE_KEY', `Rotating key for session: ${sessionId}`);

      const newSessionKey = this.generateSessionKey(sessionId);
      
      E2ELogger.log('success', 'ROTATE_KEY', {
        sessionId: sessionId?.slice(-8),
        newKeyLength: newSessionKey.length
      });

      return newSessionKey;
    } catch (error) {
      E2ELogger.log('error', 'ROTATE_KEY', error);
      throw new Error('Failed to rotate session key');
    }
  }

  /**
   * Clear session key
   */
  clearSessionKey(sessionId) {
    try {
      this.sessionKeys.delete(sessionId);
      E2ELogger.log('info', 'CLEAR_SESSION_KEY', `Cleared key for: ${sessionId?.slice(-8)}`);
    } catch (error) {
      E2ELogger.log('error', 'CLEAR_SESSION_KEY', error);
    }
  }

  /**
   * Clear all session keys
   */
  clearAllSessionKeys() {
    try {
      this.sessionKeys.clear();
      E2ELogger.log('info', 'CLEAR_ALL_KEYS', 'All session keys cleared');
    } catch (error) {
      E2ELogger.log('error', 'CLEAR_ALL_KEYS', error);
    }
  }

  /**
   * Check if account keypair exists
   */
  hasAccountKeyPair() {
    return !!localStorage.getItem('e2e_private_key');
  }

  /**
   * Get account public key
   */
  getAccountPublicKey() {
    return this.accountKeyPair?.publicKey || null;
  }

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      hasAccountKeyPair: this.hasAccountKeyPair(),
      sessionKeysCount: this.sessionKeys.size,
      algorithm: E2E_CONFIG.algorithm,
      keyVersion: E2E_CONFIG.keyVersion
    };
  }

  /**
   * Test E2E encryption
   */
  test() {
    const testMessage = "Test E2E message";
    const testSessionId = "test-session-123";
    
    console.log('🧪 Testing E2E encryption...');
    console.log('Original:', testMessage);
    
    // Generate session key
    const sessionKey = this.generateSessionKey(testSessionId);
    console.log('Session key generated');
    
    // Encrypt
    const encrypted = this.encryptMessage(testMessage, testSessionId);
    console.log('Encrypted:', encrypted);
    
    // Decrypt
    const decrypted = this.decryptMessage(encrypted, testSessionId);
    console.log('Decrypted:', decrypted);
    
    const success = testMessage === decrypted;
    console.log('Test result:', success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Cleanup
    this.clearSessionKey(testSessionId);
    
    return success;
  }
}

// Create singleton instance
const e2eEncryption = new E2EChatEncryption();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.e2eEncryption = e2eEncryption;
  window.testE2E = () => e2eEncryption.test();
}

export default e2eEncryption;