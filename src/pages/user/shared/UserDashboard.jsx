import { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ComposedChart, Area, Line, YAxis, XAxis, ResponsiveContainer, ReferenceLine, Text } from 'recharts';
import { useStudentDashboard } from '../../../hooks/useStudentDashboard';
import Breadcrumb from '../../../components/shared/Breadcrumb';
import { createBookingApi } from '../../../components/shared/booking/lib/bookingApi';
import Calendar from '../../../components/shared/booking/Calendar';

// --- Chart Helpers ---

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload?.value === null || payload?.value === undefined) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#4B9BFF" stroke="#FFFFFF" strokeWidth={2} />;
};

const CustomYAxisTick = (props) => {
  const { x, y, payload } = props;
  const { value } = payload;
  let label = '';
  let color = '#64748b';

  switch (value) {
    case 1: label = 'Berisiko'; color = '#EE4266'; break;
    case 2: label = 'Pengawasan'; color = '#FFA600'; break;
    case 3: label = 'Stabil'; color = '#9BCA61'; break;
    default: return null;
  }

  return (
    <Text x={x} y={y} textAnchor="end" fill={color} fontSize={12} fontWeight={500} dominantBaseline="middle">
      {label}
    </Text>
  );
};

const CustomXAxisTick = (props) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#828898" fontSize={11} fontWeight="normal">
        {payload.value}
      </text>
    </g>
  );
};

// --- Sub-Components ---

const CalendarEmptyIcon = ({ color = '#9CA3AF', size = 24 }) => (
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

const SectionEmptyState = ({ title, subtitle, iconElement }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="flex items-center justify-center mb-4" style={{ width: 56, height: 56, borderRadius: 60, backgroundColor: '#F6F6F6', padding: 16 }}>
      {iconElement}
    </div>
    <p className="text-center mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 500, lineHeight: '140%', color: '#0F172B' }}>{title}</p>
    <p className="text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 400, lineHeight: '140%', color: '#3F4555' }}>{subtitle}</p>
  </div>
);

const emptyChartData = [
  { month: 'Jan' }, { month: 'Feb' }, { month: 'Mar' },
  { month: 'Apr' }, { month: 'May' }, { month: 'Jun' }
];

const ChartIcon = ({ color = '#E8655B', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path opacity="0.4" d="M3 22H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.59998 8.38086H4C3.45 8.38086 3 8.83086 3 9.38086V18.0009C3 18.5509 3.45 19.0009 4 19.0009H5.59998C6.14998 19.0009 6.59998 18.5509 6.59998 18.0009V9.38086C6.59998 8.83086 6.14998 8.38086 5.59998 8.38086Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.8002 5.18945H11.2002C10.6502 5.18945 10.2002 5.63945 10.2002 6.18945V17.9995C10.2002 18.5495 10.6502 18.9995 11.2002 18.9995H12.8002C13.3502 18.9995 13.8002 18.5495 13.8002 17.9995V6.18945C13.8002 5.63945 13.3502 5.18945 12.8002 5.18945Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.9999 2H18.3999C17.8499 2 17.3999 2.45 17.3999 3V18C17.3999 18.55 17.8499 19 18.3999 19H19.9999C20.5499 19 20.9999 18.55 20.9999 18V3C20.9999 2.45 20.5499 2 19.9999 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HistoryIcon = ({ color = '#E8655B', size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14.55 21.67C18.84 20.54 22 16.64 22 12C22 6.48 17.56 2 12.04 2C5.49 2 2 6.44 2 6.44M2 6.44V2.44M2 6.44H5.96" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12C2 17.52 6.48 22 12 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3"/>
    <path d="M12 8V13L14.5 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SectionHeader = ({ title, subtitle, iconBg = '#ECF9FC', iconElement, className = 'mb-4' }) => (
  <div className={`flex items-center ${className}`} style={{ gap: 12 }}>
    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 10, padding: 16, backgroundColor: iconBg }}>
      {iconElement}
    </div>
    <div>
      <h2 className="text-[#1F2937] font-semibold text-base leading-tight">{title}</h2>
      {subtitle && <p className="text-[#9CA3AF] text-xs mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const ProgressChartCard = ({ data }) => {
  const hasData = data?.some(d => d.value !== null && d.value !== undefined);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1 min-w-0 flex flex-col">
      <SectionHeader title="Grafik Progress" subtitle="Perkembangan kesehatan mental Anda" iconBg="#ECF9FC" iconElement={<ChartIcon color="#E8655B" size={24} />} />
      <div className="flex-1 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data?.length ? data : emptyChartData} margin={{ top: 10, right: 20, left: 70, bottom: 10 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <ReferenceLine y={3.5} stroke="#E5E7EB" strokeDasharray="2 2" />
            <ReferenceLine y={3} stroke="#E5E7EB" strokeDasharray="2 2" />
            <ReferenceLine y={2} stroke="#E5E7EB" strokeDasharray="2 2" />
            <ReferenceLine y={1} stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} interval={0} />
            <YAxis
              type="number"
              domain={[1, 3.5]}
              ticks={[1, 2, 3]}
              axisLine={false}
              tickLine={false}
              width={80}
              tick={<CustomYAxisTick />}
            />
            {hasData && <Area type="monotone" dataKey="value" stroke="none" fill="url(#areaGradient)" connectNulls isAnimationActive={false} />}
            {hasData && <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={<CustomDot />} activeDot={false} connectNulls isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ left: 80, right: 20 }}>
            <div className="flex flex-col items-center" style={{ backgroundColor: '#FDFEFF', border: '1px solid #ECEEF0', borderRadius: 12, padding: 20, gap: 16 }}>
              <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 60, backgroundColor: '#F6F6F6', padding: 12 }}>
                <ChartIcon color="#9CA3AF" size={24} />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 500, lineHeight: '140%', color: '#0F172B' }}>Belum ada progress perkembangan</p>
                <p className="text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 400, lineHeight: '140%', color: '#3F4555' }}>Saat ini Anda belum ada progress perkembangan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, alt, title, subtitle }) => (
  <div className="flex items-center" style={{ backgroundColor: '#ECF9FC', borderRadius: 12, padding: 12, gap: 12 }}>
    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 6, padding: 8, backgroundColor: '#DAF7FF' }}>
      <img src={icon} alt={alt} width={20} height={20} />
    </div>
    <div>
      <p className="text-sm text-[#1F2937] font-bold">{title}</p>
      <p className="text-xs text-[#9CA3AF]">{subtitle}</p>
    </div>
  </div>
);

