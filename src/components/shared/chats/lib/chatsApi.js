// src/components/shared/chats/lib/chatsApi.js - With Fixed Timezone Handling

import { apiClient } from "../../../../lib/api.js";

// Fix timezone: Extract time directly from ISO string tanpa konversi
const extractTimeFromISO = (isoString) => {
  // Ambil jam:menit langsung dari string "2025-08-12T15:52:33.572Z"
  const timePart = isoString.split('T')[1]; // "15:52:33.572Z"
  const hourMinute = timePart.substring(0, 5); // "15:52"
  return hourMinute;
};

export const chatsApi = {
  // Get active chat sessions - supports both regular users and psychologists
  async getActiveSessions() {
    try {
      const response = await apiClient.get('/chat/sessions/active');
      
      if (response.data?.status === 'success') {
        const sessions = response.data.data.map(session => ({
          id: session.id,
          sessionId: session.id,
          name: session.psychologist?.fullName || session.client?.fullName || session.clientName || 'Chat Session',
          avatar: session.psychologist?.profilePicture || session.client?.profilePicture || '/empty-profile.svg',
          lastMessage: session.lastMessage || 'Tap to start chatting',
          time: extractTimeFromISO(session.scheduledAt || session.updatedAt || session.createdAt),
          isActive: session.isActive,
          isChatEnabled: session.isChatEnabled,
          isOnline: session.isActive && session.isChatEnabled,
          status: session.status,
          psychologist: session.psychologist,
          client: session.client,
          clientId: session.clientId,
          psychologistId: session.psychologistId,
          counselingId: session.counselingId,
          scheduledAt: session.scheduledAt,
          isTeamChat: false,
          userRole: session.client?.role || 'user'
        }));

        // Always add Team RuangDiri session first (AI integrated helper)
        const teamSession = {
          id: 'team-ruangdiri',
          sessionId: 'team-ruangdiri',
          name: 'Team RuangDiri',
          avatar: null,
          lastMessage: 'AI Assistant - Always available',
          time: new Date().toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isActive: true,
          isChatEnabled: true,
          isTeamChat: true,
          isOnline: true,
          status: 'active',
          isAIAssistant: true
        };

        return [teamSession, ...sessions];
      }
      
      throw new Error(response.data?.message || 'Failed to fetch sessions');
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      
      // Always return team session as fallback
      return [{
        id: 'team-ruangdiri',
        sessionId: 'team-ruangdiri',
        name: 'Team RuangDiri',
        avatar: null,
        lastMessage: 'AI Assistant - Always available',
        time: new Date().toLocaleTimeString("id-ID", {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isActive: true,
        isChatEnabled: true,
        isTeamChat: true,
        isOnline: true,
        status: 'active',
        isAIAssistant: true
      }];
    }
  },

  // Get chat history with AI assistant support
  async getMessages(sessionId) {
    try {
      // Handle AI Team RuangDiri session with welcome message and options
      if (sessionId === 'team-ruangdiri') {
        return [
          {
            id: '1',
            text: "Hello, roomies!\n\nSelamat datang di Ruang Bantu.\nApakah ada yang bisa kami bantu?\nUntuk mempermudah keperluan roomies,\nkamu dapat memilih tiga opsi di bawah ini:",
            time: new Date().toLocaleTimeString("id-ID", {
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: new Date().toISOString(),
            isUser: false,
            sender: {
              id: 'team-ai',
              name: 'Team RuangDiri',
              role: 'ai_assistant'
            },
            messageType: 'ai_welcome',
            showOptions: true,
            isAIMessage: true
          }
        ];
      }

      const response = await apiClient.get('/chat/history', {
        params: {
          sessionId,
          limit: 50
        }
      });
      
      if (response.data?.status === 'success') {
        return response.data.data.map(msg => ({
          id: msg.id,
          sessionId: msg.sessionId,
          text: msg.message,
          time: extractTimeFromISO(msg.createdAt),
          timestamp: msg.createdAt,
          isUser: msg.sender?.role !== 'psychologist' && msg.sender?.role !== 'ai_assistant',
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.sender?.fullName || 'Unknown',
            role: msg.sender?.role || 'user'
          },
          senderId: msg.senderId,
          messageType: msg.messageType,
          isRead: msg.isRead,
          isAutomated: msg.messageType === 'automated'
        }));
      }
      
      throw new Error(response.data?.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message with AI assistant support
  async sendMessage(sessionId, content) {
    try {
      // Handle AI Team RuangDiri session
      if (sessionId === 'team-ruangdiri') {
        const userMessage = {
          id: Date.now().toString(),
          text: content,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: new Date().toISOString(),
          isUser: true,
          sender: {
            id: 'current-user',
            name: 'You',
            role: 'user'
          },
          messageType: 'text'
        };

        return userMessage;
      }

      const response = await apiClient.post('/chat/messages', {
        sessionId,
        message: content,
        messageType: 'text'
      });
      
      if (response.data?.status === 'success') {
        const msg = response.data.data;
        return {
          id: msg.id,
          text: msg.message,
          time: extractTimeFromISO(msg.createdAt),
          timestamp: msg.createdAt,
          isUser: msg.sender?.role !== 'psychologist',
          sender: {
            id: msg.sender?.id || msg.senderId,
            name: msg.sender?.fullName || 'You',
            role: msg.sender?.role || 'user'
          },
          messageType: msg.messageType
        };
      }
      
      throw new Error(response.data?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Generate AI response based on user input
  generateAIResponse(userInput) {
    const input = userInput.toLowerCase();
    
    // AI response patterns for Tim RuangDiri
    if (input.includes('halo') || input.includes('hai') || input.includes('hello') || input.includes('hi')) {
      return "Halo! Selamat datang di RuangDiri. Saya Tim RuangDiri AI Assistant, siap membantu Anda hari ini. Apa yang bisa saya bantu? 😊";
    }
    
    if (input.includes('konseling') || input.includes('booking') || input.includes('sesi')) {
      return "Untuk booking sesi konseling, saya bisa membantu mengarahkan Anda ke sistem booking kami. Anda bisa memilih antara sesi online (video call/chat) atau offline (tatap muka). Apakah Anda ingin saya buatkan link booking untuk Anda?";
    }
    
    if (input.includes('stress') || input.includes('cemas') || input.includes('anxiety') || input.includes('depresi') || input.includes('sedih')) {
      return "Saya memahami Anda sedang mengalami kondisi yang tidak mudah. Perasaan seperti itu adalah hal yang wajar dan banyak orang mengalaminya. RuangDiri memiliki konselor profesional yang siap membantu. Apakah Anda ingin saya hubungkan dengan konselor atau memberikan tips coping yang bisa dilakukan sekarang?";
    }
    
    if (input.includes('help') || input.includes('bantuan') || input.includes('tolong')) {
      return "Tentu! Saya di sini untuk membantu. Silakan ceritakan apa yang sedang Anda alami atau pilih opsi bantuan yang tersedia di atas. Saya bisa membantu dengan informasi layanan, booking konseling, atau menjawab pertanyaan umum.";
    }
    
    if (input.includes('faq') || input.includes('pertanyaan') || input.includes('tanya')) {
      return {
        text: "Berikut adalah pertanyaan yang sering ditanyakan oleh pengguna RuangDiri:",
        messageType: 'faq_response'
      };
    }
    
    if (input.includes('biaya') || input.includes('harga') || input.includes('tarif')) {
      return "Untuk informasi biaya layanan konseling:\n\n• Konseling individual: Mulai dari Rp 150.000/sesi\n• Konseling online: Mulai dari Rp 100.000/sesi\n• Konseling chat: Mulai dari Rp 75.000/sesi\n\nBiaya dapat berbeda tergantung psikolog dan durasi sesi. Untuk info lengkap, silakan hubungi tim support kami.";
    }
    
    if (input.includes('pembayaran') || input.includes('bayar') || input.includes('transfer')) {
      return "Metode pembayaran yang tersedia:\n\n• Transfer Bank (BNI, BCA, Mandiri)\n• E-wallet (GoPay, OVO, DANA)\n• QRIS\n• Kartu Kredit/Debit\n\nPembayaran dilakukan setelah konfirmasi booking dan sebelum sesi dimulai.";
    }
    
    if (input.includes('jadwal') || input.includes('waktu') || input.includes('jam')) {
      return "Jadwal layanan RuangDiri:\n\n• Senin - Jumat: 08.00 - 21.00 WIB\n• Sabtu - Minggu: 09.00 - 18.00 WIB\n\nUntuk konseling chat 24/7 dengan tim support. Apakah Anda ingin booking jadwal konseling?";
    }
    
    if (input.includes('psikolog') || input.includes('konselor') || input.includes('therapist')) {
      return "Tim psikolog RuangDiri terdiri dari profesional berlisensi dengan berbagai spesialisasi:\n\n• Psikolog klinis\n• Psikolog pendidikan\n• Konselor pernikahan\n• Psikolog anak dan remaja\n\nSemua psikolog kami telah tersertifikasi dan berpengalaman. Apakah Anda ingin melihat profil psikolog yang tersedia?";
    }
    
    // Default friendly AI response
    return "Terima kasih sudah bercerita dengan Tim RuangDiri! Sebagai AI assistant, saya siap mendengarkan dan membantu mengarahkan Anda ke solusi yang tepat. Jika Anda membutuhkan bantuan lebih lanjut atau ingin berbicara dengan konselor profesional, saya bisa membantu mengatur sesi konseling. Apa lagi yang bisa saya bantu? 😊";
  },

  // Handle AI service selection with detailed responses
  async handleAIServiceSelection(option) {
    const responses = {
      'Ruang Cerita': {
        message: "🌟 Ruang Cerita adalah fitur komunitas untuk berbagi pengalaman dan saling mendukung.\n\nSaat ini fitur ini sedang dalam pengembangan final. Fitur yang akan tersedia:\n\n• Sharing story anonim\n• Support group virtual\n• Peer counseling\n• Community challenges\n\nApakah Anda ingin saya hubungkan dengan konselor untuk sesi individu sementara waktu?",
        actions: ['Book Konseling Individual', 'Info Lebih Lanjut', 'Kembali ke Menu']
      },
      'Booking Sesi Konseling': {
        message: "📅 Saya akan membantu Anda booking sesi konseling!\n\nPilihan sesi yang tersedia:\n\n• 💻 Online Video Call - Tatap muka virtual dengan psikolog\n• 💬 Online Chat - Konseling melalui chat real-time\n• 🏢 Offline - Tatap muka langsung di klinik\n\nMana yang Anda preferensikan?",
        actions: ['Online - Video Call', 'Online - Chat', 'Offline - Tatap Muka', 'Tanya Dulu']
      },
      'FAQ (Frequently Asked Questions)': {
        message: "❓ Berikut adalah informasi yang sering ditanyakan pengguna RuangDiri.",
        messageType: 'faq_response',
        actions: ['Tanya Langsung', 'Hubungi Support', 'Kembali ke Menu']
      }
    };

    return responses[option] || {
      message: "Terima kasih sudah memilih layanan kami. Tim RuangDiri akan membantu Anda sebaik mungkin. Ada yang bisa saya bantu lagi?",
      actions: ['Kembali ke Menu', 'Hubungi Support']
    };
  },

  // Get Ably token for real-time messaging
  async getAblyToken(sessionId) {
    if (sessionId === 'team-ruangdiri') return null; // AI session doesn't need real-time

    try {
      const response = await apiClient.get('/chat/ably-token', {
        params: { sessionId }
      });
      
      if (response.data?.status === 'success') {
        return {
          token: response.data.data.token,
          channels: response.data.data.channels
        };
      }
      
      throw new Error(response.data?.message || 'Failed to get Ably token');
    } catch (error) {
      console.error('Error getting Ably token:', error);
      throw error;
    }
  },

  // Send typing indicator
  async sendTypingIndicator(sessionId, isTyping) {
    if (sessionId === 'team-ruangdiri') return; // AI doesn't need typing indicators

    try {
      await apiClient.post('/chat/typing', {
        sessionId,
        isTyping
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  },

  // Mark messages as read
  async markAsRead(sessionId) {
    if (sessionId === 'team-ruangdiri') return; // AI messages don't need read status

    try {
      await apiClient.put(`/chat/sessions/${sessionId}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  // Book counseling with chat method
  async bookCounselingWithChat(booking) {
    try {
      const response = await apiClient.post('/counselings/book', {
        ...booking,
        method: 'chat'
      });
      
      if (response.data?.status === 'success') {
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to book counseling');
    } catch (error) {
      console.error('Error booking counseling with chat:', error);
      throw error;
    }
  },

  // Get user's counseling sessions
  async getUserCounselingSessions() {
    try {
      const response = await apiClient.get('/counselings/user-sessions');
      
      if (response.data?.status === 'success') {
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to fetch counseling sessions');
    } catch (error) {
      console.error('Error fetching counseling sessions:', error);
      throw error;
    }
  }
};