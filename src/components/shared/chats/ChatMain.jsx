// src/components/shared/chats/ChatMain.jsx - FIXED: Integration with currentUserId

import React, { useEffect, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';

const ChatMain = ({
  selectedConversation,
  messages = [],
  messageText,
  onMessageChange,
  onSendMessage,
  onAIServiceSelection,
  canSendMessage,
  canSendMessageWithText,
  isSending = false,
  connectionStatus = 'disconnected',
  getSessionStatus,
  onBookingClick,
  onToggleSidebar,
  onEndSession,
  userType,
  isPsychologist = false,
  isEndingSession = false,
  onFileUpload,
  typingStatus,
  currentUserId, // FIXED: Receive currentUserId prop
  // FIXED: Infinite scroll props
  onLoadMoreMessages,
  hasMoreMessages,
  isLoadingMoreMessages,
}) => {
  const messagesEndRef = useRef(null);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const canSendWithText = typeof canSendMessageWithText === 'function' ? canSendMessageWithText() : canSendMessageWithText;
      if (canSendWithText) {
        onSendMessage();
      }
    }
  }, [canSendMessageWithText, onSendMessage]);

  // FIXED: Remove auto-scroll effect - let ChatMessages handle it

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-100 w-full overflow-hidden">
        <div className="text-center max-w-md p-4 sm:p-8 mx-4">
          <div className="text-4xl sm:text-6xl mb-4">💬</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
            {isPsychologist ? 'Selamat datang, Dokter' : 'Selamat datang di RuangDiri Chat'}
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {isPsychologist 
              ? 'Pilih klien dari sidebar untuk memulai sesi konseling.'
              : 'Pilih percakapan dari sidebar untuk memulai chat dengan konselor atau tim kami.'
            }
          </p>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-green-500">🔒</span>
              <span className="font-medium text-gray-800 text-sm sm:text-base">End-to-end encrypted</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
              Pesan Anda dilindungi dengan enkripsi end-to-end.
            </p>
            
            {onBookingClick && !isPsychologist && (
              <button 
                onClick={onBookingClick}
                className="w-full text-white py-2 px-4 rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base"
                style={{ backgroundColor: '#488BBA' }}
              >
                Booking Sesi Chat
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAIChat = selectedConversation?.isTeamChat || (getSessionStatus && getSessionStatus() === 'ai_chat');

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* Header with typing status */}
      <ChatHeader 
        selectedConversation={selectedConversation}
        onToggleSidebar={onToggleSidebar}
        connectionStatus={connectionStatus}
        isPsychologist={isPsychologist}
        onEndSession={onEndSession}
        isEndingSession={isEndingSession}
        typingStatus={typingStatus}
      />

      {/* FIXED: Messages Area with infinite scroll and currentUserId */}
      <ChatMessages 
        messages={messages}
        selectedConversation={selectedConversation}
        getSessionStatus={getSessionStatus}
        onAIServiceSelection={onAIServiceSelection}
        messagesEndRef={messagesEndRef}
        onLoadMore={onLoadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        isLoadingMore={isLoadingMoreMessages}
        currentUserId={currentUserId} // FIXED: Pass currentUserId for message status
      />

      {/* Enhanced Input Area with WhatsApp-like file upload */}
      <ChatInput 
        messageText={messageText}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        canSendMessage={canSendMessage}
        canSendMessageWithText={canSendMessageWithText}
        isSending={isSending}
        isAIChat={isAIChat}
        onKeyPress={handleKeyPress}
        onFileUpload={onFileUpload}
        selectedConversation={selectedConversation}
      />
    </div>
  );
};

export default ChatMain;