// src/components/shared/chats/ChatWidget.jsx - Updated with Figma Design & Backend Integration

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { useChats } from "./hooks/useChats";

const ChatWidget = ({ 
  position = "bottom-right", 
  className = "", 
  sidebarExpanded = false, 
  isMobile = false 
}) => {
  const { user, getOrganizationType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExtended, setIsExtended] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const organizationType = getOrganizationType();
  const shouldShowChat = organizationType === "company" || organizationType === "school";

  // Initialize chat hook
  const {
    connectionState,
    isConnected,
    isConnecting,
    messages,
    typingUsers,
    error,
    sessionId,
    isLoading,
    createSession,
    sendMessage,
    sendTypingIndicator,
    endSession,
    clearError,
    hasActiveSession,
    getCurrentSession
  } = useChats({
    autoConnect: true,
    eventHandlers: {
      onSessionStatusChanged: (status) => {
        if (status === "completed") {
          setIsOpen(false);
          setIsExtended(false);
          setSelectedOption(null);
        }
      }
    }
  });

  // FAQ Data
  const faqData = [
    {
      question: "Bagaimana keamanan data saya dilindungi?",
      answer: "Kami memastikan keamanan dan kerahasiaan data pribadi kamu dengan menerapkan protokol enkripsi. Kerahasiaan datamu adalah prioritas kami.",
    },
    {
      question: "Apakah data saya akan dibagikan kepada pihak ketiga?",
      answer: "Kami tidak akan membagikan data kamu kepada pihak ketiga kecuali atas persetujuanmu, atau dalam kondisi paksaan keterikatan hukum yang dilakukan oleh aparatur hukum negara",
    },
    {
      question: "Jika saya mengalami keadaan darurat atau krisis apakah saya harus menggunakan layanan ini?",
      answer: "Apabila kamu atau kerabatmu menghadapi situasi darurat atau krisis yang mengancam jiwa, mohon segera hubungi layanan darurat setempat atau pergi ke unit gawat darurat terdekat. Kami belum menyediakan layanan darurat.",
    },
    {
      question: "Saya punya pertanyaan lain yang tidak ada di sini. Bagaimana saya bisa menghubungi Admin RuangDiri?",
      answer: "Kamu bisa menghubungi kami di Kontak Kami",
    },
    {
      question: "Apa yang harus saya persiapkan sebelum sesi konseling pertama?",
      answer: "Kamu dapat mempersiapkan diri dengan memikirkan apa yang ingin kamu diskusikan atau masalah utama yang ingin kamu atasi. Apabila kamu kebingungan, tidak perlu khawatir karena psikolog kami akan mengarahkan alur diskusi sehingga kamu merasa nyaman untuk bercerita.",
    },
  ];

  const serviceOptions = [
    { icon: "accessibility", text: "Ruang Cerita" },
    { icon: "calendar_month", text: "Booking Sesi Konseling" },
    { icon: "help", text: "FAQ (Frequently Asked Questions)" },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        if (isExtended) {
          setIsExtended(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    if (isOpen || isExtended) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isExtended]);

  // Calculate sidebar offset for extended chat positioning
  const getSidebarOffset = () => {
    if (isMobile) return 60;
    return sidebarExpanded ? 257 : 80;
  };

  const sidebarOffset = getSidebarOffset();

  const getExtendedChatStyles = () => ({
    position: "fixed",
    top: "124px",
    left: `${sidebarOffset}px`,
    width: `calc(100vw - ${sidebarOffset}px)`,
    height: "686px",
    zIndex: 50,
    maxHeight: "calc(100vh - 124px - 24px)",
    maxWidth: "100vw",
  });

  // Handle service option clicks
  const handleOptionClick = async (option) => {
    setSelectedOption(option);

    if (option.text === "Ruang Cerita") {
      // Create new session or use existing
      if (!sessionId && !hasActiveSession()) {
        try {
          // For demo, we'll use a dummy psychologist ID
          // In real implementation, this should come from psychologist selection
          await createSession("550e8400-e29b-41d4-a716-446655440001");
        } catch (error) {
          console.error("Failed to create session:", error);
        }
      }
    } else if (option.text === "Booking Sesi Konseling") {
      // Handle booking
      window.open("/booking-session", "_blank");
    } else if (option.text === "FAQ (Frequently Asked Questions)") {
      // FAQ will be shown in the message area
    }
  };

  // Handle FAQ clicks
  const handleFAQClick = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  // Handle input change with typing indicators
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (isConnected && sessionId) {
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

      // Focus back on input
      inputRef.current?.focus();
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

  const resetChat = () => {
    setSelectedOption(null);
    setExpandedFAQ(null);
    setInputMessage("");
  };

  const toggleExtended = () => {
    if (!isExtended) {
      setIsOpen(false);
      setIsExtended(true);
    } else {
      setIsExtended(false);
      setIsOpen(true);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const getInitial = () => {
    if (user?.fullName && user.fullName.length > 0) {
      return user.fullName.charAt(0).toUpperCase();
    }
    return "U";
  };

  if (!shouldShowChat) {
    return null;
  }

  return (
    <div className={className} ref={chatRef}>
      <AnimatePresence>
        {/* Extended Chat - Full Screen */}
        {isExtended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={getExtendedChatStyles()}
            className="bg-white overflow-hidden shadow-xl rounded-lg"
          >
            {/* Extended Header - Figma Style */}
            <div className="w-full h-16 px-5 py-3 bg-white border-t-[0.25px] border-b-[0.25px] border-[#8B8B8B] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-[45px] h-[46px] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                    <span className="text-white text-lg font-bold">T</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-[#488BBE] text-xl font-bold font-['Public_Sans']">Team Ruang Diri</div>
                  <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
                    {isConnected ? "Online" : isConnecting ? "Connecting..." : "Offline"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={resetChat}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Reset Chat"
                >
                  <span className="material-icons text-[#8B8B8B]">refresh</span>
                </motion.button>
                <motion.button
                  onClick={toggleExtended}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Minimize Chat"
                >
                  <span className="material-icons text-[#8B8B8B]">minimize</span>
                </motion.button>
                {/* Three dots menu */}
                <div className="w-[31px] h-[8px] flex items-center justify-center">
                  <svg width="31" height="8" viewBox="0 0 31 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="3.5" cy="4" r="3.5" fill="var(--text, #8B8B8B)"/>
                    <circle cx="15.5" cy="4" r="3.5" fill="var(--text, #8B8B8B)"/>
                    <circle cx="27.5" cy="4" r="3.5" fill="var(--text, #8B8B8B)"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Extended Messages Area - Figma Style */}
            <div className="h-[calc(100%-16px-127px)] bg-zinc-100 overflow-y-auto">
              <div className="w-full p-6">
                <div className="flex flex-col items-center gap-3.5">
                  <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans'] leading-tight">Hari ini</div>

                  <div className="w-full max-w-4xl flex flex-col gap-3.5">
                    {/* Default welcome messages */}
                    {messages.length === 0 && !sessionId && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-end items-center gap-3 pr-2.5"
                        >
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans']">You</div>
                            <div className="bg-sky-100 rounded-[10px] px-3.5 py-2.5">
                              <div className="text-[#535353] text-base font-normal font-['Public_Sans']">Haloooo</div>
                            </div>
                            <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans']">09.40</div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col gap-4 pr-2.5"
                        >
                          <div className="flex gap-2 items-start">
                            <div className="w-[26px] h-[54px] flex items-center">
                              <div className="w-[26px] h-[26px] rounded-full bg-[#1E5A89] flex items-center justify-center">
                                <span className="text-white text-xs font-bold">T</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 items-start flex-1">
                              <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">Team Ruang Diri</div>
                              <div className="flex flex-col items-start w-full">
                                <div className="bg-white rounded-tl-[5px] rounded-tr-[5px] border-solid border-b-[0.25px] border-b-[#535353] px-3.5 py-2.5 flex gap-2.5 items-center w-full max-w-2xl min-h-[120px]">
                                  <div className="text-[#535353] text-sm leading-4 font-['Public_Sans'] whitespace-pre-line">
                                    Hello, roomies!{"\n\n"}Selamat datang di Ruang Bantu.{"\n"}Apakah ada yang bisa kami bantu?{"\n"}Untuk mempermudah keperluan roomies,{"\n\n"}kamu dapat memilih tiga opsi di bawah ini:
                                  </div>
                                </div>

                                {/* Service Options */}
                                <motion.div
                                  className="flex flex-col w-full max-w-2xl"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3, delay: 0.4 }}
                                >
                                  {serviceOptions.map((option, index) => (
                                    <motion.button
                                      key={index}
                                      onClick={() => handleOptionClick(option)}
                                      className="flex gap-2.5 items-center px-3.5 py-2.5 bg-white border-solid border-b-[0.25px] border-b-[#535353] hover:bg-gray-50 transition-colors min-h-[30px]"
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                    >
                                      <span className="material-icons text-[#488BBE] text-[18px]">{option.icon}</span>
                                      <div className="text-[#488BBE] text-xs leading-5 font-['Public_Sans']">
                                        {option.text === "FAQ (Frequently Asked Questions)" ? (
                                          <>
                                            FAQ
                                            <div className="italic">(Frequently Asked Questions)</div>
                                          </>
                                        ) : (
                                          option.text
                                        )}
                                      </div>
                                    </motion.button>
                                  ))}
                                </motion.div>
                              </div>
                              <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">09.40</div>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}

                    {/* Real Messages */}
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {message.senderId === user?.id ? (
                          // User Message
                          <div className="flex justify-end items-center gap-3 pr-2.5">
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans']">You</div>
                              <div className="bg-sky-100 rounded-[10px] px-3.5 py-2.5">
                                <div className="text-[#535353] text-base font-normal font-['Public_Sans']">
                                  {message.message}
                                </div>
                              </div>
                              <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans']">
                                {formatTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Team Message
                          <div className="flex flex-col gap-4 pr-2.5">
                            <div className="flex gap-2 items-start">
                              <div className="w-[26px] h-[54px] flex items-center">
                                <div className="w-[26px] h-[26px] rounded-full bg-[#1E5A89] flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">T</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5 items-start flex-1">
                                <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
                                  {message.sender?.fullName || "Team Ruang Diri"}
                                </div>
                                <div className="bg-white rounded-tl-[5px] rounded-tr-[5px] border-solid border-b-[0.25px] border-b-[#535353] px-3.5 py-2.5">
                                  <div className="text-[#535353] text-sm leading-4 font-['Public_Sans'] whitespace-pre-line">
                                    {message.message}
                                  </div>
                                </div>
                                <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
                                  {formatTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* FAQ Section */}
                    {selectedOption?.text === "FAQ (Frequently Asked Questions)" && (
                      <motion.div
                        className="mt-3 w-full max-w-2xl"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="bg-white rounded border border-gray-200">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <div className="text-sm font-bold text-gray-800 font-['Public_Sans']">FAQ</div>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {faqData.map((faq, index) => (
                              <div key={index}>
                                <div className="p-3 border-b-[0.25px] border-gray-200">
                                  <motion.button
                                    onClick={() => handleFAQClick(index)}
                                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <span className="text-sm text-[#488BBE] font-['Public_Sans'] pr-2 flex-1">
                                      {faq.question}
                                    </span>
                                    <motion.span
                                      className="material-icons text-[#488BBE] text-lg flex-shrink-0"
                                      animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      keyboard_arrow_down
                                    </motion.span>
                                  </motion.button>
                                </div>

                                <AnimatePresence>
                                  {expandedFAQ === index && (
                                    <motion.div
                                      className="p-3 border-b-[0.25px] border-gray-200 bg-gray-50"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <div className="text-sm text-gray-800 font-['Public_Sans'] leading-relaxed">
                                        {faq.answer}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Typing indicators */}
                    {typingUsers.length > 0 && (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="w-[26px] h-[26px] rounded-full bg-[#1E5A89] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans'] italic">
                          sedang mengetik...
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Input Area - Figma Style */}
            <div className="h-32 px-3.5 py-5 bg-white border-t-[0.25px] border-b-[0.25px] border-[#8B8B8B] flex flex-col gap-2.5">
              <div className="w-full h-20 flex flex-col justify-between">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message here...."
                  disabled={!isConnected}
                  className="w-full text-[#535353] text-base font-normal font-['Public_Sans'] leading-normal bg-transparent border-none outline-none placeholder-[#535353]"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="material-icons text-[#535353] text-xl">add_circle_outline</span>
                    </motion.button>
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="material-icons text-[#535353] text-xl">sentiment_satisfied</span>
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!isConnected || !inputMessage.trim()}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="material-icons text-[#488BBE] text-xl">send</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* File Upload Dropdown */}
            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  className="absolute bottom-[160px] left-[50px] bg-white rounded-[5px] shadow-md p-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 12H9V10.5H3V12ZM3 9H9V7.5H3V9ZM1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H7.5L12 4.5V13.5C12 13.9125 11.8531 14.2656 11.5594 14.5594C11.2656 14.8531 10.9125 15 10.5 15H1.5ZM6.75 5.25V1.5H1.5V13.5H10.5V5.25H6.75Z" fill="var(--TEXT-NEW, #535353)"/>
                    </svg>
                    <div className="text-[#535353] text-sm font-normal font-['Public_Sans']">Upload a file</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Compact Widget */}
        {isOpen && !isExtended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-20 right-0 w-[413px] h-[520px] bg-[#f3f3f3] rounded-[15px] shadow-xl overflow-hidden"
          >
            {/* Compact Header - Figma Style */}
            <div className="h-[48px] px-3.5 py-4 bg-gradient-to-b from-[#91D9E1] to-[#5E6EC3] rounded-tl-[15px] rounded-tr-[15px] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="material-icons text-white text-[19px]">chat</span>
                <div className="text-white text-base font-bold font-['Public_Sans']">Team Ruang Diri</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                  title="Reset Chat"
                >
                  <span className="material-icons text-sm">refresh</span>
                </button>
                <button
                  onClick={toggleExtended}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                  title="Expand Chat"
                >
                  <span className="material-icons text-sm">open_in_full</span>
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
              <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">Selasa, 24 Juni 2025</div>
            </div>

            {/* Compact Messages */}
            <div className="h-[calc(100%-48px-16px-122px)] px-4 py-2 overflow-y-auto">
              <div className="space-y-4">
                {/* Default messages if no real messages */}
                {messages.length === 0 && !sessionId && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">You</div>
                        <div className="bg-sky-100 rounded-lg p-3 max-w-xs">
                          <span className="text-xs text-[#488BBE] font-['Public_Sans']">Haloooo</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1E5A89] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">Team Ruang Diri</div>
                        <div className="bg-white rounded-lg border border-gray-200">
                          <div className="p-3">
                            <div className="text-xs text-gray-800 whitespace-pre-line font-['Public_Sans'] mb-3">
                              Hello, roomies!{"\n\n"}Selamat datang di Ruang Bantu.{"\n"}Apakah ada yang bisa kami bantu?{"\n"}Untuk mempermudah keperluan roomies, kamu dapat memilih tiga opsi di bawah ini:
                            </div>

                            <motion.div
                              className="space-y-1 border-t border-gray-200 pt-3"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3, delay: 0.4 }}
                            >
                              {serviceOptions.map((option, index) => (
                                <motion.button
                                  key={index}
                                  onClick={() => handleOptionClick(option)}
                                  className="w-full flex items-center gap-2 p-2 text-left text-[#488BBE] hover:bg-blue-50 rounded border-b border-gray-200 last:border-b-0 transition-colors"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span className="material-icons text-sm">{option.icon}</span>
                                  <span className="text-xs font-['Public_Sans']">{option.text}</span>
                                </motion.button>
                              ))}
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}

                {/* Real Messages */}
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {message.senderId === user?.id ? (
                      <div className="flex justify-end">
                        <div className="flex flex-col items-end">
                          <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">You</div>
                          <div className="bg-sky-100 rounded-lg p-3 max-w-xs">
                            <span className="text-xs text-[#488BBE] font-['Public_Sans']">{message.message}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1E5A89] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">Team Ruang Diri</div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="text-xs text-gray-800 whitespace-pre-line font-['Public_Sans']">
                              {message.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <motion.div
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1E5A89] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <div className="text-xs text-gray-600 italic font-['Public_Sans'] mt-2">sedang mengetik...</div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Compact Input - Figma Style */}
            <div className="h-[122px] p-4 bg-white rounded-bl-[15px] rounded-br-[15px] border-t border-gray-200">
              <div className="space-y-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message here...."
                  disabled={!isConnected}
                  className="w-full text-[#535353] text-base bg-transparent outline-none placeholder-gray-400 font-['Public_Sans']"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="material-icons text-gray-500 text-lg">add_circle_outline</span>
                    </motion.button>
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="material-icons text-gray-500 text-lg">sentiment_satisfied</span>
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!isConnected || !inputMessage.trim()}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="material-icons text-[#488BBE] text-lg">send</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isExtended && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-gradient-to-b from-[#488BBE] to-[#043C68] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative fixed bottom-6 right-6 z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Chat dengan Tim Ruang Diri"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                className="material-icons text-white text-2xl"
              >
                close
              </motion.span>
            ) : (
              <motion.span
                key="sms"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                className="material-icons text-white text-2xl"
              >
                sms
              </motion.span>
            )}
          </AnimatePresence>

          {!isOpen && !hasActiveSession() && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-[#EE4266] rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white text-xs font-bold">1</span>
            </motion.div>
          )}
        </motion.button>
      )}

      {/* Connection Status Indicator */}
      {(isOpen || isExtended) && (
        <motion.div
          className={`fixed ${isExtended ? 'top-32 right-8' : 'bottom-[540px] right-2'} z-50`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : isConnecting 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className={`fixed ${isExtended ? 'top-40 right-8' : 'bottom-[560px] right-2'} z-50 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg max-w-xs`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button onClick={clearError} className="ml-2 text-red-500 hover:text-red-700">
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;