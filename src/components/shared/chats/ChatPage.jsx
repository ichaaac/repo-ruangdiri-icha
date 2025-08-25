// src/pages/user/shared/ChatPage.jsx - Fixed Layout Full Screen Responsive

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

  // Main chat hook - handles all chat logic
  // Main chat hook
  const {
    sessions,
    selectedSession,
    messages,
    messageText,
    isLoadingSessions,
    isLoadingMessages,
    isSendingMessage,
    isUploadingFile, // ✅ NEW: File upload state
    connectionStatus,
    isConnected,
    isAISession,
    isTyping,
    sessionsError,
    messagesError,
    sendError,
    selectSession,
    sendCurrentMessage,
    sendFile, // ✅ NEW: File upload function
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    canSendFile, // ✅ NEW: Check if can send file
    getSessionStatus,
    refetchSessions,
    userDisplayData,
    hasMessages,
    isEmpty,
    isPsychologist
  } = useChats();

  // Handle AI service selection
  const handleAIService = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      await handleAIServiceSelection(option);
    }
  }, [selectedSession?.isTeamChat, handleAIServiceSelection]);

  // Loading state for sessions
  if (isLoadingSessions) {
    return (
      <div className="w-full h-screen bg-white flex">
        <div className="w-96 py-6 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#488BBE]"></div>
            <span className="text-[#488BBE] text-lg">
              {isPsychologist ? 'Loading client sessions...' : 'Loading chat sessions...'}
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state for sessions
  if (sessionsError && isEmpty) {
    return (
      <div className="w-full h-screen bg-white flex">
        <div className="w-96 py-6 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-sm text-gray-600">Failed to load sessions</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isPsychologist ? 'Belum Ada Client Session' : 'Belum Ada Chat Session'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isPsychologist 
                ? 'Saat ini tidak ada sesi chat aktif dengan klien. Anda akan mendapat notifikasi ketika ada klien yang memulai sesi konseling.'
                : 'Untuk memulai chat konseling, silakan booking sesi konseling terlebih dahulu dengan metode "Chat".'
              }
            </p>
            {!isPsychologist && (
              <button 
                onClick={handleBookingClick}
                className="bg-[#488BBE] text-white px-6 py-3 rounded-lg hover:bg-[#3a7399] transition-colors font-medium"
              >
                Booking Sesi Konseling
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface - Full screen responsive like screening
  return (
    <div className="w-full h-screen bg-white flex relative">
      {/* Chat Sidebar - Fixed width */}
      <div className="w-96 flex-shrink-0">
        <ChatSidebar
          conversations={sessions}
          selectedConversation={selectedSession}
          onConversationSelect={selectSession}
          loading={isLoadingSessions}
          userDisplayData={userDisplayData}
          isPsychologist={isPsychologist}
        />
      </div>

      {/* Chat Main Area - Take remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatMain
          selectedConversation={selectedSession}
          messages={messages}
          messageText={messageText}
          onMessageChange={handleTyping}
          onSendMessage={sendCurrentMessage}
          onAIServiceSelection={handleAIService}
          canSendMessage={canSendMessage()}
          isSending={isSendingMessage}
          isTyping={isTyping}
          connectionStatus={connectionStatus}
          getSessionStatus={getSessionStatus}
          onBookingClick={handleBookingClick}
          userType={userType}
          isPsychologist={isPsychologist}
        />
      </div>

      {/* Connection Status Indicator - Fixed position */}
      {selectedSession && !selectedSession.isTeamChat && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-800'
              : connectionStatus === 'ai'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'disconnected' && '🔴 Disconnected'}
            {connectionStatus === 'failed' && '❌ Connection Failed'}
            {connectionStatus === 'ai' && '🤖 AI Assistant'}
          </div>
        </div>
      )}

      {/* AI Assistant Indicator */}
      {selectedSession?.isTeamChat && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🤖 AI Assistant Active
          </div>
        </div>
      )}

      {/* Error Messages - Fixed position */}
      {(messagesError || sendError) && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="text-sm">
                  {messagesError?.message || sendError?.message || 'Something went wrong'}
                </span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-red-700 hover:text-red-900 ml-4 font-bold"
                title="Reload page"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Psychologist Session Controls */}
      {isPsychologist && selectedSession && !selectedSession.isTeamChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex gap-2">
            {/* End Session Button (if session is active) */}
            {selectedSession.isActive && (
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-lg"
                title="End Session"
                onClick={() => {
                  console.log('End session for:', selectedSession.name);
                }}
              >
                End Session
              </button>
            )}
            
            {/* Notes Button */}
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-lg"
              title="Session Notes"
              onClick={() => {
                console.log('Open notes for:', selectedSession.name);
              }}
            >
              📝 Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;