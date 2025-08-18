// src/pages/user/shared/ChatPage.jsx - Work with Existing UserLayout

import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/components/shared/chats/hooks/useChats';
import { chatsApi } from '@/components/shared/chats/lib/chatsApi';
import ChatSidebar from '@/components/shared/chats/ChatSidebar';
import ChatMain from '@/components/shared/chats/ChatMain';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.role || 'student';
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Main chat hook
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
    isAISession,
    isTyping,
    sessionsError,
    messagesError,
    sendError,
    selectSession,
    sendCurrentMessage,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
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

  // Handle conversation selection dengan mark as read
  const handleConversationSelect = useCallback(async (conversation) => {
    console.log('📄 Selecting conversation:', conversation.name, 'hasUnread:', conversation.hasUnread);
    
    // Mark as read SEBELUM select (kecuali AI)
    if (!conversation.isTeamChat && conversation.hasUnread) {
      try {
        console.log('📖 Marking as read for session:', conversation.sessionId);
        await chatsApi.markAsRead(conversation.sessionId);
        
        // Refresh sessions untuk update unread count
        await refetchSessions();
        
        console.log('✅ Marked as read successfully');
      } catch (error) {
        console.error('❌ Failed to mark as read:', error);
      }
    }
    
    // Select session
    selectSession(conversation);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarVisible(false);
    }
  }, [selectSession, refetchSessions]);

  // Handle end session untuk psychologist
  const handleEndSession = useCallback(async (sessionId) => {
    if (!isPsychologist || !sessionId || sessionId === 'team-ruangdiri') {
      console.warn('❌ End session not allowed');
      return;
    }
    
    if (isEndingSession) {
      console.warn('⏳ Already ending session');
      return;
    }
    
    // Confirmation dialog
    const confirmEnd = window.confirm(
      '⚠️ Apakah Anda yakin ingin mengakhiri sesi ini?\n\n' +
      'Sesi yang telah diakhiri tidak dapat dikembalikan.\n' + 
      'Klien tidak akan bisa mengirim pesan lagi.'
    );
    
    if (!confirmEnd) return;
    
    try {
      setIsEndingSession(true);
      console.log('🔚 Ending session:', sessionId);
      
      await chatsApi.endSession(sessionId);
      
      console.log('✅ Session ended successfully');
      
      // Refresh sessions list
      await refetchSessions();
      
      // Success message
      alert('✅ Sesi berhasil diakhiri');
      
      // Auto-select team session if current session was ended
      if (selectedSession?.sessionId === sessionId) {
        const teamSession = sessions.find(s => s.isTeamChat);
        if (teamSession) {
          selectSession(teamSession);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      alert('❌ Gagal mengakhiri sesi. Silakan coba lagi.');
    } finally {
      setIsEndingSession(false);
    }
  }, [isPsychologist, isEndingSession, selectedSession, sessions, selectSession, refetchSessions]);

  // Toggle sidebar mobile
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(!sidebarVisible);
  }, [sidebarVisible]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loading state
  if (isLoadingSessions) {
    return (
      <div className="w-full h-full pt-[90px] bg-white flex">
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#488BBE]"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">Loading Chats</h3>
              <p className="text-sm text-gray-600">
                {isPsychologist ? 'Loading client sessions...' : 'Loading your conversations...'}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-100">
          <div className="text-gray-500">Please wait...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionsError && isEmpty) {
    return (
      <div className="w-full h-full pt-[90px] bg-white flex">
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-red-500 text-3xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connection Error</h3>
            <p className="text-sm text-gray-600 mb-4">Failed to load chat sessions</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#488BBE] text-white text-sm rounded-lg hover:bg-[#3a7399] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-100">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-6">💬</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isPsychologist ? 'No Client Sessions' : 'No Chat Sessions'}
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {isPsychologist 
                ? 'No active chat sessions with clients at the moment. You will be notified when clients start new counseling sessions.'
                : 'To start chatting with counselors, please book a counseling session first with "Chat" method.'
              }
            </p>
            {!isPsychologist && (
              <button 
                onClick={handleBookingClick}
                className="bg-[#488BBE] text-white px-6 py-3 rounded-lg hover:bg-[#3a7399] transition-colors font-medium"
              >
                Book Counseling Session
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate responsive sidebar width based on available space
  const calculateSidebarWidth = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth < 768) return Math.min(320, screenWidth * 0.85); // Mobile
    if (screenWidth < 1024) return 320; // Tablet
    return 384; // Desktop
  };

  const sidebarWidth = calculateSidebarWidth();

  return (
    <>
      {/* Main Chat Container - Padding top untuk TopRightControl, full height sampai bawah */}
      <div className="w-full h-full pt-[90px] bg-white flex relative overflow-hidden">
        {/* Chat Sidebar */}
        <div 
          id="chat-sidebar"
          className={`
            ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 transition-transform duration-300 ease-in-out
            fixed md:relative z-50 md:z-auto
            h-full flex-shrink-0 overflow-hidden
          `}
          style={{ width: `${sidebarWidth}px` }}
        >
          <ChatSidebar
            conversations={sessions}
            selectedConversation={selectedSession}
            onConversationSelect={handleConversationSelect}
            loading={isLoadingSessions}
            userDisplayData={userDisplayData}
            isPsychologist={isPsychologist}
            containerWidth={sidebarWidth}
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarVisible(false)}
          />
        )}

        {/* Chat Main Area - Take remaining space */}
        <div className="flex-1 overflow-hidden min-w-0">
          <ChatMain
            selectedConversation={selectedSession}
            messages={messages}
            messageText={messageText}
            onMessageChange={handleTyping}
            onSendMessage={sendCurrentMessage}
            onAIServiceSelection={handleAIService}
            onToggleSidebar={toggleSidebar}
            onEndSession={handleEndSession}
            canSendMessage={canSendMessage()}
            isSending={isSendingMessage}
            isTyping={isTyping}
            connectionStatus={connectionStatus}
            getSessionStatus={getSessionStatus}
            onBookingClick={handleBookingClick}
            userType={userType}
            isPsychologist={isPsychologist}
            isEndingSession={isEndingSession}
          />
        </div>
      </div>

      {/* Error Toast */}
      {(messagesError || sendError) && (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">error</span>
                <div>
                  <p className="font-semibold text-sm">Connection Error</p>
                  <p className="text-xs">
                    {messagesError?.message || sendError?.message || 'Something went wrong'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-red-700 hover:text-red-900 ml-4"
                title="Reload page"
              >
                <span className="material-icons text-sm">refresh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Status Notifications - Adjust untuk TopRightControl space */}
      {selectedSession && !selectedSession.isTeamChat && getSessionStatus() === 'chat_disabled' && (
        <div className="fixed top-[100px] left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 max-w-md mx-auto">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <span className="material-icons text-sm">schedule</span>
              <span className="text-sm font-medium">
                Chat akan aktif ketika sesi dimulai
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedSession && !selectedSession.isTeamChat && getSessionStatus() === 'session_ended' && (
        <div className="fixed top-[100px] left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 max-w-md mx-auto">
          <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <span className="material-icons text-sm">check_circle</span>
              <span className="text-sm font-medium">
                Sesi chat telah berakhir
              </span>
            </div>
          </div>
        </div>
      )}

      {/* End Session Loading Overlay */}
      {isEndingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-500"></div>
              <div className="text-center">
                <h3 className="font-bold text-gray-800 text-lg">Ending Session</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Please wait while we end the session...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        /* Custom scrollbar */
        :global(.overflow-y-auto::-webkit-scrollbar) {
          width: 6px;
        }
        
        :global(.overflow-y-auto::-webkit-scrollbar-track) {
          background: #f1f1f1;
        }
        
        :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
          background: #a8a8a8;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          :global(.material-icons) {
            font-size: 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatPage;