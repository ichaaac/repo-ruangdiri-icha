import { useState, useRef, useEffect } from 'react';

const ExtendedChatWidget = ({
  className = '',
  onClose = () => {},
  isVisible = true
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const messagesEndRef = useRef(null);

  // Initial messages setup
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const initialMessages = [
        {
          id: 1,
          sender: 'user',
          text: 'Haloooo',
          timestamp: '09.40',
          type: 'text'
        },
        {
          id: 2,
          sender: 'team',
          text: 'Hello, roomies!\n\nSelamat datang di Ruang Bantu. Apakah ada yang bisa kami bantu?\nUntuk mempermudah keperluan roomies,\n\nkamu dapat memilih tiga opsi di bawah ini:',
          timestamp: '09.40',
          type: 'text',
          showOptions: true
        },
        {
          id: 3,
          sender: 'user',
          text: 'Ruang Cerita',
          timestamp: '09.41',
          type: 'option',
          icon: 'accessibility'
        },
        {
          id: 4,
          sender: 'team',
          text: 'Hello, roomies! Kamu bisa mulai dengan menjelaskan keresahanmu atau hal apapun\nyang membuatmu merasa terganggu, di sini.',
          timestamp: '09.40',
          type: 'text'
        }
      ];
      setMessages(initialMessages);
    }
  }, [isVisible, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = (option) => {
    setSelectedOption(option);

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: option.text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'option',
      icon: option.icon
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate team response
    setTimeout(() => {
      let responseText = '';
      switch (option.text) {
        case 'Ruang Cerita':
          responseText = 'Hello, roomies! Kamu bisa mulai dengan menjelaskan keresahanmu atau hal apapun\nyang membuatmu merasa terganggu, di sini.';
          break;
        case 'Booking Sesi Konseling':
          responseText = 'Untuk booking sesi konseling, silakan hubungi admin kami. Tim kami akan membantu mengatur jadwal yang sesuai.';
          break;
        case 'FAQ (Frequently Asked Questions)':
          responseText = 'Berikut adalah pertanyaan yang sering ditanyakan. Silakan pilih topik yang ingin Anda ketahui lebih lanjut.';
          break;
        default:
          responseText = 'Terima kasih atas pilihan Anda. Tim kami akan segera membantu.';
      }

      const teamMessage = {
        id: Date.now() + 1,
        sender: 'team',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages(prev => [...prev, teamMessage]);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: 'user',
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      // Simulate team response
      setTimeout(() => {
        const teamMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text: 'Terima kasih atas pesan Anda. Tim kami akan segera merespons.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };

        setMessages(prev => [...prev, teamMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const serviceOptions = [
    { icon: 'accessibility', text: 'Ruang Cerita' },
    { icon: 'calendar_month', text: 'Booking Sesi Konseling' },
    { icon: 'help', text: 'FAQ (Frequently Asked Questions)' }
  ];

  if (!isVisible) return null;

  return (
    <div className={`relative bg-white h-[810px] w-[1440px] max-md:w-full max-md:h-screen ${className}`}>
      {/* Background */}
      <div className="flex absolute flex-col justify-between items-start h-[686px] left-[237px] top-[124px] w-[1203px] max-md:left-[200px] max-md:w-[calc(100%_-_200px)] max-sm:left-[60px] max-sm:w-[calc(100%_-_60px)]">
        <div className="relative self-stretch bg-zinc-100 border-t-[0.25px] border-t-zinc-500 h-[686px]" />
      </div>

      {/* Chat Header */}
      <header className="flex absolute justify-between items-center px-6 py-4 h-[70px] left-[237px] top-[124px] w-[1203px] max-md:left-[200px] max-md:w-[calc(100%_-_200px)] max-sm:left-[60px] max-sm:w-[calc(100%_-_60px)]">
        <div className="flex relative justify-between items-center flex-[1_0_0]">
          <div className="flex relative gap-2.5 items-center">
            <span className="material-icons text-white text-[30px]">chat</span>
            <h1 className="relative text-xl font-bold text-center text-white">
              Team Ruang Diri
            </h1>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2.5 text-white hover:text-gray-200 transition-colors"
            aria-label="Minimize chat"
          >
            <span className="material-icons text-white text-xs">remove</span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex absolute flex-col gap-5 justify-center items-center h-[546px] left-[261px] top-[213px] w-[1155px] max-md:left-5 max-md:w-[calc(100%_-_40px)] max-sm:left-2.5 max-sm:w-[calc(100%_-_20px)] overflow-y-auto">
        {/* Date Indicator */}
        <div className="flex relative gap-2.5 justify-center items-center">
          <time className="relative text-xs font-light leading-5 text-zinc-500">
            Hari ini
          </time>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-5 w-full">
          {messages.map((message) => (
            <div key={message.id}>
              {message.sender === 'user' ? (
                // User Message
                <div className="flex relative flex-col gap-1.5 items-end self-stretch rounded-[15px_15px_0_0] max-sm:mr-2.5">
                  <div className="relative text-xs font-light text-zinc-500">
                    You
                  </div>
                  <div className="flex relative gap-2.5 justify-end items-center px-4 py-2.5 bg-sky-100 rounded-md max-sm:px-3 max-sm:py-2">
                    {message.type === 'option' && message.icon && (
                      <span className="material-icons text-[#488BBE] text-[18px]">
                        {message.icon}
                      </span>
                    )}
                    <div className="relative text-sm leading-5 text-neutral-600 max-sm:text-xs">
                      {message.text}
                    </div>
                  </div>
                  <time className="relative text-xs font-light text-zinc-500">
                    {message.timestamp}
                  </time>
                </div>
              ) : (
                // Team Message
                <div className="flex relative flex-col gap-4 justify-center items-start self-stretch">
                  <div className="flex relative gap-2 items-start rounded-[15px_15px_0_0]">
                    <div className="w-[26px] h-[54px] flex items-center">
                      <div className="w-[26px] h-[26px] rounded-full bg-[#1E5A89] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                    </div>
                    <div className="flex relative flex-col gap-1.5 items-start">
                      <div className="relative self-stretch text-xs font-light text-zinc-500">
                        Team Ruang Diri
                      </div>
                      <div className="flex relative flex-col items-start self-stretch">
                        <div className={`flex relative gap-2.5 items-center p-4 bg-white rounded-3xl border-solid border-b-[0.25px] border-b-neutral-600 ${message.showOptions ? 'h-[120px] max-sm:h-auto max-sm:min-h-[100px]' : 'max-sm:p-2.5'}`}>
                          <div className="relative text-sm leading-4 text-neutral-600 max-sm:text-xs max-sm:leading-4 whitespace-pre-line">
                            {message.text}
                          </div>
                        </div>

                        {/* Service Options */}
                        {message.showOptions && (
                          <div className="flex flex-col w-full">
                            {serviceOptions.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => handleOptionClick(option)}
                                className="flex relative gap-2.5 items-center self-stretch px-4 py-2.5 bg-white border-solid border-b-[0.25px] border-b-neutral-600 hover:bg-gray-50 transition-colors"
                              >
                                <span className="material-icons text-[#488BBE] text-[18px]">
                                  {option.icon}
                                </span>
                                <div className="relative text-sm leading-5 text-blue-500 max-sm:text-xs">
                                  {option.text === 'FAQ (Frequently Asked Questions)' ? (
                                    <>
                                      FAQ
                                      <div className="italic">(Frequently Asked Questions)</div>
                                    </>
                                  ) : (
                                    option.text
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <time className="relative self-stretch text-xs font-light text-zinc-500">
                        {message.timestamp}
                      </time>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex absolute flex-col gap-2.5 justify-center items-center px-8 py-5 bg-white border-solid border-y-[0.25px] border-y-zinc-500 h-[127px] left-[237px] top-[683px] w-[1203px] max-md:left-[200px] max-md:w-[calc(100%_-_200px)] max-sm:left-[60px] max-sm:w-[calc(100%_-_60px)]">
        <div className="flex relative flex-col gap-14 items-start self-stretch">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message here...."
            className="relative self-stretch text-base leading-6 text-neutral-600 max-sm:text-sm bg-transparent border-none outline-none placeholder-neutral-600"
          />
          <div className="flex relative justify-between items-center self-stretch">
            <div className="flex items-center gap-2.5">
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Add attachment"
              >
                <span className="material-icons text-[#535353] text-xl">add_circle_outline</span>
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Add emoji"
              >
                <span className="material-icons text-[#535353] text-xl">sentiment_satisfied</span>
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              aria-label="Send message"
            >
              <span className="material-icons text-[#488BBE] text-xl">send</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExtendedChatWidget;