"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "../../../hooks/useAuth"

const ChatWidget = ({ position = "bottom-right", className = "", sidebarExpanded = false, isMobile = false }) => {
  const { user, getOrganizationType } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isExtended, setIsExtended] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const chatRef = useRef(null)

  const organizationType = getOrganizationType()

  // FAQ Data
  const faqData = [
    {
      question: "Bagaimana keamanan data saya dilindungi?",
      answer:
        "Kami memastikan keamanan dan kerahasiaan data pribadi kamu dengan menerapkan protokol enkripsi. Kerahasiaan datamu adalah prioritas kami.",
    },
    {
      question: "Apakah data saya akan dibagikan kepada pihak ketiga?",
      answer:
        "Kami tidak akan membagikan data kamu kepada pihak ketiga kecuali atas persetujuanmu, atau dalam kondisi paksaan keterikatan hukum yang dilakukan oleh aparatur hukum negara",
    },
    {
      question: "Jika saya mengalami keadaan darurat atau krisis apakah saya harus menggunakan layanan ini?",
      answer:
        "Apabila kamu atau kerabatmu menghadapi situasi darurat atau krisis yang mengancam jiwa, mohon segera hubungi layanan darurat setempat atau pergi ke unit gawat darurat terdekat. Kami belum menyediakan layanan darurat.",
    },
    {
      question: "Saya punya pertanyaan lain yang tidak ada di sini. Bagaimana saya bisa menghubungi Admin RuangDiri?",
      answer: "Kamu bisa menghubungi kami di Kontak Kami",
    },
    {
      question: "Apa yang harus saya persiapkan sebelum sesi konseling pertama?",
      answer:
        "Kamu dapat mempersiapkan diri dengan memikirkan apa yang ingin kamu diskusikan atau masalah utama yang ingin kamu atasi. Apabila kamu kebingungan, tidak perlu khawatir karena psikolog kami akan mengarahkan alur diskusi sehingga kamu merasa nyaman untuk bercerita.",
    },
  ]

  const shouldShowChat = organizationType === "company" || organizationType === "school"

  // Initial messages setup
  useEffect(() => {
    if ((isOpen || isExtended) && messages.length === 0) {
      const initialMessages = [
        {
          id: 1,
          sender: "user",
          text: "Haloooo",
          timestamp: "09.40",
          type: "text",
        },
        {
          id: 2,
          sender: "team",
          text: "Hello, roomies!\n\nSelamat datang di Ruang Bantu.\nApakah ada yang bisa kami bantu?\nUntuk mempermudah keperluan roomies,\nkamu dapat memilih tiga opsi di bawah ini:",
          timestamp: "09.40",
          type: "text",
          showOptions: true,
        },
      ]
      setMessages(initialMessages)
    }
  }, [isOpen, isExtended, messages.length])

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        if (isExtended) {
          setIsExtended(false)
        } else {
          setIsOpen(false)
        }
      }
    }

    if (isOpen || isExtended) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, isExtended])

  // Calculate sidebar offset for extended chat positioning
  const getSidebarOffset = () => {
    if (isMobile) {
      return 60 // Mobile sidebar width (always collapsed)
    }
    // These values match UserLayout's getContentMargin (sidebar width + 20px gap)
    return sidebarExpanded ? 257 : 80
  }

  const sidebarOffset = getSidebarOffset()

  const getExtendedChatStyles = () => {
    return {
      position: "fixed",
      top: "124px", // From Figma slice
      left: `${sidebarOffset}px`,
      width: `calc(100vw - ${sidebarOffset}px)`,
      height: "686px", // Fixed height as requested
      zIndex: 50,
      // Add responsive adjustments for smaller screens if needed
      maxHeight: "calc(100vh - 124px - 24px)", // Adjust for viewport height
      maxWidth: "100vw", // Ensure it doesn't exceed viewport width
    }
  }

  const handleOptionClick = (option) => {
    setSelectedOption(option)

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: option.text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      type: "option",
      icon: option.icon,
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate team response
    setTimeout(() => {
      let responseText = ""
      switch (option.text) {
        case "Ruang Cerita":
          responseText =
            "Hello, roomies! Kamu bisa mulai dengan menjelaskan keresahanmu atau hal apapun\nyang membuatmu merasa terganggu, di sini."
          break
        case "Booking Sesi Konseling":
          responseText =
            "Untuk booking sesi konseling, silakan hubungi admin kami. Tim kami akan membantu mengatur jadwal yang sesuai."
          break
        case "FAQ (Frequently Asked Questions)":
          responseText =
            "Berikut adalah pertanyaan yang sering ditanyakan. Silakan pilih topik yang ingin Anda ketahui lebih lanjut."
          break
        default:
          responseText = "Terima kasih atas pilihan Anda. Tim kami akan segera membantu."
      }

      const teamMessage = {
        id: Date.now() + 1,
        sender: "team",
        text: responseText,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
        showFAQ: option.text === "FAQ (Frequently Asked Questions)",
      }

      setMessages((prev) => [...prev, teamMessage])
    }, 1000)
  }

  const handleFAQClick = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: "user",
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      }

      setMessages((prev) => [...prev, newMessage])
      setInputMessage("")

      setTimeout(() => {
        const teamMessage = {
          id: Date.now() + 1,
          sender: "team",
          text: "Terima kasih atas pesan Anda. Tim kami akan segera merespons.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          type: "text",
        }

        setMessages((prev) => [...prev, teamMessage])
      }, 1000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const resetChat = () => {
    setSelectedOption(null)
    setExpandedFAQ(null)
    setMessages([])
    setInputMessage("")
  }

  const toggleExtended = () => {
    if (!isExtended) {
      setIsOpen(false)
      setIsExtended(true)
    } else {
      setIsExtended(false)
      setIsOpen(true)
    }
  }

  const serviceOptions = [
    { icon: "accessibility", text: "Ruang Cerita" },
    { icon: "calendar_month", text: "Booking Sesi Konseling" },
    { icon: "help", text: "FAQ (Frequently Asked Questions)" },
  ]

  if (!shouldShowChat) {
    return null
  }

  return (
    <div className={className} ref={chatRef}>
      <AnimatePresence>
        {isExtended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={getExtendedChatStyles()}
            className="bg-white overflow-hidden shadow-xl rounded-lg" // Added rounded-lg for better aesthetics
          >
            {/* Extended Chat Header - Like Chat Pages */}
            <div className="w-full h-16 px-5 py-3 bg-white border-b-[0.25px] border-[#8B8B8B] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-[45px] h-[46px] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                    <span className="text-white text-lg font-bold">T</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-[#488BBE] text-xl font-bold font-['Public_Sans']">Team Ruang Diri</div>
                  <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">Online</div>
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
              </div>
            </div>

            {/* Extended Messages Area - Full Screen */}
            <div className="h-[calc(100%-16px-127px)] bg-zinc-100 overflow-y-auto p-6">
              <div className="flex flex-col justify-center items-center gap-3.5">
                <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans'] leading-tight">Hari ini</div>

                <div className="w-full max-w-4xl flex flex-col gap-3.5">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {message.sender === "user" ? (
                        // User Message - Extended Layout
                        <div className="flex justify-end items-center gap-3 pr-2.5">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans']">You</div>
                            <div className="bg-sky-100 rounded-[10px] px-3.5 py-2.5 flex items-center gap-2.5">
                              {message.type === "option" && message.icon && (
                                <span className="material-icons text-[#488BBE] text-[18px]">{message.icon}</span>
                              )}
                              <div className="text-[#535353] text-base font-normal font-['Public_Sans'] leading-normal">
                                {message.text}
                              </div>
                            </div>
                            <div className="text-[#8B8B8B] text-sm font-light font-['Public_Sans']">
                              {message.timestamp}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Team Message - Extended Layout
                        <div className="flex flex-col gap-4 pr-2.5">
                          <div className="flex gap-2 items-start">
                            <div className="w-[26px] h-[54px] flex items-center">
                              <div className="w-[26px] h-[26px] rounded-full bg-[#1E5A89] flex items-center justify-center">
                                <span className="text-white text-xs font-bold">T</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 items-start flex-1">
                              <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
                                Team Ruang Diri
                              </div>
                              <div className="flex flex-col items-start w-full">
                                <div className="bg-white rounded-3xl border-solid border-b-[0.25px] border-b-[#535353] p-4 flex gap-2.5 items-center w-full max-w-2xl">
                                  <div className="text-[#535353] text-sm leading-4 font-['Public_Sans'] whitespace-pre-line">
                                    {message.text}
                                  </div>
                                </div>

                                {/* Service Options - Extended */}
                                {message.showOptions && (
                                  <motion.div
                                    className="flex flex-col w-full max-w-2xl"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                  >
                                    {serviceOptions.map((option, index) => (
                                      <motion.button
                                        key={index}
                                        onClick={() => handleOptionClick(option)}
                                        className="flex gap-2.5 items-center px-4 py-2.5 bg-white border-solid border-b-[0.25px] border-b-[#535353] hover:bg-gray-50 transition-colors"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                      >
                                        <span className="material-icons text-[#488BBE] text-[18px]">{option.icon}</span>
                                        <div className="text-blue-500 text-sm leading-5 font-['Public_Sans']">
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
                                )}

                                {/* FAQ Section - Extended */}
                                {message.showFAQ && (
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
                                                  animate={{
                                                    rotate: expandedFAQ === index ? 180 : 0,
                                                  }}
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
                              </div>
                              <div className="text-[#8B8B8B] text-xs font-light font-['Public_Sans']">
                                {message.timestamp}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Extended Input Area - Full Width */}
            <div className="h-32 px-3.5 py-5 bg-white border-t-[0.25px] border-b-[0.25px] border-[#8B8B8B] flex flex-col gap-2.5">
              <div className="w-full h-20 flex flex-col justify-between">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message here...."
                  className="w-full text-[#535353] text-base font-normal font-['Public_Sans'] leading-normal bg-transparent border-none outline-none placeholder-[#535353]"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="material-icons text-[#488BBE] text-xl">send</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Compact Widget */}
        {isOpen && !isExtended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-20 right-0 w-96 h-[520px] bg-zinc-100 rounded-2xl shadow-xl"
          >
            <div className="w-full h-full flex flex-col">
              {/* Compact Header */}
              <div className="h-12 px-3.5 py-4 bg-gradient-to-b from-teal-200 to-indigo-500 rounded-tl-2xl rounded-tr-2xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-white text-xl">chat</span>
                    <div className="text-white text-base font-bold font-['Public_Sans']">Team Ruang Diri</div>
                  </div>
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
                <div className="text-gray-600 text-xs font-light font-['Public_Sans']">Selasa, 24 Juni 2025</div>
              </div>

              {/* Compact Messages */}
              <div className="flex-1 px-4 py-2 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {message.sender === "team" ? (
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1E5A89] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1 font-['Public_Sans']">Team Ruang Diri</div>
                            <div className="bg-white rounded-lg border border-gray-200">
                              <div className="p-3">
                                <div className="text-xs text-gray-800 whitespace-pre-line font-['Public_Sans']">
                                  {message.text}
                                </div>

                                {message.showOptions && !selectedOption && (
                                  <motion.div
                                    className="mt-3 space-y-1 border-t border-gray-200 pt-3"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
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
                                {message.type === "option" && message.icon && (
                                  <span className="material-icons text-[#488BBE] text-sm">{message.icon}</span>
                                )}
                                <span className="text-xs text-[#488BBE] font-['Public_Sans']">{message.text}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Compact Input */}
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
                      <motion.button
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="material-icons text-gray-500 text-lg">add</span>
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
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="material-icons text-[#488BBE] text-lg">send</span>
                    </motion.button>
                  </div>
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

          {!isOpen && (
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
    </div>
  )
}

export default ChatWidget
