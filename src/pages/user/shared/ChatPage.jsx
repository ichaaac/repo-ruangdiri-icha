// src/components/shared/chats/ChatPages.jsx - Complete Chat Pages for All User Roles

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import useChats from "@/components/shared/chats/hooks/useChats";
import { useParams, useNavigate } from "react-router-dom";

const LoadingState = () => (
  <div className="flex justify-center items-center h-full">
    <div className="flex flex-col items-center gap-4">
      <span className="material-icons animate-spin text-[#488BBE] text-4xl">sync</span>
      <span className="text-[#488BBE] text-lg">Menghubungkan chat...</span>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex justify-center items-center h-full">
    <div className="text-center max-w-md">
      <span className="material-icons text-red-500 text-6xl mb-4 block">error_outline</span>
      <h3 className="text-red-500 font-semibold text-lg mb-2">Gagal memuat chat</h3>
      <p className="text-gray-600 mb-4 text-sm">
        {error || "Terjadi kesalahan saat menghubungkan ke chat."}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-[#488BBE] text-white rounded-lg hover:bg-[#3399E9] transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  </div>
);

const EmptyState = ({ userRole, onStartChat }) => (
  <div className="flex justify-center items-center h-full">
    <div className="text-center max-w-md">
      <span className="material-icons text-gray-400 text-6xl mb-4 block">chat_bubble_outline</span>
      <h3 className="text-gray-600 font-semibold text-lg mb-2">Belum ada percakapan</h3>
      <p className="text-gray-500 mb-6">
        {userRole === "psychologist" 
          ? "Tunggu klien memulai sesi konseling dengan Anda."
          : "Mulai percakapan dengan psikolog untuk mendapatkan bantuan."
        }
      </p>
      {userRole !== "psychologist" && (
        <button
          onClick={onStartChat}
          className="px-6 py-3 bg-[#488BBE] text-white rounded-lg hover:bg-[#3399E9] transition-colors"
        >
          Mulai Chat
        </button>
      )}
    </div>
  </div>
);

const ChatHeader = ({ session, userRole, onEndSession, onToggleInfo, isConnected }) => {
  const getParticipantName = () => {
    if (!session) return "Chat";
    
    if (userRole === "psychologist") {
      return session.client?.fullName || "Klien";
    } else {
      return session.psychologist?.fullName || "Psikolog";
    }
  };

  const getStatusText = () => {
    if (!session) return "Offline";
    
    if (session.status === "pending") return "Menunggu respon...";
    if (session.status === "active") return isConnected ? "Online" : "Connecting...";
    if (session.status === "completed") return "Sesi selesai";
    return "Offline";
  };

  const getStatusColor = () => {
    if (!session || session.status === "completed") return "text-gray-500";
    if (session.status === "pending") return "text-yellow-600";
    if (session.status === "active") return isConnected ? "text-green-600" : "text-yellow-600";
    return "text-gray-500";
  };

  return (
    <div className="h-16 px-5 py-3 bg-white border-b border-gray-200 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#488BBE] flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {getParticipantName().charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{getParticipantName()}</h3>
          <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleInfo}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Info"
        >
          <span className="material-icons text-gray-600">info</span>
        </button>
        
        {session && session.status !== "completed" && (
          <button
            onClick={onEndSession}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Akhiri Chat
          </button>
        )}
      </div>
    </div>
  );
};

