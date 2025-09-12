// src/components/shared/chat-widget/ChatWidget.jsx

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import useChatWidget from '../../../hooks/useChatWidget';

const ChatWidget = ({ className = '', sidebarExpanded = false, isMobile = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.role || 'student';

  const {
    isOpen,
    setIsOpen,
    selectedOption,
    expandedFAQ,
    messages,
    inputMessage,
    setInputMessage,
    faqData,
    serviceOptions,
    resetChat,
    handleExpand,
    handleOptionClick,
    handleFAQClick,
    handleSendMessage,
    handleKeyPress,
  } = useChatWidget(navigate, userType);

  // Drag state (UI only)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const rootRef = useRef(null);
  const constraintsRef = useRef(null);

  // Close when clicking outside of widget area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  const handleDragStart = useCallback((event, info) => {
    setIsDragging(true);
    setDragStartTime(Date.now());
    setDragDistance(0);
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }, []);

  const handleDrag = useCallback((event, info) => {
    const distance = Math.sqrt(Math.pow(info.offset.x, 2) + Math.pow(info.offset.y, 2));
    setDragDistance(distance);
  }, []);

  const handleDragEnd = useCallback(
    (event, info) => {
      const dragDuration = Date.now() - dragStartTime;
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      setTimeout(() => {
        setIsDragging(false);
        setDragDistance(0);
      }, 100);
    },
    [dragStartTime]
  );

  const handleWidgetClick = useCallback(
    (event) => {
      if (dragDistance > 10) return;
      if (isDragging) return;
      setIsOpen((prev) => !prev);
    },
    [isDragging, dragDistance, setIsOpen]
  );

  const popupBaseStyle = {
    right: 24,
    bottom: 80,
    maxWidth: '95vw',
    maxHeight: '90vh',
  };

  const shouldShowChat = true;
  if (!shouldShowChat) return null;

  const renderFAQAnswer = (answer) => {
    if (typeof answer !== 'string') return answer;
    if (answer.includes('Kontak Kami')) {
      const parts = answer.split('Kontak Kami');
      return (
        <span>
          {parts[0]}
          <span className="text-primary-V1 underline cursor-pointer hover:text-blue-600">Kontak Kami</span>
          {parts[1]}
        </span>
      );
    }
    if (answer.includes('Layanan Kami')) {
      const parts = answer.split('Layanan Kami');
      return (
        <span>
          {parts[0]}
          <span className="text-primary-V1 underline cursor-pointer hover:text-blue-600">Layanan Kami</span>
          {parts[1]}
        </span>
      );
    }
    return answer;
  };

  return (
    <div ref={rootRef} className={className}>
      {/* Full-screen constraints area */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed w-96 h-[520px] bg-zinc-100 rounded-2xl shadow-2xl border border-gray-200 z-50"
            style={popupBaseStyle}
          >
            <div className="w-full h-full flex flex-col">
              {/* Header */}
              <div className="h-12 px-3.5 py-4 bg-gradient-to-b from-teal-200 to-indigo-500 rounded-tl-2xl rounded-tr-2xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-white text-xl">chat</span>
                    <div className="text-white text-base font-bold font-['Public_Sans']">Team Ruang Diri</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExpand} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10" title="Expand Chat">
                    <span className="material-icons text-lg">open_in_full</span>
                  </button>
                  <button onClick={resetChat} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10" title="Reset">
                    <span className="material-icons text-lg">refresh</span>
                  </button>
                  <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10" title="Close">
                    <span className="material-icons text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Date */}
                <div className="flex justify-center">
                  <div className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-600 text-xs font-['Public_Sans']">
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'Asia/Jakarta',
                    })}
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.sender === 'team' ? (
                        <div className="flex">
                          <div className="flex flex-col">
                            <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">Team Ruang Diri</div>
                            <div className="bg-white rounded-lg border border-gray-200">
                              <div className="p-3">
                                <div className="text-xs text-gray-800 whitespace-pre-line font-['Public_Sans']">{message.text}</div>

                                {/* Service Options */}
                                {message.showOptions && !selectedOption && (
                                  <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
                                    {serviceOptions.map((option, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleOptionClick(option.text)}
                                        className="w-full flex items-center gap-2 p-2 text-left text-primary-V1 hover:bg-blue-50 rounded border-b border-gray-200 last:border-b-0 transition-colors"
                                      >
                                        <span className="material-icons text-sm">{option.icon}</span>
                                        <span className="text-xs font-['Public_Sans']">{option.text}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* FAQ Section */}
                                {message.showFAQ && (
                                  <div className="mt-3 border-t border-gray-200 pt-3">
                                    <div className="bg-white rounded border border-gray-200">
                                      <div className="px-3 py-2 border-b border-gray-200">
                                        <div className="text-xs font-bold text-gray-800 font-['Public_Sans']">FAQ</div>
                                      </div>
                                      <div className="max-h-60 overflow-y-auto">
                                        {faqData.map((faq, index) => (
                                          <div key={index}>
                                            <div className="p-2.5 border-b-[0.25px] border-gray-200">
                                              <button
                                                onClick={() => handleFAQClick(index)}
                                                className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                              >
                                                <span className="text-xs text-primary-V1 font-['Public_Sans'] pr-2 flex-1">{faq.question}</span>
                                                <span
                                                  className="material-icons text-primary-V1 text-sm transition-transform duration-200 flex-shrink-0"
                                                  style={{ transform: expandedFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                >
                                                  keyboard_arrow_down
                                                </span>
                                              </button>
                                            </div>

                                            {expandedFAQ === index && (
                                              <div className="p-2.5 border-b-[0.25px] border-gray-200 bg-gray-50">
                                                <div className="text-xs text-gray-800 font-['Public_Sans'] leading-relaxed">{renderFAQAnswer(faq.answer)}</div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <div className="flex flex-col items-end">
                            <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">You</div>
                            <div className="bg-sky-100 rounded-lg p-3 max-w-xs">
                              <div className="flex items-center gap-2">
                                <span className="material-icons text-[#488BBE] text-sm">
                                  {message.text === 'Ruang Cerita'
                                    ? 'airline_seat_recline_normal'
                                    : message.text === 'Buat Janji Konseling'
                                    ? 'calendar_month'
                                    : message.text === 'Lihat Hasil Skrining'
                                    ? 'content_paste_search'
                                    : message.text === 'Lihat Jadwal Konseling'
                                    ? 'event_available'
                                    : message.text === 'FAQ (Frequently Asked Questions)'
                                    ? 'help'
                                    : 'chat'}
                                </span>
                                <span className="text-xs text-[#488BBE] font-['Public_Sans']">{message.text}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white rounded-bl-2xl rounded-br-2xl border-t border-gray-200">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message here...."
                    className="w-full text-gray-600 text-base bg-transparent outline-none placeholder-gray-400 font-['Public_Sans']"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <span className="material-icons text-gray-500 text-lg">add</span>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <span className="material-icons text-gray-500 text-lg">sentiment_satisfied</span>
                      </button>
                    </div>
                    <button onClick={handleSendMessage} disabled={!inputMessage.trim()} className="p-2 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50">
                      <span className="material-icons text-[#488BBE] text-lg">send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Floating Button */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={constraintsRef}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative z-30"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        whileHover={{ scale: isDragging ? 1 : 1.05 }}
        whileDrag={{ scale: 1.1, zIndex: 35 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.button
          onClick={handleWidgetClick}
          className="w-16 h-16 bg-gradient-to-b from-[#488BBE] to-[#043C68] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative select-none border-2 border-white/20"
          whileTap={{ scale: 0.95 }}
          title={isDragging ? 'Dragging...' : 'Drag to move - Click to chat'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                className="material-icons text-white text-2xl pointer-events-none"
              >
                close
              </motion.span>
            ) : (
              <motion.span
                key="sms"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                className="material-icons text-white text-2xl pointer-events-none"
              >
                sms
              </motion.span>
            )}
          </AnimatePresence>

          {/* Drag Indicator */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none"
              >
                <div className="flex items-center gap-1">
                  <span className="material-icons text-xs">open_with</span>
                  Dragging...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ChatWidget;
