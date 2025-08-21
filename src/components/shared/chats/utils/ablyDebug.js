// src/components/shared/chats/utils/ablyDebug.js - Debug & Crypto Utilities

// 🔐 MESSAGE ENCRYPTION/DECRYPTION UTILITIES
export const MessageCrypto = {
  // Simple encryption placeholder (replace with real encryption later)
  encrypt: (data) => {
    if (!data) return data;
    
    // For now, just add a flag and timestamp
    // Later implement AES-256 or your preferred encryption
    const encrypted = {
      encrypted: true,
      timestamp: new Date().toISOString(),
      payload: data, // In real implementation, this would be encrypted
      algorithm: 'AES-256-GCM', // Placeholder
      version: '1.0'
    };
    
    console.log('🔐 CRYPTO: Encrypting message', {
      original: data,
      encrypted: encrypted
    });
    
    return encrypted;
  },

  decrypt: (encryptedData) => {
    if (!encryptedData) return encryptedData;
    
    // Check if it's actually encrypted
    if (typeof encryptedData === 'object' && encryptedData.encrypted === true) {
      console.log('🔓 CRYPTO: Decrypting message', {
        encrypted: encryptedData,
        algorithm: encryptedData.algorithm,
        version: encryptedData.version
      });
      
      // In real implementation, decrypt the payload
      return encryptedData.payload;
    }
    
    // Not encrypted, return as is
    return encryptedData;
  },

  // Check if message is encrypted
  isEncrypted: (data) => {
    return typeof data === 'object' && data.encrypted === true;
  },

  // Generate encryption key (placeholder)
  generateKey: () => {
    // In real implementation, use crypto.getRandomValues() or similar
    return 'placeholder-key-' + Math.random().toString(36).substr(2, 9);
  }
};

// 🔍 ABLY EVENT ANALYZER
export const AblyAnalyzer = {
  // Analyze and categorize Ably events
  analyzeEvent: (message) => {
    const analysis = {
      timestamp: new Date().toISOString(),
      messageId: message.id,
      action: message.action,
      actionType: AblyAnalyzer.getActionType(message.action),
      channel: message.channel,
      channelType: AblyAnalyzer.getChannelType(message.channel),
      hasData: !!message.data,
      dataSize: message.data ? JSON.stringify(message.data).length : 0,
      encoding: message.encoding,
      clientId: message.clientId,
      isOwnMessage: false // Will be determined by caller
    };

    console.group('🔍 ABLY EVENT ANALYSIS');
    console.table(analysis);
    console.log('📦 Raw Message:', message);
    if (message.data) {
      console.log('📄 Message Data:', message.data);
    }
    console.groupEnd();

    return analysis;
  },

  // Map Ably action codes to readable names
  getActionType: (action) => {
    const actionTypes = {
      0: 'HEARTBEAT',
      1: 'ACK',
      2: 'NACK', 
      3: 'CONNECT',
      4: 'CONNECTED',
      5: 'DISCONNECT',
      6: 'DISCONNECTED',
      7: 'CLOSE',
      8: 'CLOSED',
      9: 'ERROR',
      10: 'ATTACH',
      11: 'ATTACHED',
      12: 'DETACH',
      13: 'DETACHED',
      14: 'PRESENCE',
      15: 'MESSAGE',
      16: 'PRESENCE_MESSAGE',
      17: 'SYNC',
      18: 'AUTH'
    };
    return actionTypes[action] || `UNKNOWN(${action})`;
  },

  // Determine channel type from channel name
  getChannelType: (channelName) => {
    if (!channelName) return 'UNKNOWN';
    
    if (channelName.includes('chat:session:')) return 'CHAT';
    if (channelName.includes('typing:session:')) return 'TYPING';
    if (channelName.includes('presence:')) return 'PRESENCE';
    if (channelName.includes('system:')) return 'SYSTEM';
    
    return 'OTHER';
  },

  // Parse session ID from channel name
  getSessionIdFromChannel: (channelName) => {
    if (!channelName) return null;
    
    const chatMatch = channelName.match(/chat:session:([a-f0-9-]+)/);
    const typingMatch = channelName.match(/typing:session:([a-f0-9-]+)/);
    
    return chatMatch?.[1] || typingMatch?.[1] || null;
  }
};

// 🧪 ABLY TESTING UTILITIES
export const AblyTester = {
  // Test message sending
  testSendMessage: async (ably, sessionId, testMessage = 'Test message from debug utility') => {
    if (!ably || !sessionId) {
      console.error('❌ Missing ably instance or sessionId for test');
      return false;
    }

    try {
      const testData = {
        sessionId,
        message: testMessage,
        messageType: 'test',
        senderId: 'test-user',
        timestamp: new Date().toISOString(),
        isTest: true
      };

      console.log('🧪 TESTING: Sending test message', testData);
      
      const result = await ably.sendMessageViaAbly(sessionId, testData);
      
      if (result) {
        console.log('✅ TEST: Message sent successfully via Ably');
      } else {
        console.log('⚠️ TEST: Message sent via API fallback');
      }
      
      return result;
    } catch (error) {
      console.error('❌ TEST: Failed to send test message', error);
      return false;
    }
  },

  // Test typing indicator
  testTyping: async (ably, sessionId, duration = 3000) => {
    if (!ably || !sessionId) {
      console.error('❌ Missing ably instance or sessionId for typing test');
      return;
    }

    try {
      console.log('🧪 TESTING: Starting typing indicator test');
      
      // Start typing
      await ably.sendTyping(sessionId, true, 'test-user');
      console.log('⌨️ TEST: Typing started');
      
      // Stop typing after duration
      setTimeout(async () => {
        await ably.sendTyping(sessionId, false, 'test-user');
        console.log('✅ TEST: Typing stopped');
      }, duration);
      
    } catch (error) {
      console.error('❌ TEST: Typing test failed', error);
    }
  },

  // Test connection info
  testConnection: (ably) => {
    if (!ably) {
      console.error('❌ Missing ably instance for connection test');
      return;
    }

    const info = ably.getConnectionInfo();
    
    console.group('🧪 CONNECTION TEST');
    console.table(info);
    console.log('📊 Full Connection Info:', info);
    console.groupEnd();
    
    return info;
  }
};

