// src/components/shared/chats/ChatWidget.jsx - FIXED DRAGGABLE VERSION

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const ChatWidget = ({ 
  position = 'bottom-right', 
  className = '',
}) => {
  const { user, getOrganizationType } = useAuth();
  const navigate = useNavigate();
  const userType = user?.role || 'student';
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const chatRef = useRef(null);

  // FAQ Data
  const faqData = [
    {
      question: "Bagaimana keamanan data saya dilindungi?",
      answer: "Kami memastikan keamanan dan kerahasiaan data pribadi kamu dengan menerapkan protokol enkripsi. Kerahasiaan datamu adalah prioritas kami."
    },
    {
      question: "Apakah data saya akan dibagikan kepada pihak ketiga?",
      answer: "Kami tidak akan membagikan data kamu kepada pihak ketiga kecuali atas persetujuanmu, atau dalam kondisi paksaan keterikatan hukum yang dilakukan oleh aparatur hukum negara"
    },
    {
      question: "Jika saya mengalami keadaan darurat atau krisis apakah saya harus menggunakan layanan ini?",
      answer: "Apabila kamu atau kerabatmu menghadapi situasi darurat atau krisis yang mengancam jiwa, mohon segera hubungi layanan darurat setempat atau pergi ke unit gawat darurat terdekat. Kami belum menyediakan layanan darurat."
    },
    {
      question: "Saya punya pertanyaan lain yang tidak ada di sini. Bagaimana saya bisa menghubungi Admin RuangDiri?",
      answer: "Kamu bisa menghubungi kami di Kontak Kami"
    },
    {
      question: "Apa yang harus saya persiapkan sebelum sesi konseling pertama?",
      answer: "Kamu dapat mempersiapkan diri dengan memikirkan apa yang ingin kamu diskusikan atau masalah utama yang ingin kamu atasi. Apabila kamu kebingungan, tidak perlu khawatir karena psikolog kami akan mengarahkan alur diskusi sehingga kamu merasa nyaman untuk bercerita."
    },
    {
      question: "Bisakah saya mengubah atau membatalkan janji temu?",
      answer: "Ya, kamu bisa mengubah atau membatalkan janji temu dengan menghapus janji temu di bagian detail janji temu pada platform kami"
    },
    {
      question: "Berapa biaya layanan konseling?",
      answer: "Untuk informasi mengenai biaya layanan konseling, silakan lihat di Layanan Kami"
    },
    {
      question: "Metode pembayaran apa yang diterima?",
      answer: "Kamu bisa membayar dengan metode QR dan transfer ke rekening Bank BNI"
    },
    {
      question: "Bagaimana cara memulai konseling daring?",
      answer: "Untuk memulai konseling daring, Kamu perlu membuat akun di platform kami, memilih layanan dan psikolog/konselor yang sesuai, lalu menjadwalkan janji temu. Kamu akan menerima tautan untuk bergabung dalam sesi virtual pada waktu yang ditentukan."
    },
    {
      question: "Saya punya pertanyaan lain yang tidak ada di sini. Bagaimana saya bisa menghubungi Admin Ruang Diri?",
      answer: "Kamu bisa menghubungi kami melalui Kontak Kami"
    }
  ];

  // Get initial position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'fixed bottom-6 left-6 z-50';
      case 'bottom-right':
        return 'fixed bottom-6 right-6 z-50';
      case 'top-left':
        return 'fixed top-6 left-6 z-50';
      case 'top-right':
        return 'fixed top-6 right-6 z-50';
      default:
        return 'fixed bottom-6 right-6 z-50';
    }
  };

  // Only show for authorized organization types
  const shouldShowChat = true;

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        sender: 'team',
        text: 'Hello, roomies!\n\nSelamat datang di Ruang Bantu.\nApakah ada yang bisa kami bantu?\nUntuk mempermudah keperluan roomies,\nkamu dapat memilih tiga opsi di bawah ini:',
        timestamp: new Date(),
        showOptions: true
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle drag events
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setTimeout(() => setIsDragging(false), 100);
  }, []);

  // Handle widget click (only when not dragging)
  const handleWidgetClick = useCallback(() => {
    if (!isDragging) {
      setIsOpen(prev => !prev);
    }
  }, [isDragging]);

  const handleOptionClick = useCallback((option) => {
    setSelectedOption(option);
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: option,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (option === 'FAQ (Frequently Asked Questions)') {
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text: 'Berikut adalah pertanyaan yang sering ditanyakan:',
          timestamp: new Date(),
          showFAQ: true
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } else if (option === 'Ruang Cerita') {
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text: 'Terima kasih telah memilih Ruang Cerita. Fitur ini sedang dalam pengembangan. Tim kami akan segera menghubungi Anda untuk informasi lebih lanjut.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } else if (option === 'Booking Sesi Konseling') {
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text: 'Untuk booking sesi konseling, silakan hubungi admin kami melalui kontak yang tersedia. Tim kami akan membantu Anda mengatur jadwal konseling yang sesuai.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    }
  }, []);

  const handleFAQClick = useCallback((index) => {
    setExpandedFAQ(prev => prev === index ? null : index);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: 'user',
        text: inputMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text: 'Terima kasih atas pesan Anda. Tim kami akan segera merespons. Untuk respon yang lebih cepat, silakan pilih salah satu opsi yang tersedia di atas.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
    }
  }, [inputMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const resetChat = useCallback(() => {
    setSelectedOption(null);
    setExpandedFAQ(null);
    setMessages([]);
    setInputMessage('');
  }, []);

  // Handle expand to full ChatPage
  const handleExpand = useCallback(() => {
    setIsOpen(false);
    navigate(`/user/${userType}/chat`);
  }, [navigate, userType]);

  const formatCurrentDate = useCallback(() => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    return new Date().toLocaleDateString('id-ID', options);
  }, []);

  const renderFAQAnswer = useCallback((answer) => {
    if (answer.includes('Kontak Kami')) {
      const parts = answer.split('Kontak Kami');
      return (
        <span>
          {parts[0]}
          <span className="text-primary-V1 underline cursor-pointer hover:text-blue-600">
            Kontak Kami
          </span>
          {parts[1]}
        </span>
      );
    }
    if (answer.includes('Layanan Kami')) {
      const parts = answer.split('Layanan Kami');
      return (
        <span>
          {parts[0]}
          <span className="text-primary-V1 underline cursor-pointer hover:text-blue-600">
            Layanan Kami
          </span>
          {parts[1]}
        </span>
      );
    }
    return answer;
  }, []);

  // Don't render if not authorized organization type
  if (!shouldShowChat) {
    return null;
  }

  return (
    <motion.div
      ref={chatRef}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      dragConstraints={{
        left: 0,
        right: window.innerWidth - 80,
        top: 0,
        bottom: window.innerHeight - 80
      }}
      className={`${getPositionClasses()} ${className}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-20 right-0 w-96 h-[520px] bg-zinc-100 rounded-2xl shadow-2xl"
            style={{
              // Smart positioning to prevent going off-screen
              right: position.includes('left') ? 'auto' : 0,
              left: position.includes('left') ? 0 : 'auto',
              bottom: position.includes('top') ? 'auto' : 80,
              top: position.includes('top') ? 80 : 'auto'
            }}
          >
            <div className="w-full h-full flex flex-col">
              {/* Header */}
              <div className="h-12 px-3.5 py-4 bg-gradient-to-b from-teal-200 to-indigo-500 rounded-tl-2xl rounded-tr-2xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-white text-xl">chat</span>
                    <div className="text-white text-base font-bold font-['Public_Sans']">
                      Team Ruang Diri
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExpand}
                    className="text-white hover:text-gray-200 transition-colors p-1"
                    title="Expand Chat"
                  >
                    <span className="material-icons text-lg">open_in_full</span>
                  </button>
                  <button 
                    onClick={resetChat}
                    className="text-white hover:text-gray-200 transition-colors p-1"
                    title="Reset Chat"
                  >
                    <span className="material-icons text-sm">refresh</span>
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors p-1"
                    title="Close Chat"
                  >
                    <span className="material-icons text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="py-2 flex justify-center">
                <div className="text-gray-600 text-xs font-light font-['Public_Sans']">
                  {formatCurrentDate()}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 px-4 py-2 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.sender === 'team' ? (
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1E5A89] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">
                              Team Ruang Diri
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200">
                              <div className="p-3">
                                <div className="text-xs text-gray-800 whitespace-pre-line font-['Public_Sans']">
                                  {message.text}
                                </div>
                                
                                {/* Service Options */}
                                {message.showOptions && !selectedOption && (
                                  <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
                                    {[
                                      { icon: 'accessibility', text: 'Ruang Cerita' },
                                      { icon: 'calendar_today', text: 'Booking Sesi Konseling' },
                                      { icon: 'help', text: 'FAQ (Frequently Asked Questions)' }
                                    ].map((option, index) => (
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
                                                <span className="text-xs text-primary-V1 font-['Public_Sans'] pr-2 flex-1">
                                                  {faq.question}
                                                </span>
                                                <span 
                                                  className="material-icons text-primary-V1 text-sm transition-transform duration-200 flex-shrink-0"
                                                  style={{ 
                                                    transform: expandedFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)' 
                                                  }}
                                                >
                                                  keyboard_arrow_down
                                                </span>
                                              </button>
                                            </div>
                                            
                                            {expandedFAQ === index && (
                                              <div className="p-2.5 border-b-[0.25px] border-gray-200 bg-gray-50">
                                                <div className="text-xs text-gray-800 font-['Public_Sans'] leading-relaxed">
                                                  {renderFAQAnswer(faq.answer)}
                                                </div>
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
                                  {message.text === 'Ruang Cerita' ? 'accessibility' :
                                   message.text === 'Booking Sesi Konseling' ? 'calendar_today' :
                                   message.text === 'FAQ (Frequently Asked Questions)' ? 'help' : 'chat'}
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
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                    >
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
      <motion.button
        onClick={handleWidgetClick}
        className="w-16 h-16 bg-gradient-to-b from-[#488BBE] to-[#043C68] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative select-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isDragging ? "Dragging..." : "Drag to move • Click to chat"}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none"
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
  );
};

export default ChatWidget;