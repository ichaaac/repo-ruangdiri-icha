import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { CHAT_TERMS } from '@/data/dummyBookingChat';
import { useBooking } from '@/components/shared/booking/hooks/useBooking';

// ─── Constants ───
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const formatDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
};
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getStartDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };

const FONT = 'Plus Jakarta Sans, sans-serif';

// ─── SVG Icons ───
const CalendarIcon = ({ color = '#2F80ED', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M8 2V5" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2V5" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 9.08984H20.5" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.6947 13.6992H15.7037" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.6947 16.6992H15.7037" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.9955 13.6992H12.0045" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.9955 16.6992H12.0045" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.29431 13.6992H8.30329" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.29431 16.6992H8.30329" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon = ({ color = '#488BBA', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.9946 16H12.0036" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = ({ color = '#9CA3AF', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19.92 8.95L13.4 15.47C12.63 16.24 11.37 16.24 10.6 15.47L4.08 8.95" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUpIcon = ({ color = '#9CA3AF', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4.08 15.05L10.6 8.53C11.37 7.76 12.63 7.76 13.4 8.53L19.92 15.05" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = ({ color = '#9CA3AF', size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 22L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentIcon = ({ color = '#488BBA', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip_doc)">
      <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs><clipPath id="clip_doc"><rect width="24" height="24" fill="white"/></clipPath></defs>
  </svg>
);

const ClipboardIcon = ({ color = '#E8655B', size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip_clip)">
      <path d="M8 12.1992H15" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16.1992H12.38" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4.01953C19.33 4.19953 21 5.42953 21 9.99953V15.9995C21 19.9995 20 21.9995 15 21.9995H9C4 21.9995 3 19.9995 3 15.9995V9.99953C3 5.43953 4.67 4.19953 8 4.01953" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs><clipPath id="clip_clip"><rect width="24" height="24" fill="white"/></clipPath></defs>
  </svg>
);

// ─── Section Label ───
const SectionLabel = ({ icon, label, required, iconBg = '#DAF7FF' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 6, backgroundColor: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <span style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', fontFamily: FONT }}>
      {label}
      {required && <span style={{ color: '#E8655B' }}> *</span>}
    </span>
  </div>
);

// ─── Konseling Dropdown ───
const KONSELING_OPTIONS = [
  { value: 'luring', label: 'Luring', enabled: false },
  { value: 'daring', label: 'Daring', enabled: false },
  { value: 'chat', label: 'Chat', enabled: true },
];

const KonselingDropdown = ({ value }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = KONSELING_OPTIONS.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', height: 48, borderRadius: 12,
          border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontFamily: FONT, fontSize: 14, color: '#374151',
        }}
      >
        <span>{selected?.label || 'Pilih'}</span>
        {open ? <ChevronUpIcon color="#9CA3AF" size={18} /> : <ChevronDownIcon color="#9CA3AF" size={18} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          width: 247, borderRadius: 12,
          border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 20,
          padding: '16px 8px',
        }}>
          {KONSELING_OPTIONS.map(opt => (
            <div
              key={opt.value}
              onClick={() => { if (opt.enabled) setOpen(false); }}
              style={{
                padding: '8px 8px', fontSize: 14, color: '#374151', fontFamily: FONT,
                cursor: opt.enabled ? 'pointer' : 'not-allowed',
                opacity: opt.enabled ? 1 : 0.5,
                borderRadius: 6,
              }}
              onMouseEnter={(e) => { if (opt.enabled) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Calendar Popup ───
const DropdownArrow = ({ color = '#E8655B', size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19.92 8.95L13.4 15.47C12.63 16.24 11.37 16.24 10.6 15.47L4.08 8.95" stroke={color} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarPopup = ({ selectedDate, onSelect, onClose }) => {
  const now = new Date();
  const [month, setMonth] = useState(selectedDate ? parseInt(selectedDate.split('-')[1]) - 1 : now.getMonth());
  const [year, setYear] = useState(selectedDate ? parseInt(selectedDate.split('-')[0]) : now.getFullYear());
  const [temp, setTemp] = useState(selectedDate || '');
  const [hovered, setHovered] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const days = getDaysInMonth(year, month);
  const start = getStartDay(year, month);
  const prevDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  const prevMonth = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = [];
  for (let i = 0; i < start; i++) cells.push({ d: prevDays - start + 1 + i, cur: false });
  for (let i = 1; i <= days; i++) cells.push({ d: i, cur: true });
  const rem = 7 - (cells.length % 7);
  if (rem < 7) for (let i = 1; i <= rem; i++) cells.push({ d: i, cur: false });

  const yearOptions = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 2; y++) yearOptions.push(y);

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
      width: 340, borderRadius: 16,
      boxShadow: '0px 12px 32px rgba(16, 24, 40, 0.12)',
      backgroundColor: '#FFFFFF', overflow: 'hidden', fontFamily: FONT,
      paddingBottom: 16,
    }}>
      {/* ── Header (blue) with Month/Year + Day names ── */}
      <div style={{
        backgroundColor: '#DFF4FA',
        borderRadius: '16px 16px 0 0',
        padding: '20px 24px 12px',
      }}>
        {/* Month & Year - centered, clickable dropdowns */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
          marginBottom: 16, position: 'relative',
        }}>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => { setShowMonthPicker(p => !p); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 20, fontWeight: 600, color: '#1D2939', lineHeight: '28px' }}>
                {MONTHS_EN[month]}
              </span>
              <DropdownArrow color="#E8655B" size={10} />
            </div>
            {showMonthPicker && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 4, zIndex: 60, backgroundColor: '#FFFFFF', borderRadius: 12,
                boxShadow: '0px 8px 24px rgba(16, 24, 40, 0.15)', padding: 8,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 220,
              }}>
                {MONTHS_EN.map((m, i) => {
                  const isPastMonth = year === now.getFullYear() && i < now.getMonth();
                  return (
                    <div
                      key={m}
                      onClick={() => { if (!isPastMonth) { setMonth(i); setShowMonthPicker(false); } }}
                      style={{
                        padding: '8px 4px', borderRadius: 8, textAlign: 'center',
                        fontSize: 13, fontWeight: i === month ? 600 : 400,
                        cursor: isPastMonth ? 'not-allowed' : 'pointer',
                        backgroundColor: i === month ? '#42C1E3' : 'transparent',
                        color: isPastMonth ? '#D0D5DD' : i === month ? '#FFFFFF' : '#1D2939',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={e => { if (i !== month && !isPastMonth) e.currentTarget.style.backgroundColor = '#E0F7FD'; }}
                      onMouseLeave={e => { if (i !== month) e.currentTarget.style.backgroundColor = i === month ? '#42C1E3' : 'transparent'; }}
                    >{m.slice(0, 3)}</div>
                  );
                })}
              </div>
            )}
          </div>

          <span style={{ fontSize: 20, fontWeight: 600, color: '#1D2939', lineHeight: '28px' }}>
            {year}
          </span>
        </div>

        {/* Day names - inside blue header */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        }}>
          {DAY_HEADERS.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 14, fontWeight: 500,
              color: '#667085', lineHeight: '20px',
            }}>{d}</div>
          ))}
        </div>
      </div>

      {/* ── Days grid (340 Fill x 204 Hug) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        rowGap: 4, columnGap: 0, padding: '12px 24px 8px',
      }}>
        {cells.map((c, i) => {
          const ds = c.cur ? `${year}-${String(month + 1).padStart(2, '0')}-${String(c.d).padStart(2, '0')}` : '';
          const sel = c.cur && ds === temp;
          const isHovered = c.cur && ds === hovered && !sel;

          return (
            <div
              key={i}
              onClick={() => c.cur && setTemp(ds)}
              onMouseEnter={() => c.cur && setHovered(ds)}
              onMouseLeave={() => setHovered('')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 36, cursor: c.cur ? 'pointer' : 'default',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: sel ? '#42C1E3' : isHovered ? '#E0F7FD' : 'transparent',
                color: sel ? '#FFFFFF' : !c.cur ? '#D0D5DD' : '#1D2939',
                fontSize: 14, fontWeight: 400,
                transition: 'background-color 0.15s, color 0.15s',
              }}>
                {c.d}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer buttons - centered ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 16, marginTop: 16, padding: '0 24px',
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 500, color: '#F04438', fontFamily: FONT,
          height: 48, padding: '0 20px',
        }}>Cancel</button>
        <button onClick={() => { if (temp) onSelect(temp); onClose(); }} style={{
          padding: '0 28px', height: 48, borderRadius: 12,
          backgroundColor: '#E8655B', color: '#FFFFFF',
          fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: FONT,
        }}>Submit</button>
      </div>
    </div>
  );
};

// ─── Time Picker Popup (Figma-matched) ───
const TimePickerPopup = ({ timeSlots, selectedSlot, onSelect, onClose, loading }) => {
  const [search, setSearch] = useState('');

  const formatTime = (slot) => {
    const start = slot.startTime.replace(':', '.');
    const end = slot.endTime.replace(':', '.');
    return `${start} - ${end} WIB`;
  };

  const filtered = timeSlots.filter(s =>
    formatTime(s).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
      width: 247, maxHeight: 300, borderRadius: 12,
      border: '1px solid #B5BBC4', backgroundColor: '#FDFEFF',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: FONT,
      padding: '16px 12px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Search bar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)', display: 'flex',
        }}>
          <SearchIcon color="#1F2937" size={16} />
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search"
          style={{
            width: '100%', height: 36, borderRadius: 999,
            border: '1px solid #B5BBC4', padding: '8px 12px 8px 36px',
            fontSize: 14, color: '#374151', outline: 'none', fontFamily: FONT,
            boxSizing: 'border-box', backgroundColor: 'transparent',
          }}
        />
      </div>

      {/* Scrollable time slot list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: FONT }}>
            Memuat jadwal...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: FONT }}>
            Tidak ada slot waktu
          </div>
        ) : filtered.map(slot => (
          <div
            key={slot.uniqueId}
            onClick={() => { if (slot.available) { onSelect(slot); onClose(); } }}
            style={{
              padding: '8px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: slot.available ? 'pointer' : 'not-allowed',
              borderRadius: 6,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { if (slot.available) e.currentTarget.style.backgroundColor = '#F5FAFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{
              fontSize: 12, fontWeight: slot.available ? 600 : 400,
              color: slot.available ? '#1F2937' : '#9CA3AF',
              lineHeight: '140%', fontFamily: FONT,
            }}>{formatTime(slot)}</span>
            <span style={{
              fontSize: 12, fontWeight: 400,
              color: slot.available ? '#008236' : '#D1293D',
              lineHeight: '140%', fontFamily: FONT,
            }}>{slot.available ? 'Tersedia' : 'Tidak Tersedia'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───
const BookingChatPage = () => {
  const navigate = useNavigate();
  const { userType = 'student' } = useOutletContext() || {};

  // Backend integration for time slots
  const booking = useBooking(userType);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dateRef = useRef(null);
  const timeRef = useRef(null);

  const availableTimeSlots = booking.timeSlots || [];
  const isTimeSlotsLoading = booking.loading.timeSlots;
  const isFormValid = selectedDate && selectedTimeSlot;

  useEffect(() => { setSelectedTimeSlot(null); }, [selectedDate]);

  // Sync method to "chat" on mount (required by booking.handleBookingSubmit)
  useEffect(() => {
    booking.handleMethodSelection({ id: 'chat', name: 'Chat' });
  }, [booking.handleMethodSelection]);

  // Sync local selectedTimeSlot → booking hook (required by booking.handleBookingSubmit)
  useEffect(() => {
    if (selectedTimeSlot) {
      booking.handleTimeSlotSelection(selectedTimeSlot);
    }
  }, [selectedTimeSlot, booking.handleTimeSlotSelection]);

  // Sync local problemDescription → booking hook notes (required by booking.handleBookingSubmit)
  useEffect(() => {
    booking.setNotes(problemDescription);
  }, [problemDescription, booking.setNotes]);

  // Click outside handlers
  useEffect(() => {
    const handler = (e) => {
      if (showCalendar && dateRef.current && !dateRef.current.contains(e.target)) setShowCalendar(false);
      if (showTimePicker && timeRef.current && !timeRef.current.contains(e.target)) setShowTimePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar, showTimePicker]);

  const handleCancel = () => navigate(`/user/${userType}/booking-session`);
  const handleSubmit = async () => {
    if (!isFormValid) return;

    // Validate psychologistId before submit
    if (!selectedTimeSlot?.psychologistId &&
        (!selectedTimeSlot?.availablePsychologistIds || selectedTimeSlot.availablePsychologistIds.length === 0)) {
      console.error('Psychologist ID is missing from selected time slot');
      return;
    }

    try {
      const result = await booking.handleBookingSubmit();

      // Chat booking with session created → redirect to chat
      if (result?.method === 'chat' && (result?.sessionId || result?.chatSessionId)) {
        if (problemDescription) {
          sessionStorage.setItem('chatInitialMessage', problemDescription);
        }
        navigate(`/user/${userType}/chat?sessionId=${result.sessionId || result.chatSessionId}`, {
          replace: true,
        });
        return;
      }

      // Chat booking without session → booking-complete with warning
      if (result?.method === 'chat' && !result?.sessionId && !result?.chatSessionId) {
        navigate(`/user/${userType}/booking-complete?warning=chat_unavailable`, {
          state: { bookingResult: result },
          replace: true,
        });
        return;
      }

      // Fallback → booking-complete
      navigate(`/user/${userType}/booking-complete`, {
        state: { bookingResult: result },
        replace: true,
      });
    } catch (error) {
      console.error('Booking submission failed:', error);
    }
  };

  const selectedTimeLabel = selectedTimeSlot
    ? `${selectedTimeSlot.startTime.replace(':', '.')} - ${selectedTimeSlot.endTime.replace(':', '.')} WIB`
    : null;

  return (
    <div style={{ fontFamily: FONT }}>
      {/* ═══ SECTION 1: HEADER ═══ */}
      <div
        className="relative overflow-hidden bg-[#BBF2FF]/60"
        style={{ marginTop: -64, paddingTop: 64 }}
      >
        {/* Wave SVG - Top Left */}
        <svg className="pointer-events-none absolute top-0 left-0" width="532" height="300" viewBox="0 0 532 300" fill="none">
          <path d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z" fill="url(#wt)" fillOpacity="0.6" />
          <defs><linearGradient id="wt" x1="615" y1="-42" x2="-281.5" y2="-93" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>
        {/* Wave SVG - Bottom Right */}
        <svg className="pointer-events-none absolute right-0 bottom-0" width="930" height="300" viewBox="0 0 930 300" fill="none">
          <path d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z" fill="url(#wb)" fillOpacity="0.6" />
          <defs><linearGradient id="wb" x1="44" y1="1" x2="813.5" y2="352" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>

        {/* Header Content */}
        <div className="relative z-10 px-6 lg:px-10 pt-8 pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm mb-6" style={{ gap: 8 }}>
            <Link to={`/user/${userType}/dashboard`} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">Home</Link>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <Link to={`/user/${userType}/screening`} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">Asesmen Ruang Diri</Link>
            <span className="text-[#F59E0B] text-xs">&#9654;</span>
            <span className="text-[#1F2937] font-semibold">Booking Sesi Konseling</span>
          </nav>

          {/* Title */}
          <h1 className="font-bold text-[#434343] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, lineHeight: '110%' }}>
            Booking Sesi Konseling Chat
          </h1>
          <p className="text-base text-[#6B7280]">
            Halaman ini digunakan untuk memilih jadwal booking sesi konseling chat
          </p>
        </div>
      </div>

      {/* ═══ SECTION 2: CONTENT ═══ */}
      <div style={{ backgroundColor: '#F8FAFC', padding: '24px 24px 32px' }}>
        {/* Content Wrapper */}
        <div style={{ padding: '0' }}>

          {/* Detail Booking Card */}
          <div style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E6EEF3',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}>
            {/* Card Header */}
            <div style={{
              backgroundColor: '#ECF9FC',
              borderBottom: '1px solid #ECEEF0',
              borderRadius: '12px 12px 0 0',
              padding: '24px 32px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 6, backgroundColor: '#DAF7FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <CalendarIcon color="#2F80ED" size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0, lineHeight: '24px' }}>
                  Detail Booking
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: '20px' }}>
                  Lengkapi informasi dibawah ini
                </p>
              </div>
            </div>

            {/* Form Body */}
            <div style={{ padding: 32 }}>
              {/* Jenis Konseling - static display (dropdown disabled) */}
              <div style={{ marginBottom: 24 }}>
                <SectionLabel icon={<DocumentIcon color="#488BBA" size={16} />} label="Jenis Konseling" iconBg="#DAF7FF" />
                <div
                  style={{
                    width: '100%', height: 48, borderRadius: 12,
                    border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
                    padding: '0 16px',
                    display: 'flex', alignItems: 'center',
                    fontFamily: FONT, fontSize: 14, color: '#374151',
                  }}
                >
                  Chat
                </div>
              </div>

              {/* Pilih Tanggal & Waktu */}
              <div style={{ marginBottom: 24 }}>
                <SectionLabel icon={<CalendarIcon color="#8E5CFF" size={16} />} label="Pilih Tanggal & Waktu" required iconBg="#F3EDFF" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Date Input */}
                  <div ref={dateRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => { setShowCalendar(!showCalendar); setShowTimePicker(false); }}
                      style={{
                        width: '100%', height: 48, borderRadius: 12,
                        border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
                        padding: '0 44px 0 16px', textAlign: 'left',
                        fontSize: 14, color: selectedDate ? '#374151' : '#9CA3AF',
                        cursor: 'pointer', fontFamily: FONT,
                      }}
                    >
                      {selectedDate ? formatDate(selectedDate) : 'Pilih Tanggal'}
                    </button>
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                      <CalendarIcon color="#9CA3AF" size={18} />
                    </div>
                    {showCalendar && (
                      <CalendarPopup
                        selectedDate={selectedDate}
                        onSelect={(date) => { setSelectedDate(date); booking.handleDateSelection(date); }}
                        onClose={() => setShowCalendar(false)}
                      />
                    )}
                  </div>

                  {/* Time Input */}
                  <div ref={timeRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => { if (selectedDate) { setShowTimePicker(!showTimePicker); setShowCalendar(false); } }}
                      style={{
                        width: '100%', height: 48, borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        backgroundColor: selectedDate ? '#F9FAFB' : '#F3F4F6',
                        padding: '0 44px 0 16px', textAlign: 'left',
                        fontSize: 14, color: selectedTimeSlot ? '#374151' : '#9CA3AF',
                        cursor: selectedDate ? 'pointer' : 'not-allowed', fontFamily: FONT,
                      }}
                    >
                      {selectedTimeLabel || 'Pilih Waktu'}
                    </button>
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                      <ChevronDownIcon color="#9CA3AF" size={18} />
                    </div>
                    {showTimePicker && selectedDate && (
                      <TimePickerPopup
                        timeSlots={availableTimeSlots}
                        selectedSlot={selectedTimeSlot}
                        onSelect={(slot) => setSelectedTimeSlot(slot)}
                        onClose={() => setShowTimePicker(false)}
                        loading={isTimeSlotsLoading}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Jenis Permasalahan */}
              <div>
                <SectionLabel icon={<ClipboardIcon color="#E8655B" size={16} />} label="Jenis Permasalahan (Opsional)" iconBg="#FEEBEB" />
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Deskripsikan permasalahanmu secara singkat"
                  style={{
                    width: '100%', height: 160, borderRadius: 12,
                    border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
                    padding: 16, fontSize: 14, color: '#1F2937',
                    resize: 'none', outline: 'none', fontFamily: FONT,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Syarat & Ketentuan */}
          <div style={{
            backgroundColor: '#ECF9FC', borderRadius: 12,
            padding: '20px 24px', marginTop: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, backgroundColor: '#DAF7FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <InfoIcon color="#488BBA" size={18} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                Syarat dan Ketentuan Sesi Konseling Chat Ruang Diri:
              </span>
            </div>
            <div style={{ paddingLeft: 40 }}>
              {CHAT_TERMS.map((term, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2, transform: 'rotate(0deg)' }}>
                    <path d="M6.75 3.75L12 9L6.75 14.25" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14, color: '#6B7280', lineHeight: '160%' }}>{term}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <button
              type="button"
              onClick={handleCancel}
              className="transition-all hover:opacity-80"
              style={{
                height: 48, borderRadius: 12, fontFamily: FONT,
                backgroundColor: isFormValid ? '#FFFFFF' : '#E5E7EB',
                color: isFormValid ? '#EF4444' : '#9CA3AF',
                border: isFormValid ? '2px solid #EF4444' : '2px solid #E5E7EB',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="transition-all hover:opacity-80"
              style={{
                height: 48, borderRadius: 12, fontFamily: FONT,
                backgroundColor: isFormValid ? '#EB5757' : '#E5E7EB',
                color: isFormValid ? '#FFFFFF' : '#9CA3AF',
                border: isFormValid ? '2px solid #EB5757' : '2px solid #E5E7EB',
                fontWeight: 600, fontSize: 14,
                cursor: isFormValid ? 'pointer' : 'not-allowed',
              }}
            >
              Buat Janji
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingChatPage;