// 📊 ABLY PERFORMANCE MONITOR
export class AblyPerformanceMonitor {
  constructor() {
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      connectionEvents: 0,
      typingEvents: 0,
      errors: 0,
      startTime: Date.now(),
      lastActivity: Date.now()
    };
    
    this.messageLatencies = [];
    this.connectionHistory = [];
  }

  // Record received message
  recordMessage(message) {
    this.metrics.messagesReceived++;
    this.metrics.lastActivity = Date.now();
    
    // Calculate latency if message has timestamp
    if (message.timestamp) {
      const latency = Date.now() - new Date(message.timestamp).getTime();
      this.messageLatencies.push(latency);
    }
    
    this.logMetrics();
  }

  // Record sent message
  recordSentMessage() {
    this.metrics.messagesSent++;
    this.metrics.lastActivity = Date.now();
    this.logMetrics();
  }

  // Record connection event
  recordConnectionEvent(state) {
    this.metrics.connectionEvents++;
    this.connectionHistory.push({
      state,
      timestamp: Date.now()
    });
    
    // Keep only last 50 connection events
    if (this.connectionHistory.length > 50) {
      this.connectionHistory = this.connectionHistory.slice(-50);
    }
    
    this.logMetrics();
  }

  // Record typing event
  recordTypingEvent() {
    this.metrics.typingEvents++;
    this.metrics.lastActivity = Date.now();
  }

  // Record error
  recordError(error) {
    this.metrics.errors++;
    console.error('📊 PERFORMANCE: Error recorded', error);
  }

  // Get performance summary
  getSummary() {
    const uptime = Date.now() - this.metrics.startTime;
    const avgLatency = this.messageLatencies.length > 0 
      ? this.messageLatencies.reduce((a, b) => a + b, 0) / this.messageLatencies.length 
      : 0;

    return {
      ...this.metrics,
      uptime,
      averageLatency: Math.round(avgLatency),
      messagesPerMinute: Math.round((this.metrics.messagesReceived / uptime) * 60000),
      lastLatencies: this.messageLatencies.slice(-10),
      recentConnections: this.connectionHistory.slice(-5)
    };
  }

  // Log current metrics
  logMetrics() {
    if (this.metrics.messagesReceived % 10 === 0) { // Log every 10 messages
      console.log('📊 PERFORMANCE METRICS:', this.getSummary());
    }
  }

  // Reset metrics
  reset() {
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      connectionEvents: 0,
      typingEvents: 0,
      errors: 0,
      startTime: Date.now(),
      lastActivity: Date.now()
    };
    this.messageLatencies = [];
    this.connectionHistory = [];
    console.log('📊 PERFORMANCE: Metrics reset');
  }
}

// 🎯 GLOBAL DEBUG INTERFACE
export const AblyDebugInterface = {
  // Initialize debug interface on window
  init: (ablyInstance) => {
    if (typeof window === 'undefined') return;

    const monitor = new AblyPerformanceMonitor();

    window.ablyDebug = {
      // Core utilities
      crypto: MessageCrypto,
      analyzer: AblyAnalyzer,
      tester: AblyTester,
      monitor,
      
      // Quick access methods
      analyze: (message) => AblyAnalyzer.analyzeEvent(message),
      testMessage: (sessionId, message) => AblyTester.testSendMessage(ablyInstance, sessionId, message),
      testTyping: (sessionId, duration) => AblyTester.testTyping(ablyInstance, sessionId, duration),
      getConnection: () => AblyTester.testConnection(ablyInstance),
      getMetrics: () => monitor.getSummary(),
      resetMetrics: () => monitor.reset(),
      
      // Crypto testing
      encryptTest: (data) => {
        const encrypted = MessageCrypto.encrypt(data);
        const decrypted = MessageCrypto.decrypt(encrypted);
        console.log('🔐 CRYPTO TEST:', { original: data, encrypted, decrypted });
        return { encrypted, decrypted };
      },
      
      // Enable/disable verbose logging
      verboseLogging: true,
      
      // Export logs
      exportLogs: () => {
        const logs = {
          timestamp: new Date().toISOString(),
          metrics: monitor.getSummary(),
          connectionHistory: monitor.connectionHistory,
          ablyState: ablyInstance?.getConnectionInfo?.() || 'Not available'
        };
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ably-debug-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📄 DEBUG: Logs exported', logs);
      }
    };

    console.log('🎯 ABLY DEBUG: Interface initialized. Use window.ablyDebug to access utilities.');
    console.log('Available methods:', Object.keys(window.ablyDebug));
  }
};

// Default export for convenience
export default {
  MessageCrypto,
  AblyAnalyzer,
  AblyTester,
  AblyPerformanceMonitor,
  AblyDebugInterface
};