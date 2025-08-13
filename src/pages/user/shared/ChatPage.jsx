// src/pages/user/shared/ChatPage.jsx - Clean Chat Page

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/components/shared/chats/hooks/useChats';
import ChatSidebar from '@/components/shared/chats/ChatSidebar';
import ChatMain from '@/components/shared/chats/ChatMain';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.role || 'student';

  // Use main chat hook
  const {
    sessions,
    selectedSession,
    messages,
    messageText,
    isLoadingSessions,
    isLoadingMessages,
    isSendingMessage,
    connectionStatus,
    isConnected,
    isTyping,
    sessionsError,
    messagesError,
    sendError,
    selectSession,
    sendCurrentMessage,
    handleTyping,
    canSendMessage,
    getSessionStatus,
    refetchSessions,
    hasMessages,
    isEmpty
  } = useChats();

  // Handle booking navigation
  const handleBookingClick = useCallback(() => {
    navigate(`/booking-session/${userType}`);
  }, [navigate, userType]);

  // Loading state
  if (isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-V1"></div>
          <span className="text-primary-V1 text-lg">Loading chat sessions...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionsError && isEmpty) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Belum Ada Chat Session
          </h2>
          <p className="text-gray-600 mb-6">
            Untuk memulai chat konseling, silakan booking sesi konseling terlebih dahulu dengan metode "Chat".
          </p>
          <button 
            onClick={handleBookingClick}
            className="bg-[#488BBA] text-white px-6 py-3 rounded-lg hover:bg-[#3a7399] transition-colors font-medium"
          >
            Booking Sesi Konseling
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white max-md:flex-col" style={{
      width: 'calc(100vw - 46px)',
      marginTop: '46px',
      marginRight: '46px'
    }}>
      {/* Chat Sidebar */}
      <ChatSidebar
        conversations={sessions}
        selectedConversation={selectedSession}
        onConversationSelect={selectSession}
        loading={isLoadingSessions}
        className="max-md:h-[40vh] max-sm:h-[35vh]"
      />

      {/* Chat Main Area */}
      <ChatMain
        selectedConversation={selectedSession}
        messages={messages}
        messageText={messageText}
        onMessageChange={handleTyping}
        onSendMessage={sendCurrentMessage}
        canSendMessage={canSendMessage()}
        isSending={isSendingMessage}
        isTyping={isTyping}
        connectionStatus={connectionStatus}
        getSessionStatus={getSessionStatus}
        onBookingClick={handleBookingClick}
        userType={userType}
        className="max-md:h-[60vh] max-sm:h-[65vh]"
      />

      {/* Connection Status Indicator */}
      {selectedSession && !selectedSession.isTeamChat && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'disconnected' && '🔴 Disconnected'}
            {connectionStatus === 'failed' && '❌ Connection Failed'}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(messagesError || sendError) && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="text-sm">
                  {messagesError?.message || sendError?.message || 'Something went wrong'}
                </span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-red-700 hover:text-red-900 ml-4"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;