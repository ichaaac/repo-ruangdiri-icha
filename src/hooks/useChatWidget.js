// src/hooks/useChatWidget.js
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useChatWidget(navigate, userType = 'student') {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const faqData = useMemo(() => ([
    {
      question: 'Bagaimana keamanan data saya dilindungi?',
      answer:
        'Kami memastikan keamanan dan kerahasiaan data pribadi kamu dengan menerapkan protokol enkripsi. Kerahasiaan datamu adalah prioritas kami.',
    },
    {
      question: 'Apakah data saya akan dibagikan kepada pihak ketiga?',
      answer:
        'Kami tidak akan membagikan data kamu kepada pihak ketiga kecuali atas persetujuanmu, atau dalam kondisi paksaan keterikatan hukum yang dilakukan oleh aparatur hukum negara',
    },
    {
      question:
        'Jika saya mengalami keadaan darurat atau krisis apakah saya harus menggunakan layanan ini?',
      answer:
        'Apabila kamu atau kerabatmu menghadapi situasi darurat atau krisis yang mengancam jiwa, mohon segera hubungi layanan darurat setempat atau pergi ke unit gawat darurat terdekat. Kami belum menyediakan layanan darurat.',
    },
    {
      question:
        'Saya punya pertanyaan lain yang tidak ada di sini. Bagaimana saya bisa menghubungi Admin RuangDiri?',
      answer: 'Kamu bisa menghubungi kami di Kontak Kami',
    },
    {
      question: 'Apa yang harus saya persiapkan sebelum sesi konseling pertama?',
      answer:
        'Kamu dapat mempersiapkan diri dengan memikirkan apa yang ingin kamu diskusikan atau masalah utama yang ingin kamu atasi. Apabila kamu kebingungan, tidak perlu khawatir karena psikolog kami akan mengarahkan alur diskusi sehingga kamu merasa nyaman untuk bercerita.',
    },
    {
      question: 'Bisakah saya mengubah atau membatalkan janji temu?',
      answer:
        'Ya, kamu bisa mengubah atau membatalkan janji temu dengan menghapus janji temu di bagian detail janji temu pada platform kami',
    },
    {
      question: 'Berapa biaya layanan konseling?',
      answer:
        'Untuk informasi mengenai biaya layanan konseling, silakan lihat di Layanan Kami',
    },
    {
      question: 'Metode pembayaran apa yang diterima?',
      answer:
        'Kamu bisa membayar dengan metode QR dan transfer ke rekening Bank BNI',
    },
    {
      question: 'Bagaimana cara memulai konseling daring?',
      answer:
        'Untuk memulai konseling daring, Kamu perlu membuat akun di platform kami, memilih layanan dan psikolog/konselor yang sesuai, lalu menjadwalkan janji temu. Kamu akan menerima tautan untuk bergabung dalam sesi virtual pada waktu yang ditentukan.',
    },
  ]), []);

  const serviceOptions = useMemo(
    () => [
      { icon: 'airline_seat_recline_normal', text: 'Ruang Cerita' },
      { icon: 'content_paste_search', text: 'Lihat Hasil Skrining' },
      { icon: 'calendar_month', text: 'Buat Janji Konseling' },
      { icon: 'event_available', text: 'Lihat Jadwal Konseling' },
      { icon: 'help', text: 'FAQ (Frequently Asked Questions)' },
    ],
    []
  );

  const welcomeText =
    'Hello, roomies!\n\nSelamat datang di Ruang Bantu.\nApakah ada yang bisa kami bantu?\nUntuk mempermudah  keperluan roomies,\nkamu dapat memilih tiga opsi di bawah ini:';

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        sender: 'team',
        text: welcomeText,
        timestamp: new Date(),
        showOptions: true,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const resetChat = useCallback(() => {
    setSelectedOption(null);
    setExpandedFAQ(null);
    setMessages([]);
    setInputMessage('');
  }, []);

  const handleExpand = useCallback(() => {
    setIsOpen(false);
    navigate(`/user/${userType}/chat`);
  }, [navigate, userType]);

  const handleOptionClick = useCallback((option) => {
    setSelectedOption(option);

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: option,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const pushBot = (text, extras = {}) => {
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text,
          timestamp: new Date(),
          ...extras,
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    };

    if (option === 'FAQ (Frequently Asked Questions)') {
      pushBot('Berikut adalah pertanyaan yang sering ditanyakan:', {
        showFAQ: true,
      });
    } else if (option === 'Ruang Cerita') {
      pushBot(
        'Terima kasih telah memilih Ruang Cerita. Fitur ini sedang dalam pengembangan.'
      );
    } else if (option === 'Buat Janji Konseling') {
      pushBot(
        'Untuk booking sesi konseling, silakan hubungi admin kami melalui kontak yang tersedia. Tim kami akan membantu Anda mengatur jadwal konseling yang sesuai.'
      );
    } else if (option === 'Lihat Jadwal Konseling') {
      pushBot('Menu jadwal segera hadir.');
    } else if (option === 'Lihat Hasil Skrining') {
      pushBot('Hasil skrining akan tersedia pada menu terkait.');
    }
  }, []);

  const handleFAQClick = useCallback((index) => {
    setExpandedFAQ((prev) => (prev === index ? null : index));
  }, []);

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: 'user',
        text: inputMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage('');

      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'team',
          text: 'Terima kasih atas pesan Anda. Tim kami akan segera merespons. Untuk respon yang lebih cepat, silakan pilih salah satu opsi yang tersedia di atas.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 1000);
    }
  }, [inputMessage]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return {
    // state
    isOpen,
    setIsOpen,
    selectedOption,
    expandedFAQ,
    messages,
    inputMessage,
    setInputMessage,
    faqData,
    serviceOptions,

    // handlers
    resetChat,
    handleExpand,
    handleOptionClick,
    handleFAQClick,
    handleSendMessage,
    handleKeyPress,
  };
}

export default useChatWidget;

