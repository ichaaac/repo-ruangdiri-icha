export const AVAILABLE_DATES = [
  { value: '2026-02-16', label: 'Senin, 16 Februari 2026' },
  { value: '2026-02-17', label: 'Selasa, 17 Februari 2026' },
  { value: '2026-02-18', label: 'Rabu, 18 Februari 2026' },
  { value: '2026-02-19', label: 'Kamis, 19 Februari 2026' },
  { value: '2026-02-20', label: 'Jumat, 20 Februari 2026' },
  { value: '2026-02-23', label: 'Senin, 23 Februari 2026' },
  { value: '2026-02-24', label: 'Selasa, 24 Februari 2026' },
];

export const TIME_SLOTS = {
  '2026-02-16': [
    { value: '09:00-09:15', label: '09:00 - 09:15 WIB', available: true },
    { value: '10:00-10:15', label: '10:00 - 10:15 WIB', available: true },
    { value: '13:00-13:15', label: '13:00 - 13:15 WIB', available: false },
    { value: '14:00-14:15', label: '14:00 - 14:15 WIB', available: true },
  ],
  '2026-02-17': [
    { value: '09:00-09:15', label: '09:00 - 09:15 WIB', available: true },
    { value: '11:00-11:15', label: '11:00 - 11:15 WIB', available: false },
    { value: '15:00-15:15', label: '15:00 - 15:15 WIB', available: true },
  ],
  '2026-02-18': [],
  '2026-02-19': [
    { value: '09:00-09:15', label: '09:00 - 09:15 WIB', available: true },
    { value: '10:00-10:15', label: '10:00 - 10:15 WIB', available: true },
  ],
  '2026-02-20': [
    { value: '13:00-13:15', label: '13:00 - 13:15 WIB', available: true },
    { value: '14:00-14:15', label: '14:00 - 14:15 WIB', available: false },
    { value: '15:00-15:15', label: '15:00 - 15:15 WIB', available: true },
    { value: '16:00-16:15', label: '16:00 - 16:15 WIB', available: true },
  ],
  '2026-02-23': [
    { value: '09:00-09:15', label: '09:00 - 09:15 WIB', available: true },
  ],
  '2026-02-24': [
    { value: '10:00-10:15', label: '10:00 - 10:15 WIB', available: true },
    { value: '14:00-14:15', label: '14:00 - 14:15 WIB', available: false },
  ],
};

export const CHAT_TERMS = [
  'Sesi chat berlangsung selama 15 menit sesuai jadwal yang telah ditentukan.',
  'Pengguna dapat mengakses ruang chat 5 menit sebelum jadwal dimulai.',
  'Perubahan jadwal dapat dilakukan maksimal 2 jam sebelum sesi dimulai.',
  'Link akses chat akan dikirimkan 15 menit sebelum sesi dimulai.',
];
