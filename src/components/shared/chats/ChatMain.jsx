// src/components/shared/chats/ChatMain.jsx - Responsive Design

import React, { useEffect, useRef, useState } from 'react';

// Upload dropdown component - ORIGINAL
const UploadDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50"
    >
      <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
        <span className="material-icons text-gray-600 text-sm">image</span>
        Upload Image
      </button>
      <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
        <span className="material-icons text-gray-600 text-sm">attach_file</span>
        Upload File
      </button>
      <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
        <span className="material-icons text-gray-600 text-sm">videocam</span>
        Upload Video
      </button>
    </div>
  );
};

// Individual message bubble - Responsive
const MessageBubble = ({ message, isOwn = false, sender, time, showOptions, onOptionClick, actions }) => {
  return (
    <div className="w-full px-4 sm:px-5">
      <div className={`flex flex-col gap-2.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex gap-2 items-start w-full ${isOwn ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
          {!isOwn && (
            <div className="w-[27px] h-[54px] flex items-center flex-shrink-0">
              <div className="w-[27px] h-[27px] rounded-full overflow-hidden">
                {sender?.role === 'ai_assistant' ? (
                  <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#1E5A89] flex-shrink-0"></div>
                )}
              </div>
          </div>
          )}
          <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[454px] min-w-0`}>
            <p className={`text-xs font-light text-zinc-500 ${isOwn ? 'text-right' : ''}`}>
              {isOwn ? 'You' : (sender?.name || 'Unknown')}
            </p>
            <div className={`
              flex flex-col items-start px-4 py-3 min-h-[47px] w-full
              ${isOwn
                ? 'bg-sky-100 rounded-xl'
                : 'bg-white rounded-3xl'
              }
            `}>
              <p className="text-sm leading-5 text-neutral-600 whitespace-pre-wrap break-words w-full">
                {message}
              </p>

              {/* AI Service Options */}
              {showOptions && !isOwn && (
                <div className="mt-3 w-full border-t border-gray-200 pt-3">
                  <div className="space-y-1">
                    {[
                      { icon: 'accessibility', text: 'Ruang Cerita' },
                      { icon: 'calendar_today', text: 'Booking Sesi Konseling' },
                      { icon: 'help', text: 'FAQ (Frequently Asked Questions)' }
                    ].map((option, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center gap-2 p-2 text-left text-blue-500 hover:bg-blue-50 rounded border-b border-gray-200 last:border-b-0 transition-colors"
                        onClick={() => onOptionClick && onOptionClick(option.text)}
                      >
                        <span className="material-icons text-sm">{option.icon}</span>
                        <span className="text-xs">{option.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Action Buttons */}
              {actions && actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
                      onClick={() => onOptionClick && onOptionClick(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <time className="text-xs font-light text-zinc-500">
              {time}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat header - Responsive
const ChatHeader = ({ selectedConversation, onToggleSidebar, connectionStatus, isPsychologist, onEndSession, isEndingSession }) => {
  return (
    <div className="flex-shrink-0 flex justify-between items-center px-4 sm:px-[30px] bg-white border-solid border-y-[0.25px] border-y-zinc-500 h-[70px]">
      <div className="flex gap-3 sm:gap-5 items-center min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
          aria-label="Open sidebar"
        >
          <span className="material-icons">menu</span>
        </button>
        
        <div className="w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full overflow-hidden flex-shrink-0">
          {selectedConversation?.isTeamChat ? (
            <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl">🤖</span>
            </div>
          ) : selectedConversation?.avatar ? (
            <img
              src={selectedConversation.avatar}
              alt={selectedConversation.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span class="text-white text-xl">👤</span>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl">👤</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-blue-500 truncate">
            {selectedConversation?.name || 'Unknown'}
          </h2>
          
          {/* Status */}
          {selectedConversation?.isTeamChat ? (
            <p className="text-xs font-light text-blue-600">
              🤖 AI Assistant - Always Available
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <p className={`text-xs font-light ${
                connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-500'
              }`}>
                {connectionStatus === 'connected' ? 'Online' : 'Offline'}
              </p>
              
              {isPsychologist && selectedConversation?.userRole && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs font-medium ${
                    selectedConversation.userRole === 'client' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {selectedConversation.userRole === 'client' ? 'Client' : 'Other'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-start items-center gap-1 sm:gap-[5px] flex-shrink-0">
        {/* END SESSION BUTTON - HANYA UNTUK PSYCHOLOGIST */}
        {isPsychologist && !selectedConversation?.isTeamChat && selectedConversation?.isActive && (
          <button 
            className="px-2 sm:px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-1 sm:mr-2" 
            title="End Session"
            onClick={() => onEndSession && onEndSession(selectedConversation.sessionId)}
            disabled={isEndingSession}
          >
            {isEndingSession ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span className="hidden sm:inline">Ending...</span>
              </div>
            ) : (
              <span className="hidden sm:inline">End Session</span>
            )}
            <span className="sm:hidden material-icons text-sm">stop</span>
          </button>
        )}

        {/* Psychologist Controls */}
        {isPsychologist && !selectedConversation?.isTeamChat && (
          <div className="flex items-center gap-1 sm:gap-2 mr-2 sm:mr-4">
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Session Notes"
            >
              <span className="material-icons text-gray-600 text-lg sm:text-xl">note_add</span>
            </button>
          </div>
        )}
        
        {/* Close button */}
        <button className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="#8B8B8B"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Chat messages area - Responsive
const ChatMessages = ({ 
  messages = [], 
  isTyping, 
  selectedConversation, 
  getSessionStatus, 
  onAIServiceSelection,
  messagesEndRef
}) => {
  const sessionStatus = getSessionStatus?.() || 'ready';
  const messagesContainerRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto bg-zinc-100"
      style={{ 
        scrollbarWidth: 'thin',
        scrollBehavior: 'smooth'
      }}
    >
      <div className="flex flex-col gap-2.5 items-center py-4 min-h-full">
        <time className="mb-4 text-xs font-light leading-5 text-center text-zinc-500">
          Hari ini
        </time>

        {/* Session Status Warning */}
        {sessionStatus !== 'ready' && sessionStatus !== 'ai_chat' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 max-w-md">
            <div className="flex items-center gap-2 text-center">
              <span className="text-yellow-600">⚠️</span>
              <div className="text-sm text-yellow-800">
                {sessionStatus === 'chat_disabled' && 'Chat akan aktif ketika sesi dimulai'}
                {sessionStatus === 'session_ended' && 'Sesi chat telah berakhir'}
                {sessionStatus === 'no_session' && 'Tidak ada sesi yang dipilih'}
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex flex-col gap-4 w-full max-w-full">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.text}
              isOwn={message.isUser}
              sender={message.sender}
              time={message.time}
              showOptions={message.showOptions}
              actions={message.actions}
              onOptionClick={onAIServiceSelection}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && !selectedConversation?.isTeamChat && (
            <div className="w-full px-4 sm:px-5">
              <div className="flex gap-2 items-start">
                <div className="w-[27px] h-[54px] flex items-center">
                  <div className="w-[27px] h-[27px] rounded-full bg-[#1E5A89] flex items-center justify-center">
                    <span className="text-white text-xs">👤</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-start">
                  <p className="text-xs font-light text-zinc-500">
                    {selectedConversation?.name || 'Unknown'}
                  </p>
                  <div className="bg-white rounded-3xl px-4 py-3 min-h-[47px] flex items-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-scroll anchor - hidden */}
          <div ref={messagesEndRef} style={{ height: '1px', visibility: 'hidden' }} />
        </div>
      </div>
    </div>
  );
};

// Chat input area - Responsive
const ChatInput = ({ 
  messageText, 
  onMessageChange, 
  onSendMessage, 
  canSendMessage, 
  isSending,
  isAIChat,
  onKeyPress 
}) => {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);

  return (
    <div className="flex-shrink-0 flex flex-col gap-2.5 bg-white border-solid border-y-[0.25px] border-y-zinc-500 min-h-[100px] sm:h-[127px] px-4 sm:px-[19px] py-4 sm:py-[19px]">
      <div className="flex flex-col justify-between flex-1">
        <textarea
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            isAIChat
              ? 'Type a message here....' 
              : !canSendMessage 
              ? 'Chat tidak tersedia...' 
              : 'Type a message here....'
          }
          className="text-sm sm:text-base leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none flex-1 w-full"
          rows="2"
          disabled={!canSendMessage && !isAIChat}
        />
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2 sm:gap-4 relative">
            <div className="relative">
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
                aria-label="Add attachment"
                disabled={!canSendMessage && !isAIChat}
                onClick={() => setShowUploadDropdown(!showUploadDropdown)}
              >
                <span className="material-icons text-zinc-500 text-lg sm:text-xl">add_circle_outline</span>
              </button>
              <UploadDropdown 
                isOpen={showUploadDropdown} 
                onClose={() => setShowUploadDropdown(false)} 
              />
            </div>
            <button 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
              aria-label="Add emoji"
              disabled={!canSendMessage && !isAIChat}
            >
              <span className="material-icons text-zinc-500 text-lg sm:text-xl">sentiment_satisfied_alt</span>
            </button>
          </div>
          
          <button 
            onClick={onSendMessage}
            disabled={(!canSendMessage && !isAIChat) || !messageText.trim() || isSending}
            className="p-2 disabled:opacity-50 hover:bg-blue-100 rounded-full transition-colors" 
            aria-label="Send message"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488BBE]"></div>
            ) : (
              <span className="material-icons text-[#488BBE] text-lg sm:text-xl">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main chat component - Responsive
const ChatMain = ({
  selectedConversation,
  messages = [],
  messageText,
  onMessageChange,
  onSendMessage,
  onAIServiceSelection,
  canSendMessage = false,
  isSending = false,
  isTyping = false,
  connectionStatus = 'disconnected',
  getSessionStatus,
  onBookingClick,
  onToggleSidebar,
  onEndSession,
  userType,
  isPsychologist = false,
  isEndingSession = false
}) => {
  const messagesEndRef = useRef(null);

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim() && (canSendMessage || selectedConversation?.isTeamChat)) {
        onSendMessage();
      }
    }
  };

  // Empty state when no conversation selected - Work with UserLayout space
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
                className="w-full bg-[#488BBA] text-white py-2 px-4 rounded-lg hover:bg-[#3a7399] transition-colors text-sm sm:text-base"
              >
                Booking Sesi Chat
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAIChat = selectedConversation.isTeamChat || getSessionStatus?.() === 'ai_chat';

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* Header */}
      <ChatHeader 
        selectedConversation={selectedConversation}
        onToggleSidebar={onToggleSidebar}
        connectionStatus={connectionStatus}
        isPsychologist={isPsychologist}
        onEndSession={onEndSession}
        isEndingSession={isEndingSession}
      />

      {/* Messages Area - Scrollable */}
      <ChatMessages 
        messages={messages}
        isTyping={isTyping}
        selectedConversation={selectedConversation}
        getSessionStatus={getSessionStatus}
        onAIServiceSelection={onAIServiceSelection}
        messagesEndRef={messagesEndRef}
      />

      {/* Input Area - Fixed */}
      <ChatInput 
        messageText={messageText}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        canSendMessage={canSendMessage}
        isSending={isSending}
        isAIChat={isAIChat}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};

export default ChatMain;