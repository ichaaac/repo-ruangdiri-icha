// src/components/shared/chats/components/ChatHeader.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatHeader = ({ 
  selectedConversation, 
  onToggleSidebar, 
  connectionStatus, 
  isPsychologist, 
  onEndSession, 
  isEndingSession,
  typingStatus
}) => {
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
                e.target.src = '/empty-profile.svg';
              }}
            />
          ) : (
            <img
              src="/empty-profile.svg"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: '#488BBA' }}>
            {selectedConversation?.name || 'Unknown'}
          </h2>
          
          {/* Typing indicator */}
          {selectedConversation?.isTeamChat ? (
            <p className="text-xs font-light" style={{ color: '#488BBA' }}>
              🤖 AI Assistant - Always Available
            </p>
          ) : typingStatus ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                <motion.div 
                  className="w-1 h-1 bg-[#488BBA] rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-1 h-1 bg-[#488BBA] rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div 
                  className="w-1 h-1 bg-[#488BBA] rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
              </div>
              <span className="text-xs font-light text-[#488BBA]">
                {typingStatus}
              </span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              <p className={`text-xs font-light ${
                connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-500'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Online' : '🔴 Offline'}
              </p>
              
              {selectedConversation?.status && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs font-medium ${
                    selectedConversation.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedConversation.status === 'active' ? 'Active Session' : selectedConversation.status}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-start items-center gap-1 sm:gap-[5px] flex-shrink-0">
        {/* END SESSION BUTTON - ONLY FOR PSYCHOLOGIST */}
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
              <>
                <span className="hidden sm:inline">End Session</span>
                <span className="sm:hidden material-icons text-sm">stop</span>
              </>
            )}
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

export default ChatHeader;