const MessageItem = ({ 
  message, 
  isOwn, 
  showAvatar = true, 
  formatMessageTime,
  participantName 
}) => {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {showAvatar && !isOwn && (
        <div className="w-8 h-8 rounded-full bg-[#488BBE] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {participantName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-[#488BBE] text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        
        <div className={`text-xs text-gray-500 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatMessageTime(message.createdAt)}
          {message.isRead && isOwn && (
            <span className="ml-1 text-blue-500">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

const DateSeparator = ({ date }) => (
  <div className="flex items-center justify-center my-6">
    <div className="bg-gray-100 px-4 py-1 rounded-full">
      <span className="text-xs text-gray-600 font-medium">{date}</span>
    </div>
  </div>
);

const TypingIndicator = ({ typingUsers, participantName }) => {
  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3 mb-4"
    >
      <div className="w-8 h-8 rounded-full bg-[#488BBE] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">
          {participantName.charAt(0).toUpperCase()}
        </span>
      </div>
      
      <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </motion.div>
  );
};

const ChatInput = ({ 
  value, 
  onChange, 
  onSend, 
  onKeyPress, 
  disabled, 
  placeholder = "Ketik pesan..." 
}) => {
  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#488BBE] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="bg-[#488BBE] text-white p-2 rounded-full hover:bg-[#3399E9] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-icons text-xl">send</span>
        </button>
      </div>
    </div>
  );
};

const LoadMoreButton = ({ onLoadMore, isLoading, hasMore }) => {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center py-4">
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className="px-4 py-2 text-sm text-[#488BBE] hover:text-[#3399E9] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="material-icons animate-spin text-sm">sync</span>
            <span>Memuat pesan lama...</span>
          </div>
        ) : (
          "Muat pesan lama"
        )}
      </button>
    </div>
  );
};

/**
 * Main ChatPages Component
 */
const ChatPages = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize chat hook
  const {
    connectionState,
    isConnected,
    isConnecting,
    messages,
    groupedMessages,
    typingUsers,
    error,
    session,
    isLoading,
    hasMoreMessages,
    isFetchingMore,
    createSession,
    acceptSession,
    sendMessage,
    sendTypingIndicator,
    loadMoreMessages,
    endSession,
    clearError,
    formatTimeAgo,
    formatMessageTime,
    formatDate,
  } = useChats({
    sessionId,
    autoConnect: true,
    eventHandlers: {
      onSessionStatusChanged: (status) => {
        if (status === "completed") {
          // Session ended, optionally redirect or show message
          console.log("Session completed");
        }
      }
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle input change with typing indicators
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (isConnected && session?.sessionId) {
      sendTypingIndicator(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 1000);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    try {
      await sendMessage(inputMessage.trim());
      setInputMessage("");
      
      // Stop typing indicator
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    try {
      await endSession();
      navigate(-1); // Go back
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  // Handle start new chat
  const handleStartChat = () => {
    // Redirect to psychologist selection or create session
    // For demo purposes, create session with dummy psychologist ID
    createSession("550e8400-e29b-41d4-a716-446655440001");
  };

  // Handle accept session (psychologist only)
  const handleAcceptSession = async () => {
    if (session?.sessionId) {
      try {
        await acceptSession(session.sessionId);
      } catch (error) {
        console.error("Failed to accept session:", error);
      }
    }
  };

  // Get participant name for display
  const getParticipantName = () => {
    if (!session) return "Participant";
    
    if (user?.role === "psychologist") {
      return session.client?.fullName || "Klien";
    } else {
      return session.psychologist?.fullName || "Psikolog";
    }
  };

  // Render loading state
  if (isLoading && !session) {
    return (
      <div className="h-screen bg-white">
        <LoadingState />
      </div>
    );
  }

  // Render error state
  if (error && !session) {
    return (
      <div className="h-screen bg-white">
        <ErrorState error={error} onRetry={clearError} />
      </div>
    );
  }

  // Render empty state (no session)
  if (!session) {
    return (
      <div className="h-screen bg-white">
        <EmptyState userRole={user?.role} onStartChat={handleStartChat} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <ChatHeader
        session={session}
        userRole={user?.role}
        onEndSession={handleEndSession}
        onToggleInfo={() => setShowInfo(!showInfo)}
        isConnected={isConnected}
      />

      {/* Pending state for psychologist */}
      {user?.role === "psychologist" && session.status === "pending" && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons text-yellow-600">schedule</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">Permintaan konseling baru</p>
                <p className="text-xs text-yellow-600">Klien menunggu Anda menerima sesi konseling</p>
              </div>
            </div>
            <button
              onClick={handleAcceptSession}
              className="px-4 py-2 bg-[#488BBE] text-white rounded-lg hover:bg-[#3399E9] transition-colors text-sm"
            >
              Terima Sesi
            </button>
          </div>
        </div>
      )}

      {/* Connection status */}
      {!isConnected && session.status === "active" && (
        <div className="bg-red-50 border-b border-red-200 p-2">
          <div className="flex items-center justify-center gap-2">
            <span className="material-icons text-red-600 text-sm">wifi_off</span>
            <span className="text-sm text-red-600">
              {isConnecting ? "Menghubungkan..." : "Koneksi terputus"}
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Load more button */}
          <LoadMoreButton
            onLoadMore={loadMoreMessages}
            isLoading={isFetchingMore}
            hasMore={hasMoreMessages}
          />

          {/* Messages */}
          <div className="px-4 py-6">
            {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
              <div key={dateKey}>
                <DateSeparator date={formatDate(dayMessages[0].createdAt)} />
                
                {dayMessages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const prevMessage = dayMessages[index - 1];
                  const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);
                  
                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      formatMessageTime={formatMessageTime}
                      participantName={getParticipantName()}
                    />
                  );
                })}
              </div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <TypingIndicator
                  typingUsers={typingUsers}
                  participantName={getParticipantName()}
                />
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      {session.status === "active" && (
        <ChatInput
          value={inputMessage}
          onChange={handleInputChange}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          placeholder={
            !isConnected 
              ? "Koneksi terputus..." 
              : "Ketik pesan..."
          }
        />
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{error}</span>
              <button onClick={clearError} className="text-white hover:text-gray-200">
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-40"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Info Sesi</h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <span className="material-icons text-gray-600">close</span>
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status Sesi</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    session.status === "active" ? "bg-green-500" :
                    session.status === "pending" ? "bg-yellow-500" : "bg-gray-500"
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">{session.status}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Waktu Mulai</h4>
                <p className="text-sm text-gray-600">
                  {session.startedAt ? formatTimeAgo(session.startedAt) : "Belum dimulai"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Peserta</h4>
                <p className="text-sm text-gray-600">{getParticipantName()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPages;