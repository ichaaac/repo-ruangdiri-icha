// src/pages/user/psychologist/PsychologistChatPage.jsx - Integrated with Backend

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/components/shared/chats/hooks/useChats';
import ChatSidebar from '@/components/shared/chats/ChatSidebar';
import ChatMain from '@/components/shared/chats/ChatMain';

const PsychologistChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use the main chat hook for consistency
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

  // Filter sessions for psychologist view (only show real counseling sessions)
  const psychologistSessions = sessions.filter(session => !session.isTeamChat);

  // Loading state
  if (isLoadingSessions) {
    return (
      <div className="flex h-screen bg-white">
        <div className="w-96 py-6 bg-white border-r-[0.25px] border-t-[0.25px] border-text flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-V1"></div>
            <span className="text-primary-V1 text-lg">Loading client sessions...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-zinc-100">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // No active sessions state
  if (psychologistSessions.length === 0 && !isLoadingSessions) {
    return (
      <div className="flex h-screen bg-white">
        <div className="w-96 py-6 bg-white border-r-[0.25px] border-t-[0.25px] border-text">
          <div className="px-5">
            <h2 className="text-primary-V1 text-3xl font-bold font-['Public_Sans'] mb-4">
              Chat Klien
            </h2>
            <div className="text-center p-8">
              <div className="text-gray-400 text-4xl mb-4">💼</div>
              <p className="text-gray-600 text-sm">No active client sessions</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-zinc-100">
          <div className="text-center max-w-md p-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-purple-600 text-3xl">psychology</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Menunggu Klien
            </h2>
            <p className="text-gray-600 mb-6">
              Saat ini tidak ada sesi chat aktif dengan klien. Anda akan mendapat notifikasi ketika ada klien yang memulai sesi konseling.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Tips Menunggu Klien:</h3>
              <ul className="text-sm text-blue-700 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs">check_circle</span>
                  Pastikan status Anda online
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs">schedule</span>
                  Periksa jadwal konseling hari ini
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs">notifications_active</span>
                  Aktifkan notifikasi untuk sesi baru
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Custom sidebar for psychologist with client stats
  const PsychologistSidebar = () => (
    <div className="w-96 py-6 bg-white border-r-[0.25px] border-t-[0.25px] border-text inline-flex justify-center items-start gap-2.5">
      <div className="w-96 inline-flex flex-col justify-start items-center gap-4">
        {/* Header with Stats */}
        <div className="self-stretch px-5 flex flex-col justify-center items-start gap-3.5">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-[#488BBE] font-['Public_Sans']">
                Chat Klien
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-[#488BBE]">{psychologistSessions.length}</div>
                <div className="text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">
                  {psychologistSessions.filter(s => s.isChatEnabled).length}
                </div>
                <div className="text-gray-500">Chat Ready</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  {psychologistSessions.filter(s => s.status === 'active').length}
                </div>
                <div className="text-gray-500">In Session</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="self-stretch flex flex-col justify-start items-start">
          {psychologistSessions.map((session) => (
            <div
              key={session.sessionId}
              className={`self-stretch p-3 cursor-pointer transition-colors ${
                selectedSession?.sessionId === session.sessionId 
                  ? 'bg-sky-100 border-l-4 border-l-[#488BBE]' 
                  : 'hover:bg-gray-50'
              } flex flex-col justify-start items-start gap-2.5`}
              onClick={() => selectSession(session)}
            >
              <div className="self-stretch px-[5px] flex flex-col justify-start items-center gap-5">
                <div className="inline-flex justify-start items-center gap-2.5 w-full">
                  {/* Client Avatar */}
                  <div className="w-[38px] h-[37px] relative">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img
                        src={session.client?.profilePicture || "/empty-profile.svg"}
                        alt={session.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `
                            <div class="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                              <span class="text-gray-500 text-lg">👤</span>
                            </div>
                          `;
                        }}
                      />
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white">
                      <div className={`w-full h-full rounded-full ${
                        session.isChatEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="w-64 inline-flex flex-col justify-start items-start gap-1.5">
                    {/* Header */}
                    <div className="self-stretch inline-flex justify-between items-end">
                      <div className="flex flex-col">
                        <div className="justify-center text-TEXT-NEW text-base font-bold font-['Public_Sans'] truncate">
                          {session.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`${
                            session.client?.role === 'student' ? 'text-blue-600' : 'text-green-600'
                          } font-medium`}>
                            {session.client?.role === 'student' ? 'Student' : 'Employee'}
                          </span>
                          {session.scheduledAt && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">
                                {new Date(session.scheduledAt).toLocaleTimeString("id-ID", {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-center justify-center text-text text-xs font-light font-['Public_Sans'] ml-2 flex-shrink-0">
                        {session.time}
                      </div>
                    </div>
                    
                    {/* Last Message */}
                    <div className="self-stretch justify-center text-text text-xs font-light font-['Public_Sans'] truncate">
                      {session.lastMessage}
                    </div>
                    
                    {/* Session Status */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        session.isChatEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.isChatEnabled ? 'Chat Active' : 'Waiting to Start'}
                      </span>
                      
                      {session.counselingId && (
                        <span className="text-xs text-gray-500">
                          #{session.counselingId.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Custom chat main for psychologist
  const PsychologistChatMain = () => (
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
      userType="psychologist"
    />
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Psychologist Sidebar */}
      <PsychologistSidebar />

      {/* Chat Main Area */}
      <div className="flex-1 flex">
        <PsychologistChatMain />
      </div>

      {/* Connection Status Indicator */}
      {selectedSession && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' && '🟢 Connected to Client'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'disconnected' && '🔴 Disconnected'}
            {connectionStatus === 'failed' && '❌ Connection Failed'}
          </div>
        </div>
      )}

      {/* Session Actions for Psychologist */}
      {selectedSession && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex gap-2">
            {/* End Session Button (if session is active) */}
            {selectedSession.isActive && (
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                title="End Session"
              >
                End Session
              </button>
            )}
            
            {/* Notes Button */}
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              title="Session Notes"
            >
              📝 Notes
            </button>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(messagesError || sendError) && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
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

export default PsychologistChatPage;