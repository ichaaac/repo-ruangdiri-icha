import React, { useState, useEffect, useRef, useCallback } from "react";

// Attachment Preview Modal Component
const AttachmentPreviewModal = ({ isOpen, onClose, onSend, attachments, setAttachments }) => {
  const [caption, setCaption] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const handleSend = () => {
    onSend(attachments, caption);
    setCaption("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Preview Attachment</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative border rounded-lg p-2">
                {attachment.type === 'image' ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="w-full h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                    <span className="material-icons text-gray-400 text-4xl">description</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{attachment.name}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add more files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#488BBA] file:text-white hover:file:bg-[#3a7399]"
            />
          </div>
        </div>
        
        <div className="p-4 border-t">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full p-2 border rounded-lg resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-[#488BBA] text-white rounded-lg hover:bg-[#3a7399]"
            >
              Send {attachments.length} file{attachments.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Emoji Picker Component (Mockup)
const EmojiPicker = ({ isOpen, onClose, onEmojiSelect }) => {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-4 w-64 z-50">
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="text-xl hover:bg-gray-100 rounded p-1 text-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};


// Search Bar Component
const SearchBar = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="flex gap-2 items-center px-3.5 py-px bg-white rounded-md border-solid border-[0.5px] border-zinc-500 h-[31px] w-[308px] max-sm:w-[280px]">
      <span className="material-icons text-zinc-500" style={{ fontSize: "14px" }}>
        search
      </span>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Cari....."
        className="text-xs font-thin leading-5 text-zinc-500 bg-transparent border-none outline-none flex-1"
      />
    </div>
  );
};

// Conversation Item Component
const ConversationItem = ({ conversation, isSelected, onClick }) => {
  return (
    <div
      className={`p-2.5 cursor-pointer transition-colors ${
        isSelected ? "bg-[#E2F2FF]" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex gap-2.5 items-center px-1.5 py-0">
        <div className="w-[37px] h-[37px] rounded-full bg-gray-300 flex items-center justify-center">
          <span className="material-icons text-gray-600" style={{ fontSize: "20px" }}>
            person
          </span>
        </div>
        <div className="flex flex-col gap-2 w-[261px]">
          <div className="flex justify-between items-end">
            <h3 className="text-base font-bold text-neutral-600 max-sm:text-sm">
              {conversation.name}
            </h3>
            <time className="text-xs font-light text-center text-zinc-500">
              {conversation.time}
            </time>
          </div>
          <p className="text-xs font-light text-zinc-500 truncate">
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

// Conversation List Component with Infinite Scroll
const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onConversationSelect,
  onLoadMore,
  hasMore,
  loading
}) => {
  const [displayedConversations, setDisplayedConversations] = useState([]);
  const observerRef = useRef();
  const loadingRef = useRef();

  useEffect(() => {
    setDisplayedConversations(conversations.slice(0, 10));
  }, [conversations]);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      const currentLength = displayedConversations.length;
      const newConversations = conversations.slice(0, currentLength + 10);
      setDisplayedConversations(newConversations);
      onLoadMore?.();
    }
  }, [displayedConversations.length, conversations, hasMore, loading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 1.0,
    });

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [handleObserver]);

  return (
    <div className="overflow-y-auto flex-1">
      {displayedConversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedConversation?.id === conversation.id}
          onClick={() => onConversationSelect(conversation)}
        />
      ))}
      
      {hasMore && (
        <div 
          ref={loadingRef}
          className="p-4 text-center text-gray-500"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#488BBA]"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <div ref={observerRef}>Load more conversations...</div>
          )}
        </div>
      )}
    </div>
  );
};

// Chat Sidebar Component
const ChatSidebar = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  conversations,
  selectedConversation,
  onConversationSelect,
  onLoadMore,
  hasMore,
  loading
}) => {
  return (
    <aside className="flex flex-col h-screen bg-white border-solid border-r-[0.25px] border-r-zinc-500 w-[355px] max-md:w-full max-md:h-[40vh] max-sm:h-[35vh]">
      <div className="flex justify-center py-5">
        <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />
      </div>
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onConversationSelect={onConversationSelect}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loading={loading}
      />
    </aside>
  );
};

// Chat Fallback Component (WhatsApp style)
const ChatFallback = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
      <div className="mb-8">
        <div className="w-32 h-32 bg-[#488BBA] bg-opacity-10 rounded-full flex items-center justify-center mb-6">
          <span className="material-icons text-[#488BBA] text-6xl">chat</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Selamat datang di RuangDiri Chat
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Pilih percakapan dari sidebar untuk memulai chat dengan konselor atau teman Anda.
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-icons text-green-500">lock</span>
          <span className="font-medium text-gray-800">End-to-end encrypted</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Pesan Anda dilindungi dengan enkripsi end-to-end. Hanya Anda dan penerima yang dapat membaca pesan yang dikirim dalam chat ini.
        </p>
        <div className="mt-4 pt-4 border-t">
          <button 
            onClick={() => navigator.clipboard?.writeText('Chat Anda diamankan dengan enkripsi end-to-end')}
            className="text-[#488BBA] text-sm hover:underline"
          >
            Salin teks keamanan
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Top Bar Component
const ChatTopBar = ({ selectedConversation }) => {
  if (!selectedConversation) return null;

  return (
    <header className="flex flex-col justify-center items-start px-5 py-3 w-full bg-white border-solid border-y-[0.25px] border-y-zinc-500 h-[70px]">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-5 items-center">
          <div className="w-[45px] h-[45px] rounded-full bg-gray-300 flex items-center justify-center">
            <span className="material-icons text-gray-600" style={{ fontSize: "24px" }}>
              person
            </span>
          </div>
          <div className="flex flex-col gap-2 justify-center items-start">
            <h2 className="text-xl font-bold text-[#488BBA] max-sm:text-lg">
              {selectedConversation.name}
            </h2>
            <p className="text-xs font-light text-center text-zinc-500">
              Konseling Baru
            </p>
          </div>
        </div>
        <button className="p-2">
          <span className="material-icons text-zinc-500" style={{ fontSize: "24px" }}>
            more_horiz
          </span>
        </button>
      </div>
    </header>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isUser, selectedConversation }) => {
  return (
    <div className={`flex flex-col gap-2.5 items-start self-stretch ${isUser ? "items-end" : ""}`}>
      <div className={`flex gap-2 items-start ${isUser ? "flex-row-reverse" : ""}`}>
        {!isUser && (
          <div className="w-[26px] h-[54px] flex items-center">
            <div className="w-[26px] h-[26px] rounded-full bg-[#488BBA] flex items-center justify-center">
              <span className="material-icons text-white" style={{ fontSize: "14px" }}>
                person
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1.5 items-start">
          <p className="text-xs font-light text-zinc-500">
            {isUser ? "You" : selectedConversation?.name || "Antony Martial"}
          </p>
          <div className={`flex gap-2.5 items-center px-4 py-3 bg-white rounded-3xl max-w-md ${
            isUser ? "bg-[#E2F2FF]" : ""
          }`}>
            {message.type === 'text' && (
              <p className="text-sm leading-5 text-neutral-600 max-sm:text-sm">
                {message.text}
              </p>
            )}
            {message.type === 'attachment' && (
              <div className="space-y-2">
                {message.attachments?.map((attachment, index) => (
                  <div key={index} className="relative">
                    {attachment.type === 'image' ? (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="max-w-xs rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                        <span className="material-icons text-gray-500">description</span>
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                    )}
                  </div>
                ))}
                {message.caption && (
                  <p className="text-sm leading-5 text-neutral-600 max-sm:text-sm">
                    {message.caption}
                  </p>
                )}
              </div>
            )}
          </div>
          <time className="text-xs font-light text-zinc-500">
            {message.time}
          </time>
        </div>
      </div>
    </div>
  );
};

// Messages Area Component with Infinite Scroll
const MessagesArea = ({ messages, selectedConversation, onLoadMoreMessages, hasMoreMessages, loadingMessages }) => {
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMoreMessages && !loadingMessages) {
      onLoadMoreMessages?.();
    }
  }, [hasMoreMessages, loadingMessages, onLoadMoreMessages]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 1.0,
    });

    if (messagesStartRef.current) observer.observe(messagesStartRef.current);

    return () => {
      if (messagesStartRef.current) observer.unobserve(messagesStartRef.current);
    };
  }, [handleObserver]);

  if (!selectedConversation) {
    return <ChatFallback />;
  }

  return (
    <div className="overflow-y-auto flex-1 bg-zinc-100">
      <div className="flex flex-col gap-4 items-center px-5 py-4 max-w-4xl mx-auto">
        {hasMoreMessages && (
          <div 
            ref={messagesStartRef}
            className="p-4 text-center text-gray-500 w-full"
          >
            {loadingMessages ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#488BBA]"></div>
                <span className="ml-2">Loading older messages...</span>
              </div>
            ) : (
              "Scroll up to load older messages"
            )}
          </div>
        )}
        
        <p className="self-stretch text-xs font-light leading-5 text-center text-zinc-500">
          Hari ini
        </p>
        <div className="flex flex-col gap-4 items-start self-stretch">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.isUser}
              selectedConversation={selectedConversation}
            />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Message Input Component
const MessageInput = ({ 
  messageText, 
  onMessageChange, 
  onSendMessage, 
  onAttachmentClick,
  selectedConversation 
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim() && selectedConversation) {
      onSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newText = messageText.slice(0, start) + emoji + messageText.slice(end);
      onMessageChange(newText);
      
      // Reset cursor position
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    }
  };

  if (!selectedConversation) {
    return null;
  }

  return (
    <footer className="flex flex-col gap-2.5 items-start px-3.5 py-5 w-full bg-white border-solid border-y-[0.25px] border-y-zinc-500 h-[127px]">
      <form onSubmit={handleSubmit} className="flex flex-col justify-between items-start w-full h-[88px]">
        <textarea
          ref={inputRef}
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Type a message here...."
          className="text-base leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none w-full flex-1"
          rows={2}
        />
        <div className="flex justify-between items-center self-stretch">
          <div className="flex gap-4 relative">
            <button type="button" onClick={onAttachmentClick} className="p-2">
              <span className="material-icons text-gray-600" style={{ fontSize: "20px" }}>
                attach_file
              </span>
            </button>
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="p-2 relative"
            >
              <span className="material-icons text-gray-600" style={{ fontSize: "20px" }}>
                sentiment_satisfied_alt
              </span>
            </button>
            <EmojiPicker 
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={handleEmojiSelect}
            />
          </div>
          <button type="submit" className="p-2">
            <span className="material-icons text-[#488BBA]" style={{ fontSize: "20px" }}>
              send
            </span>
          </button>
        </div>
      </form>
    </footer>
  );
};

// Chat Main Component
const ChatMain = ({
  selectedConversation,
  messages,
  messageText,
  onMessageChange,
  onSendMessage,
  onAttachmentClick,
  onLoadMoreMessages,
  hasMoreMessages,
  loadingMessages
}) => {
  return (
    <main className="flex flex-col flex-1 h-screen max-md:h-[60vh] max-sm:h-[65vh]">
      <ChatTopBar selectedConversation={selectedConversation} />
      <MessagesArea 
        messages={messages} 
        selectedConversation={selectedConversation}
        onLoadMoreMessages={onLoadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        loadingMessages={loadingMessages}
      />
      <MessageInput
        messageText={messageText}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        onAttachmentClick={onAttachmentClick}
        selectedConversation={selectedConversation}
      />
    </main>
  );
};

// Main Chat Page Component
const ChatPage = () => {
  const [activeTab, setActiveTab] = useState("umum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Mock data for conversations - Extended for infinite scroll demo
  const generateConversations = (count = 50) => {
    const baseConversations = [
      "Antony Martial", "Reyhan Athar Rahman", "Zayn Alfarizqi Putra", "Arkan Maulana Malik",
      "Zahira Putri Azzahra", "Nadia Fathia", "Fajar Pratama", "Siti Aisya", "Daniar Rafi", "Ilham Zidan"
    ];
    
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: baseConversations[index % baseConversations.length] + (index > 9 ? ` ${Math.floor(index / 10) + 1}` : ''),
      lastMessage: index % 3 === 0 ? "You : Chat with Team Ruang Diri" : "Lorem Ipsum Dolor Sit Amet",
      time: `${String(9 - Math.floor(index / 6)).padStart(2, '0')}.${String(50 - (index % 6) * 10).padStart(2, '0')}`
    }));
  };

  const [conversations] = useState(generateConversations(50));

  // Generate messages for selected conversation
  const generateMessages = (conversationId) => {
    const baseMessages = [
      {
        text: "Hi There! i'm your assistant\nWhat would you like to discuss?",
        isUser: false
      },
      {
        text: "Chat with Team RuangDiri",
        isUser: true
      },
      {
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\neiusmod tempor incididunt ut labore et dolore magna aliqua",
        isUser: false
      },
      {
        text: "t enim ad minim veniam, quis nostrud exercitation\nullamco laboris nisi ut aliquip ex ea commodo consequat.",
        isUser: true
      },
      {
        text: "Duis aute irure dolor in reprehenderit in\nvoluptate velit esse cillum dolore eu fugiat nulla pariatur",
        isUser: false
      }
    ];

    return baseMessages.map((msg, index) => ({
      id: `${conversationId}-${index + 1}`,
      type: 'text',
      text: msg.text,
      time: `${String(9 + Math.floor(index / 2)).padStart(2, '0')}.${String(20 + (index % 2) * 30).padStart(2, '0')}`,
      isUser: msg.isUser
    }));
  };

  const messages = selectedConversation ? generateMessages(selectedConversation.id) : [];

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const handleSendAttachment = (attachmentList, caption) => {
    if (attachmentList.length > 0 && selectedConversation) {
      console.log("Sending attachments:", attachmentList, "with caption:", caption);
      setAttachments([]);
      setShowAttachmentModal(false);
    }
  };

  const handleAttachmentClick = () => {
    setShowAttachmentModal(true);
  };

  const handleLoadMore = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // For demo, stop loading after some scrolls
      if (conversations.length >= 50) {
        setHasMore(false);
      }
    }, 1000);
  };

  const handleLoadMoreMessages = () => {
    setLoadingMessages(true);
    // Simulate API call
    setTimeout(() => {
      setLoadingMessages(false);
      // For demo, stop loading after some scrolls
      setHasMoreMessages(false);
    }, 1000);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="flex relative bg-white max-md:flex-col"
      style={{ 
        width: 'calc(100vw - 46px)', 
        height: '100vh',
        marginTop: '46px',
        marginRight: '46px'
      }}
    >
      <ChatSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        onConversationSelect={setSelectedConversation}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
      />
      <ChatMain
        selectedConversation={selectedConversation}
        messages={messages}
        messageText={messageText}
        onMessageChange={setMessageText}
        onSendMessage={handleSendMessage}
        onAttachmentClick={handleAttachmentClick}
        onLoadMoreMessages={handleLoadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        loadingMessages={loadingMessages}
      />
      
      <AttachmentPreviewModal
        isOpen={showAttachmentModal}
        onClose={() => {
          setShowAttachmentModal(false);
          setAttachments([]);
        }}
        onSend={handleSendAttachment}
        attachments={attachments}
        setAttachments={setAttachments}
      />
    </div>
  );
};

export default ChatPage;