// src/pages/user/shared/ChatPage.jsx - FIXED: Complete Integration with Infinite Scroll

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

  // FIXED: Main chat hook with all infinite scroll props
  const {
    sessions,
    selectedSession,
    messages,
    messageText,
    isLoadingSessions,
    isLoadingMessages,
    isSendingMessage,
    isUploadingFile,
    connectionStatus,
    isConnected,
    isAISession,
    isTyping,
    sessionsError,
    messagesError,
    sendError,
    selectSession,
    sendCurrentMessage,
    sendFile,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    canSendMessageWithText,
    canSendFile,
    getSessionStatus,
    refetchSessions,
    userDisplayData,
    hasMessages,
    isEmpty,
    isPsychologist,
    typingStatus,
    currentUserId, // FIXED: Get currentUserId
    // FIXED: Infinite scroll props
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMoreMessages,
    typingUsers
  ,
    recipientPresence // ADDED: presence of the other user in the current session
  } = useChats();

  // Handle AI service selection
  const handleAIService = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      await handleAIServiceSelection(option);
    }
  }, [selectedSession?.isTeamChat, handleAIServiceSelection]);

  // Handle conversation selection dengan mark as read logic
  const handleConversationSelect = useCallback(async (conversation) => {
    console.log('🔄 Selecting conversation:', conversation.name, 'hasUnread:', conversation.hasUnread);
    
    await selectSession(conversation, true); // shouldMarkAsRead = true
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarVisible(false);
    }
  }, [selectSession]);

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
          await selectSession(teamSession, false); // Don't mark as read for auto-select
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

  // Update chat presence via API when tab/window visibility changes (throttled + 10s away delay)
  useEffect(() => {
    let lastPresenceAt = 0;
    let lastStatus = 'away';
    let awayTimer = null;

    const updatePresenceThrottled = async (status) => {
      if (!selectedSession || selectedSession.isTeamChat) return;
      const normalized = status === 'present' ? 'present' : 'away';
      const now = Date.now();
      if (normalized === lastStatus && (now - lastPresenceAt) < 15000) return;
      lastStatus = normalized;
      lastPresenceAt = now;
      try {
        await chatsApi.updatePresence(selectedSession.sessionId, normalized);
      } catch (e) {
        console.warn('Presence update failed:', e?.message || e);
      }
    };

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        if (awayTimer) { clearTimeout(awayTimer); awayTimer = null; }
        updatePresenceThrottled('present');
      } else {
        if (awayTimer) { clearTimeout(awayTimer); }
        awayTimer = setTimeout(() => {
          updatePresenceThrottled('away');
          awayTimer = null;
        }, 10000); // 10s grace before away
      }
    };

    const handleFocus = () => { if (awayTimer) { clearTimeout(awayTimer); awayTimer = null; } updatePresenceThrottled('present'); };
    const handleBlur = () => { if (awayTimer) { clearTimeout(awayTimer); } awayTimer = setTimeout(() => { updatePresenceThrottled('away'); awayTimer = null; }, 10000); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial sync on mount or when session changes
    handleVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (awayTimer) { clearTimeout(awayTimer); awayTimer = null; }
    };
  }, [selectedSession?.sessionId, selectedSession?.isTeamChat]);

  // Auto mark as read ketika user focus ke window dan ada selected session
  useEffect(() => {
    const handleWindowFocus = async () => {
      if (selectedSession && !selectedSession.isTeamChat && selectedSession.hasUnread) {
        try {
          console.log('👁️ Window focused, marking session as read...');
          const list = messages || [];
          const userId = currentUserId;
          const opponentMsgs = list.filter(m => m.senderId && m.senderId !== userId);
          const lastMsg = (opponentMsgs.length > 0 ? opponentMsgs[opponentMsgs.length - 1] : list[list.length - 1]) || null;
          const messageId = lastMsg?.id;
          if (messageId) {
            await chatsApi.markAsRead(selectedSession.sessionId, messageId);
          }
        } catch (error) {
          console.error('❌ Failed to mark as read on window focus:', error);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [selectedSession, refetchSessions]);

  // Loading state
  if (isLoadingSessions) {
    return (
      <div className="w-full h-full pt-[90px] bg-white flex">
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: '#488BBA' }}
            ></div>
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
              className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#488BBA' }}
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
                className="text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors font-medium"
                style={{ backgroundColor: '#488BBA' }}
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
      {/* Main Chat Container - Full height dengan independent scroll areas */}
      <div className="w-full h-full pt-[90px] bg-white flex relative">
        {/* Chat Sidebar - Independent scroll container */}
        <div 
          id="chat-sidebar"
          className={`
            ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 transition-transform duration-300 ease-in-out
            fixed md:relative z-50 md:z-auto
            h-full flex-shrink-0
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
            currentUserId={currentUserId} // FIXED: Pass currentUserId to sidebar
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarVisible(false)}
          />
        )}

        {/* Chat Main Area - Independent scroll container */}
        <div className="flex-1 h-full">
      <ChatMain 
        selectedConversation={selectedSession}
        messages={messages}
        messageText={messageText}
        onMessageChange={handleTyping}
        onSendMessage={sendCurrentMessage}
        onAIServiceSelection={handleAIService}
        onToggleSidebar={toggleSidebar}
        onEndSession={handleEndSession}
        canSendMessage={canSendMessage}
        canSendMessageWithText={canSendMessageWithText}
        isSending={isSendingMessage}
        connectionStatus={connectionStatus}
        getSessionStatus={getSessionStatus}
        onBookingClick={handleBookingClick}
        userType={userType}
        isPsychologist={isPsychologist}
        isEndingSession={isEndingSession}
        onFileUpload={sendFile}
        typingStatus={typingStatus}
        currentUserId={currentUserId} // FIXED: Pass currentUserId
        recipientPresence={recipientPresence}
        // FIXED: Pass infinite scroll props
        onLoadMoreMessages={loadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        isLoadingMoreMessages={isLoadingMoreMessages}
        typingUsers={typingUsers}
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

      {/* Custom Styles untuk independent scroll */}
      <style jsx>{`
        /* Ensure completely independent scroll areas */
        #chat-sidebar {
          contain: layout style;
        }
        
        .flex-1.h-full {
          contain: layout style;
        }
        
        /* Prevent any scroll interference */
        body {
          overflow: hidden;
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
