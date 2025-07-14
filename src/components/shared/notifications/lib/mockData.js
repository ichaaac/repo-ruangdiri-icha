// src/components/shared/notifications/lib/mockData.js - Temporary untuk development

// src/components/shared/notifications/lib/mockData.js - Temporary untuk development

/**
 * Mock data untuk development ketika backend belum siap
 */
export const mockNotifications = [
  {
    id: '1',
    title: 'Kamu telah membuat jadwal baru untuk Selasa 8 Juli 2025',
    message: 'Sesi Konseling Baru',
    type: 'schedule_created',
    status: 'sent',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Kamu sudah mengubah password kamu',
    message: null,
    type: 'system_announcement',
    status: 'sent',
    isRead: true,
    readAt: new Date(Date.now() - 60000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    title: 'Kamu telah login di perangkat berbeda',
    message: null,
    type: 'system_announcement',
    status: 'sent',
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    title: 'Siswa Valentino membatalkan jadwal pada 11 Juli 2025 jam 13:00',
    message: 'Pembatalan Konseling',
    type: 'schedule_deleted',
    status: 'sent',
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: '5',
    title: 'Kamu telah mengirim Laporan Berisiko ke email kamu',
    message: null,
    type: 'system_announcement',
    status: 'sent',
    isRead: true,
    readAt: new Date(Date.now() - 120000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  }
]

export const mockUnreadCount = { count: 3 }

/**
 * Check if we should use mock data (development mode)
 * TEMPORARY: Always use mock until backend validation is fixed
 */
export const shouldUseMockData = () => {
  // Force mock mode until backend API is ready
  return true
  
  // Original logic (uncomment when backend is ready):
  // return import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true' || 
  //        import.meta.env.NODE_ENV === 'development'
}