const CounselingSessionCard = ({ session, userType, onCancelled }) => {
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const datePickerRef = useRef(null);
  const bookingApi = useMemo(() => createBookingApi(userType), [userType]);

  // Fetch available dates when reschedule modal opens
  useEffect(() => {
    if (!showReschedule) return;
    const fetchDates = async () => {
      try {
        const response = await bookingApi.getAvailableDates({});
        if (response?.status === 'success' && Array.isArray(response.data)) {
          setAvailableDates(response.data);
        }
      } catch {
        // ignore
      }
    };
    fetchDates();
  }, [showReschedule, bookingApi]);

  // Close calendar on outside click
  useEffect(() => {
    if (!showCalendar) return;
    const handleClick = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendar]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bookingApi.cancelCounseling(session.id);
      setShowCancelConfirm(false);
      // Invalidate all related queries so dashboard updates immediately
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['booking-history'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
      queryClient.invalidateQueries({ queryKey: ['psychologist-availability'] });
      onCancelled?.();
    } catch (err) {
      console.error('Cancel failed:', err);
      const msg = err?.response?.data?.message || 'Gagal membatalkan sesi. Silakan coba lagi.';
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  const openReschedule = () => {
    setRescheduleDate('');
    setSelectedSlot(null);
    setAllSlots([]);
    setRescheduleError('');
    setShowReschedule(true);
  };

  const fetchSlots = async (date) => {
    if (!date) {
      setAllSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    setRescheduleError('');
    try {
      // Use the same general availability API as booking-chat
      const response = await bookingApi.getAvailableTimeSlots({ date });
      const availabilityData = Array.isArray(response?.data) ? response.data : [];

      // Filter slots matching the selected date
      const dateSlots = availabilityData.filter(slot => slot.date === date);

      let combined = dateSlots.map(slot => {
        const isBooked = (slot.bookedPsychologists || 0) > 0;
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked,
          reason: isBooked ? 'Sudah Terbooking' : undefined,
        };
      }).sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Mark past slots for today
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      if (date === todayStr) {
        const currentHHMM = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
        combined = combined.map(s => {
          if (s.startTime?.slice(0, 5) <= currentHHMM) {
            return { ...s, isBooked: true, reason: 'Jam sudah lewat' };
          }
          return s;
        });
      }

      // Mark the current session's own slot on the same date
      if (session.startTime && session.endTime && date === session.rawDate) {
        combined = combined.map(s => {
          if (s.startTime?.slice(0, 5) === session.startTime.slice(0, 5) && s.endTime?.slice(0, 5) === session.endTime.slice(0, 5)) {
            return { ...s, isBooked: true, reason: 'Jadwal sesi saat ini' };
          }
          return s;
        });
      }

      setAllSlots(combined);
      const availableCount = combined.filter(s => !s.isBooked).length;
      if (!combined.length) {
        setRescheduleError('Psikolog tidak memiliki jadwal pada tanggal ini.');
      } else if (availableCount === 0) {
        setRescheduleError('Tidak ada slot tersedia pada tanggal ini.');
      }
    } catch {
      setAllSlots([]);
      setRescheduleError('Gagal memuat jadwal. Silakan coba lagi.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (dateStr) => {
    setRescheduleDate(dateStr);
    fetchSlots(dateStr);
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      setRescheduleError('Tanggal wajib dipilih.');
      return;
    }
    if (!selectedSlot) {
      setRescheduleError('Pilih slot waktu yang tersedia.');
      return;
    }
    setRescheduling(true);
    setRescheduleError('');
    try {
      await bookingApi.rescheduleCounselingBySchedule(session.id, {
        date: rescheduleDate,
        startTime: selectedSlot.startTime.slice(0, 5),
        endTime: selectedSlot.endTime.slice(0, 5),
      });
      setShowReschedule(false);
      // Invalidate all related queries so both dashboard and schedule update
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['booking-history'] });
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] });
      queryClient.invalidateQueries({ queryKey: ['psychologist-availability'] });
      onCancelled?.();
    } catch (err) {
      console.error('Reschedule failed:', err);
      setRescheduleError(err?.response?.data?.message || 'Gagal mengubah jadwal. Silakan coba lagi.');
    } finally {
      setRescheduling(false);
    }
  };

  const getMethodLabel = () => {
    const m = String(session.method || '').toLowerCase();
    if (m === 'online') return 'Daring';
    if (m === 'offline') return 'Luring';
    if (m === 'chat') return 'Chat';
    return m || 'Konseling';
  };

  if (!session) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full xl:w-[400px] xl:flex-shrink-0">
        <SectionHeader title="Sesi Konseling" subtitle="Sesi mendatang" iconElement={<CalendarEmptyIcon color="#E8655B" size={24} />} />
        <SectionEmptyState
          title="Belum ada sesi konseling"
          subtitle="Saat ini Anda belum ada jadwal sesi konseling"
          iconElement={<CalendarEmptyIcon color="#9CA3AF" size={24} />}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full xl:w-[400px] xl:flex-shrink-0">
      {/* Header */}
      <SectionHeader title="Sesi Konseling" subtitle="Sesi mendatang" iconElement={<CalendarEmptyIcon color="#E8655B" size={24} />} />

      {/* Image */}
      <img
        src="/dashboardruangdiri-1.png"
        alt="Sesi Konseling"
        className="w-full object-cover mb-4"
        style={{ height: 140, borderRadius: 12 }}
      />

      {/* Title */}
      <h3 className="font-bold text-base mb-3" style={{ color: '#488BBA' }}>
        Sesi Konseling Baru ({getMethodLabel()})
      </h3>

      {/* Info rows */}
      <div className="flex flex-col gap-2 mb-5">
        {session.psychologistName && session.psychologistName !== '-' && (
          <div className="flex items-center gap-3" style={{ backgroundColor: '#ECF9FC', borderRadius: 12, padding: '10px 12px' }}>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#DAF7FF' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#488BBE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2937]">Psikolog</p>
              <p className="text-xs text-[#6B7280]">{session.psychologistName}</p>
            </div>
          </div>
        )}
        {String(session.method || '').toLowerCase() === 'chat' ? (
          <div className="flex items-center gap-3" style={{ backgroundColor: '#ECF9FC', borderRadius: 12, padding: '10px 12px' }}>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#DAF7FF' }}>
              <span className="material-icons" style={{ color: '#488BBE', fontSize: 18 }}>chat</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="text-sm font-bold text-[#1F2937]">Chat</p>
              <p className="text-xs text-[#6B7280]">Sesi konseling melalui fitur chat</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3" style={{ backgroundColor: '#ECF9FC', borderRadius: 12, padding: '10px 12px' }}>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#DAF7FF' }}>
              <VideoIcon color="#488BBE" size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="text-sm font-bold text-[#1F2937]">{session.platform || 'Zoom Meeting'}</p>
              <p className="text-xs text-[#6B7280] truncate">{session.zoomLink || 'Tautan Zoom belum tersedia. Akan segera dikirimkan oleh admin.'}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3" style={{ backgroundColor: '#ECF9FC', borderRadius: 12, padding: '10px 12px' }}>
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#DAF7FF' }}>
            <ClockIcon color="#488BBE" size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1F2937]">{session.fullDate}</p>
            <p className="text-xs text-[#6B7280]">{session.time}</p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="flex-1 font-semibold text-sm transition-colors"
          style={{ border: '1.5px solid #E8655B', color: '#E8655B', borderRadius: 12, padding: '10px 16px', background: '#FFFFFF', cursor: 'pointer' }}
        >
          Batal
        </button>
        <button
          onClick={openReschedule}
          className="flex-1 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#E8655B', borderRadius: 12, padding: '10px 16px', border: 'none', cursor: 'pointer' }}
        >
          Ubah Jadwal
        </button>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-[#1F2937] mb-2">Batalkan Sesi Konseling?</h3>
            <p className="text-sm text-[#6B7280] mb-5">
              Sesi konseling pada {session.fullDate} ({session.time}) akan dibatalkan. Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 font-semibold text-sm"
                style={{ border: '1.5px solid #D1D5DB', color: '#6B7280', borderRadius: 12, padding: '10px 16px', background: 'none', cursor: 'pointer' }}
              >
                Kembali
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 text-white font-semibold text-sm"
                style={{ backgroundColor: '#EF4444', borderRadius: 12, padding: '10px 16px', border: 'none', cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.6 : 1 }}
              >
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !rescheduling && setShowReschedule(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-[#1F2937] mb-4">Ubah Jadwal Konseling</h3>

            <label className="block text-sm text-[#374151] font-medium mb-1">Tanggal</label>
            <div className="relative mb-3" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => !rescheduling && setShowCalendar(prev => !prev)}
                disabled={rescheduling}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#E8655B] bg-white"
              >
                {rescheduleDate
                  ? new Date(rescheduleDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Pilih Tanggal'}
                <span className="material-icons text-gray-400 text-base absolute right-3 top-1/2 -translate-y-1/2">calendar_today</span>
              </button>
              <Calendar
                selectedDate={rescheduleDate}
                onDateSelect={(dateStr) => {
                  handleDateChange(dateStr);
                  setShowCalendar(false);
                }}
                availableDates={availableDates}
                fullyBookedDates={fullyBookedDates}
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                triggerRef={datePickerRef}
              />
            </div>

            {rescheduleDate && (
              <div className="mb-3">
                <label className="block text-sm text-[#374151] font-medium mb-2">Pilih Waktu</label>
                {loadingSlots ? (
                  <div className="text-center py-4 text-sm text-gray-400">Memuat slot tersedia...</div>
                ) : allSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                    {allSlots.map((slot, idx) => {
                      const start = slot.startTime?.slice(0, 5);
                      const end = slot.endTime?.slice(0, 5);
                      const isSelected = !slot.isBooked && selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                          disabled={rescheduling || slot.isBooked}
                          className="text-sm rounded-lg py-2 px-3 border transition-colors relative"
                          style={{
                            backgroundColor: slot.isBooked ? '#F3F4F6' : isSelected ? '#E8655B' : '#FFFFFF',
                            color: slot.isBooked ? '#9CA3AF' : isSelected ? '#FFFFFF' : '#374151',
                            borderColor: slot.isBooked ? '#E5E7EB' : isSelected ? '#E8655B' : '#D1D5DB',
                            cursor: slot.isBooked ? 'not-allowed' : rescheduling ? 'not-allowed' : 'pointer',
                            opacity: slot.isBooked ? 0.7 : 1,
                          }}
                          title={slot.isBooked ? (slot.reason || 'Sudah terbooking') : ''}
                        >
                          <span>{start} - {end}</span>
                          {slot.isBooked && (
                            <span className="block text-[10px] text-gray-400 mt-0.5">{slot.reason || 'Terbooking'}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : !rescheduleError ? (
                  <div className="text-center py-4 text-sm text-gray-400">Tidak ada slot tersedia</div>
                ) : null}
              </div>
            )}

            {rescheduleError && (
              <p className="text-xs text-[#EF4444] mb-3">{rescheduleError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReschedule(false)}
                disabled={rescheduling}
                className="flex-1 font-semibold text-sm"
                style={{ border: '1.5px solid #D1D5DB', color: '#6B7280', borderRadius: 12, padding: '10px 16px', background: 'none', cursor: rescheduling ? 'not-allowed' : 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleReschedule}
                disabled={rescheduling}
                className="flex-1 text-white font-semibold text-sm"
                style={{ backgroundColor: '#E8655B', borderRadius: 12, padding: '10px 16px', border: 'none', cursor: rescheduling ? 'not-allowed' : 'pointer', opacity: rescheduling ? 0.6 : 1 }}
              >
                {rescheduling ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoIcon = ({ color = '#488BBE', size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12.53 20.4201H6.21C3.05 20.4201 2 18.3201 2 16.2101V7.79008C2 4.63008 3.05 3.58008 6.21 3.58008H12.53C15.69 3.58008 16.74 4.63008 16.74 7.79008V16.2101C16.74 19.3701 15.68 20.4201 12.53 20.4201Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.52 17.1001L16.74 15.1501V8.84013L19.52 6.89013C20.88 5.94013 22 6.52013 22 8.19013V15.8101C22 17.4801 20.88 18.0601 19.52 17.1001Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5 11C12.3284 11 13 10.3284 13 9.5C13 8.67157 12.3284 8 11.5 8C10.6716 8 10 8.67157 10 9.5C10 10.3284 10.6716 11 11.5 11Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarSmallIcon = ({ color = '#9CA3AF', size = 16 }) => (
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

const ClockIcon = ({ color = '#9CA3AF', size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.71 15.1798L12.61 13.3298C12.07 13.0098 11.63 12.2398 11.63 11.6098V7.50977" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STATUS_STYLES = {
  cancelled: { border: '#EE4266', badgeBg: '#FAEAEC', badgeText: '#EE4266' },
  completed: { border: '#0EAD69', badgeBg: '#E6F3EB', badgeText: '#0EAD69' },
  rescheduled: { border: '#9CA3AF', badgeBg: '#ECEEF0', badgeText: '#4B5563' },
};

const HistoryCard = ({ session }) => {
  const style = STATUS_STYLES[session.status] || STATUS_STYLES.rescheduled;
  return (
    <div
      className="bg-white rounded-xl shadow-sm"
      style={{ borderLeft: `4px solid ${style.border}`, padding: '12px 16px' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[#1F2937] font-bold text-sm">{session.title}</span>
        <span
          className="text-sm font-semibold flex-shrink-0 ml-3 inline-flex items-center justify-center"
          style={{
            width: 126,
            height: 40,
            borderRadius: 40,
            padding: '8px 16px',
            backgroundColor: style.badgeBg,
            color: style.badgeText,
          }}
        >
          {session.statusText}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[#6B7280] text-xs mb-2">
        <VideoIcon color="#488BBE" size={18} />
        <span>{session.platform} | {session.counselor}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] rounded-full px-3 py-1" style={{ backgroundColor: '#F3F4F6' }}>
          <CalendarSmallIcon color="#9CA3AF" size={16} />
          {session.date}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] rounded-full px-3 py-1" style={{ backgroundColor: '#F3F4F6' }}>
          <ClockIcon color="#9CA3AF" size={16} />
          {session.time}
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---

const UserDashboard = () => {
  const { userType = 'student' } = useOutletContext() || {};
  const navigate = useNavigate();

  const { chartData, upcomingSession, counselingHistory, isLoading, refetch } = useStudentDashboard(userType);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <span className="material-icons animate-spin text-blue-500 text-3xl">sync</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with wave gradient background */}
      <div className="relative overflow-hidden bg-[#BBF2FF]/60" style={{ marginTop: -64, paddingTop: 64 }}>
        {/* Top Left Decorative Wave */}
        <svg
          className="pointer-events-none absolute top-0 left-0"
          xmlns="http://www.w3.org/2000/svg"
          width="532"
          height="300"
          viewBox="0 0 532 300"
          fill="none"
        >
          <path
            d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z"
            fill="url(#paint0_linear_top)"
            fillOpacity="0.6"
          />
          <defs>
            <linearGradient
              id="paint0_linear_top"
              x1="615"
              y1="-41.9999"
              x2="-281.5"
              y2="-92.9999"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="0.898175" stopColor="#BBF2FF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Right Decorative Wave */}
        <svg
          className="pointer-events-none absolute right-0 bottom-0"
          xmlns="http://www.w3.org/2000/svg"
          width="930"
          height="300"
          viewBox="0 0 930 300"
          fill="none"
        >
          <path
            d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z"
            fill="url(#paint0_linear_bottom)"
            fillOpacity="0.6"
          />
          <defs>
            <linearGradient
              id="paint0_linear_bottom"
              x1="44.0001"
              y1="0.999972"
              x2="813.5"
              y2="352"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop offset="0.898175" stopColor="#BBF2FF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Header Content */}
        <div className="relative z-10 px-6 lg:px-10 pt-8 pb-10">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: "Home", to: `/user/${userType}/dashboard` },
            { label: "Asesmen Ruang Diri", to: `/user/${userType}/screening` },
            { label: "Dashboard" },
          ]} />

          {/* Title */}
          <h1 className="font-bold text-[#434343] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, lineHeight: '110%' }}>Dashboard</h1>
          <p className="text-base text-[#6B7280]">
            Halaman ini digunakan untuk informasi utama kesehatan mental dan aktivitas konseling.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-10 pt-6 pb-10">
        {/* Asesmen Kesehatan Mental Banner */}
        <div className="rounded-xl mb-6" style={{ backgroundColor: '#FFE8EF', padding: 24 }}>
          <div className="flex items-center justify-between" style={{ gap: 20 }}>
            <div className="flex items-center" style={{ gap: 20 }}>
              <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: '#FFDFE8', padding: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#E8655B' }}>neurology</span>
              </div>
              <div>
                <h2 className="font-semibold text-[#1F2937]" style={{ fontSize: 18 }}>Asesmen Kesehatan Mental</h2>
                <p className="text-[#6B7280] text-sm mt-1">Kenali kondisi kesehatan mentalmu dengan tes singkat 5 menit. Hasil akan membantu konselor memahami kebutuhanmu.</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/user/${userType}/screening`)}
              className="flex-shrink-0 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8655B', borderRadius: 12, padding: '8px 16px', height: 44, border: 'none', cursor: 'pointer' }}
            >
              Mulai Asesmen
            </button>
          </div>
        </div>

        {/* Two-Column: Chart + Session */}
        <div className="flex flex-col xl:flex-row xl:items-stretch gap-6 mb-6">
          <ProgressChartCard data={chartData} />
          <CounselingSessionCard session={upcomingSession} userType={userType} onCancelled={refetch} />
        </div>

        {/* Riwayat Konseling */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Riwayat Konseling" subtitle="Daftar sesi konseling Anda" iconElement={<HistoryIcon color="#E8655B" size={24} />} className="" />
            <button
              onClick={() => navigate(`/user/${userType}/booking-session`)}
              className="flex-shrink-0 font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8655B', color: '#FFFFFF', borderRadius: 12, padding: '10px 20px', border: 'none', cursor: 'pointer' }}
            >
              Booking Sesi Konseling
            </button>
          </div>

          {counselingHistory.length === 0 ? (
            <SectionEmptyState
              title="Belum ada riwayat konseling"
              subtitle="Saat ini Anda belum melakukan sesi konseling"
              iconElement={<HistoryIcon color="#9CA3AF" size={24} />}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {counselingHistory.map((session) => (
                <HistoryCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
