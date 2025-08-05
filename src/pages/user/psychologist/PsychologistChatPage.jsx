// src/pages/user/psychologist/PsychologistChatPage.jsx - Halaman Chat untuk Psikolog

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const PsychologistChatPage = () => {
  const { userType } = useOutletContext();
  const [selectedClient, setSelectedClient] = useState(0); // Index of selected client
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data untuk client list - data lebih professional untuk psikolog
  const clientList = [
    {
      id: 1,
      name: 'Antony Martial',
      lastMessage: 'Terima kasih atas sesi hari ini, sangat membantu',
      time: '14.30',
      avatar: '/api/placeholder/38/37',
      status: 'Sesi Aktif',
      isActive: true,
      unreadCount: 2,
      clientType: 'Student',
      lastSession: '2024-01-20'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: 'Saya ingin menjadwalkan sesi untuk minggu depan',
      time: '12.15',
      avatar: '/api/placeholder/38/37',
      status: 'Booking Request',
      isActive: false,
      unreadCount: 1,
      clientType: 'Employee',
      lastSession: '2024-01-18'
    },
    {
      id: 3,
      name: 'Michael Chen',
      lastMessage: 'Latihan mindfulness yang diberikan sangat membantu',
      time: '10.45',
      avatar: '/api/placeholder/38/37',
      status: 'Follow-up',
      isActive: false,
      unreadCount: 0,
      clientType: 'Employee',
      lastSession: '2024-01-19'
    },
    {
      id: 4,
      name: 'Emma Davis',
      lastMessage: 'Apakah ada sesi tersedia untuk hari Jumat?',
      time: '09.20',
      avatar: '/api/placeholder/38/37',
      status: 'Scheduling',
      isActive: false,
      unreadCount: 1,
      clientType: 'Student',
      lastSession: '2024-01-15'
    },
    {
      id: 5,
      name: 'David Wilson',
      lastMessage: 'Progress report sudah saya kirim',
      time: '08.30',
      avatar: '/api/placeholder/38/37',
      status: 'Documentation',
      isActive: false,
      unreadCount: 0,
      clientType: 'Employee',
      lastSession: '2024-01-17'
    }
  ];

  // Mock data untuk messages dengan konten yang lebih professional
  const messages = [
    {
      id: 1,
      sender: 'Antony Martial',
      message: "Selamat siang dok, saya ingin bertanya tentang teknik relaksasi yang kemarin diajarkan",
      time: '14.15',
      isOwn: false,
      avatar: '/api/placeholder/26/54',
      messageType: 'text'
    },
    {
      id: 2,
      sender: 'Dr. Psikolog',
      message: "Selamat siang Antony. Tentu, apakah ada kesulitan khusus dengan teknik pernapasan yang kita pelajari?",
      time: '14.18',
      isOwn: true,
      messageType: 'text'
    },
    {
      id: 3,
      sender: 'Antony Martial',
      message: "Saya masih merasa sulit fokus saat melakukan teknik 4-7-8. Apakah ada variasi lain yang bisa dicoba?",
      time: '14.20',
      isOwn: false,
      avatar: '/api/placeholder/26/54',
      messageType: 'text'
    },
    {
      id: 4,
      sender: 'Dr. Psikolog',
      message: "Baik, mari kita coba teknik yang lebih sederhana. Coba teknik 4-4-4 dulu - tarik napas 4 detik, tahan 4 detik, buang 4 detik. Ini lebih mudah untuk pemula.",
      time: '14.25',
      isOwn: true,
      messageType: 'text'
    },
    {
      id: 5,
      sender: 'Antony Martial',
      message: "Terima kasih dok, akan saya coba. Apakah ada waktu khusus yang disarankan untuk latihan?",
      time: '14.28',
      isOwn: false,
      avatar: '/api/placeholder/26/54',
      messageType: 'text'
    }
  ];

  const filteredClients = clientList.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentClient = clientList[selectedClient];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would typically send the message to your backend
      console.log('Sending message to client:', currentClient.name, message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Sesi Aktif':
        return 'bg-green-100 text-green-800';
      case 'Booking Request':
        return 'bg-blue-100 text-blue-800';
      case 'Follow-up':
        return 'bg-yellow-100 text-yellow-800';
      case 'Scheduling':
        return 'bg-purple-100 text-purple-800';
      case 'Documentation':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientTypeColor = (type) => {
    return type === 'Student' ? 'text-blue-600' : 'text-green-600';
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Client List Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
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
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.2 14.25L8.475 9.525C8.1 9.825 7.66875 10.0625 7.18125 10.2375C6.69375 10.4125 6.175 10.5 5.625 10.5C4.2625 10.5 3.10938 10.0281 2.16563 9.08438C1.22188 8.14062 0.75 6.9875 0.75 5.625C0.75 4.2625 1.22188 3.10938 2.16563 2.16563C3.10938 1.22188 4.2625 0.75 5.625 0.75C6.9875 0.75 8.14062 1.22188 9.08438 2.16563C10.0281 3.10938 10.5 4.2625 10.5 5.625C10.5 6.175 10.4125 6.69375 10.2375 7.18125C10.0625 7.66875 9.825 8.1 9.525 8.475L14.25 13.2L13.2 14.25ZM5.625 9C6.5625 9 7.35938 8.67188 8.01562 8.01562C8.67188 7.35938 9 6.5625 9 5.625C9 4.6875 8.67188 3.89062 8.01562 3.23438C7.35938 2.57812 6.5625 2.25 5.625 2.25C4.6875 2.25 3.89062 2.57812 3.23438 3.23438C2.57812 3.89062 2.25 4.6875 2.25 5.625C2.25 6.5625 2.57812 7.35938 3.23438 8.01562C3.89062 8.67188 4.6875 9 5.625 9Z" fill="#8B8B8B"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari klien....."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-md border border-gray-300 text-xs font-thin font-['Public_Sans'] focus:outline-none focus:ring-2 focus:ring-[#488BBE] focus:border-transparent"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-[#488BBE]">{clientList.length}</div>
                <div className="text-gray-500">Total Klien</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">
                  {clientList.filter(c => c.unreadCount > 0).length}
                </div>
                <div className="text-gray-500">Unread</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  {clientList.filter(c => c.status === 'Sesi Aktif').length}
                </div>
                <div className="text-gray-500">Aktif</div>
              </div>
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto">
          {filteredClients.map((client, index) => (
            <div
              key={client.id}
              className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                client.isActive ? 'bg-sky-50 border-l-4 border-l-[#488BBE]' : ''
              }`}
              onClick={() => setSelectedClient(index)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM0ODhCQkUiLz4KPHRleHQgeD0iMjQiIHk9IjI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiI+JHtjbGllbnQubmFtZS5zcGxpdCgnICcpWzBdWzBdfTwvdGV4dD4KPC9zdmc+`;
                      }}
                    />
                  </div>
                  {client.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {client.unreadCount > 9 ? '9+' : client.unreadCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-semibold text-gray-800 truncate">
                        {client.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`${getClientTypeColor(client.clientType)} font-medium`}>
                          {client.clientType}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          Last: {client.lastSession}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {client.time}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">
                    {client.lastMessage}
                  </p>
                  
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-20 px-5 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              <img
                src={currentClient?.avatar || '/api/placeholder/48/48'}
                alt={currentClient?.name || 'Client'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM0ODhCQkUiLz4KPHRleHQgeD0iMjQiIHk9IjI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiI+JHtjdXJyZW50Q2xpZW50Py5uYW1lLnNwbGl0KCcgJylbMF1bMF0gfHwgJ0MnfTwvdGV4dD4KPC9zdmc+`;
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#488BBE] font-['Public_Sans']">
                  {currentClient?.name || 'Select a client'}
                </h2>
                {currentClient && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(currentClient.status)}`}>
                    {currentClient.status}
                  </span>
                )}
              </div>
              {currentClient && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={getClientTypeColor(currentClient.clientType)}>
                    {currentClient.clientType}
                  </span>
                  <span>•</span>
                  <span>Last session: {currentClient.lastSession}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Client Actions */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Schedule Session">
              <span className="material-icons text-gray-600">event</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Client Notes">
              <span className="material-icons text-gray-600">note_add</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="More Options">
              <svg width="31" height="8" viewBox="0 0 31 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3.5" cy="4" r="3.5" fill="#8B8B8B"/>
                <circle cx="15.5" cy="4" r="3.5" fill="#8B8B8B"/>
                <circle cx="27.5" cy="4" r="3.5" fill="#8B8B8B"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-5">
            <div className="flex flex-col gap-4">
              <div className="text-center text-xs font-light text-[#8B8B8B] font-['Public_Sans'] mb-4">
                Sesi hari ini - {new Date().toLocaleDateString('id-ID')}
              </div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                  {msg.isOwn ? (
                    // Psychologist's message (right side)
                    <div className="flex flex-col items-end gap-1 max-w-md">
                      <div className="text-xs font-light text-[#8B8B8B] font-['Public_Sans']">
                        Anda
                      </div>
                      <div className="px-4 py-3 bg-[#488BBE] text-white rounded-lg rounded-br-sm">
                        <div className="text-sm font-normal font-['Public_Sans'] leading-relaxed">
                          {msg.message}
                        </div>
                      </div>
                      <div className="text-xs font-light text-[#8B8B8B] font-['Public_Sans']">
                        {msg.time}
                      </div>
                    </div>
                  ) : (
                    // Client's message (left side)
                    <div className="flex items-start gap-3 max-w-md">
                      <div className="w-8 h-8 rounded-full bg-[#1E5A89] flex items-center justify-center text-white text-sm flex-shrink-0">
                        {msg.sender[0]}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-light text-[#8B8B8B] font-['Public_Sans']">
                          {msg.sender}
                        </div>
                        <div className="bg-white rounded-lg rounded-bl-sm px-4 py-3 shadow-sm">
                          <div className="text-sm font-normal text-[#535353] font-['Public_Sans'] leading-relaxed">
                            {msg.message}
                          </div>
                        </div>
                        <div className="text-xs font-light text-[#8B8B8B] font-['Public_Sans']">
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex flex-col gap-3">
            {/* Quick Response Templates */}
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                Terima kasih sudah berbagi
              </button>
              <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                Bagaimana perasaan Anda sekarang?
              </button>
              <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                Mari kita jadwalkan sesi selanjutnya
              </button>
            </div>

            {/* Message Input */}
            <div className="flex items-end gap-3">
              <div className="flex-1 border border-gray-300 rounded-lg p-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ketik balasan profesional Anda..."
                  rows={3}
                  className="w-full resize-none border-none outline-none text-sm font-['Public_Sans']"
                />
                
                {/* Input Tools */}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded" title="Attach File">
                      <span className="material-icons text-gray-500 text-sm">attach_file</span>
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Insert Template">
                      <span className="material-icons text-gray-500 text-sm">insert_drive_file</span>
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Professional mode
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="p-3 bg-[#488BBE] hover:bg-[#3399E9] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="Send Message"
              >
                <span className="material-icons">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologistChatPage;