import { useLocation, useNavigate, useOutletContext } from "react-router-dom"
import { useAuth } from "../../../hooks/useAuth"
import { useEffect, useState } from "react"

const FONT = 'Plus Jakarta Sans, sans-serif';

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

const BookingSessionComplete = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { userType = 'student' } = useOutletContext() || {}
  const { user } = useAuth()
  const [bookingData, setBookingData] = useState(null)

  useEffect(() => {
    const result = location.state?.bookingResult
    if (result) {
      let processedData = result
      if (result.data && typeof result.data === 'object') {
        processedData = result.data
        if (processedData.data && typeof processedData.data === 'object') {
          processedData = processedData.data
        }
      }
      setBookingData(processedData)
    } else {
      navigate(-1)
    }
  }, [location.state, navigate])

  const getBookingNumber = () => {
    if (bookingData?.id) return `RD-${String(bookingData.id).padStart(3, '0')}`
    if (bookingData?.bookingId) return `RD-${String(bookingData.bookingId).padStart(3, '0')}`
    return `RD-${Math.random().toString(36).substr(2, 3).toUpperCase()}`
  }

  const formatDateDisplay = () => {
    try {
      if (bookingData?.dateTimeFormatted?.date && !bookingData.dateTimeFormatted.date.includes('undefined')) {
        return bookingData.dateTimeFormatted.date
      }
      let dateStr = bookingData?.date
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
    } catch { return bookingData?.date || '-' }
  }

  const formatTimeDisplay = () => {
    try {
      if (bookingData?.dateTimeFormatted?.time && !bookingData.dateTimeFormatted.time.includes('undefined')) {
        return bookingData.dateTimeFormatted.time
      }
      let startTime = bookingData?.startTime
      let endTime = bookingData?.endTime
      if (bookingData?.date && bookingData?.endDate && !startTime) {
        const opts = { timeZone: bookingData.originalTimezone || 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' }
        startTime = new Date(bookingData.date).toLocaleTimeString('en-US', opts)
        endTime = new Date(bookingData.endDate).toLocaleTimeString('en-US', opts)
      }
      if (!startTime || !endTime) return '-'
      const fmt = (t) => String(t).substring(0, 5).replace(':', '.')
      return `${fmt(startTime)} - ${fmt(endTime)}`
    } catch { return '-' }
  }

  const getMethodDisplay = () => {
    const m = String(bookingData?.method || '').toLowerCase()
    if (m === 'online') return 'Daring'
    if (m === 'offline') return 'Luring'
    if (m === 'chat') return 'Chat'
    return bookingData?.methodDisplay || m || '-'
  }

  const getPsychologistName = () => {
    return bookingData?.psychologistName || '-'
  }

  const handleBackToDashboard = () => {
    navigate(`/user/${userType}/dashboard`)
  }

  if (!bookingData) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
          <span className="material-icons" style={{ fontSize: 48, marginBottom: 8, display: 'block' }}>hourglass_empty</span>
          <p style={{ fontSize: 14 }}>Memuat data booking...</p>
        </div>
      </div>
    )
  }

  const isOnline = String(bookingData?.method || '').toLowerCase() === 'online'

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header with breadcrumb */}
      <div className="relative overflow-hidden bg-[#BBF2FF]/60" style={{ marginTop: -64, paddingTop: 64 }}>
        <svg className="pointer-events-none absolute top-0 left-0" width="532" height="300" viewBox="0 0 532 300" fill="none">
          <path d="M185.574 124.31C39.8177 132.283 -99.119 94.0838 -237.91 68.2276C-285.602 59.3374 -336.204 51.7664 -385.828 56.4581C-465.182 63.9603 -524.661 101.196 -561.979 140.554C-599.296 179.912 -621.458 223.491 -663.993 261.197C-681.311 276.557 -703.701 291.217 -730 302V-185H512.22C541.117 -120.038 542.281 -50.7751 489.122 8.5083C432.159 72.0016 313.388 117.325 185.574 124.31Z" fill="url(#wt_bc)" fillOpacity="0.6" />
          <defs><linearGradient id="wt_bc" x1="615" y1="-42" x2="-281.5" y2="-93" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>
        <svg className="pointer-events-none absolute right-0 bottom-0" width="930" height="300" viewBox="0 0 930 300" fill="none">
          <path d="M346.426 134.689C492.182 126.717 631.119 164.916 769.91 190.772C817.602 199.663 868.204 207.234 917.828 202.542C997.182 195.04 1056.66 157.804 1093.98 118.446C1131.3 79.0884 1153.46 35.5092 1195.99 -2.19681C1213.31 -17.5568 1235.7 -32.217 1262 -43V444H19.7804C-9.11719 379.038 -10.2814 309.775 42.8776 250.492C99.8411 186.998 218.612 141.675 346.426 134.689Z" fill="url(#wb_bc)" fillOpacity="0.6" />
          <defs><linearGradient id="wb_bc" x1="44" y1="1" x2="813.5" y2="352" gradientUnits="userSpaceOnUse"><stop stopColor="white" /><stop offset="0.898" stopColor="#BBF2FF" /></linearGradient></defs>
        </svg>
        <div className="relative z-10 px-6 lg:px-10 pt-8 pb-10">
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
            <span onClick={() => navigate(`/user/${userType}/dashboard`)}
              style={{ color: '#6B7280', cursor: 'pointer' }}>Dashboard</span>
            <span style={{ color: '#9CA3AF' }}>/</span>
            <span onClick={() => navigate(`/user/${userType}/booking-session`)}
              style={{ color: '#6B7280', cursor: 'pointer' }}>Booking Sesi</span>
            <span style={{ color: '#9CA3AF' }}>/</span>
            <span style={{ color: '#E8655B', fontWeight: 600 }}>Ringkasan Pesanan</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div style={{ backgroundColor: '#F0F9FC', padding: '32px 24px 48px', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {/* Card */}
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '40px 32px 32px', textAlign: 'center',
          }}>
            {/* Green check */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              backgroundColor: '#ECFDF5', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#22C55E" strokeWidth="2" />
              </svg>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: '0 0 8px', fontFamily: FONT }}>
              Terima Kasih
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: '160%', margin: '0 0 28px', fontFamily: FONT }}>
              Selamat, sesi konseling berhasil dibuat! Kami sudah mengirim<br />
              detail antrean konseling Ruang Diri.
            </p>

            {/* Separator */}
            <div style={{ width: '100%', height: 1, backgroundColor: '#E5E7EB', margin: '0 0 24px' }} />

            {/* Rincian Pemesanan */}
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 400, margin: '0 0 16px', fontFamily: FONT }}>
                Rincian Pemesanan
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280', fontFamily: FONT }}>Nomor Pemesanan</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', fontFamily: FONT }}>{getBookingNumber()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280', fontFamily: FONT }}>Tanggal</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', fontFamily: FONT }}>{formatDateDisplay()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280', fontFamily: FONT }}>Waktu</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', fontFamily: FONT }}>{formatTimeDisplay()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280', fontFamily: FONT }}>Jenis Konseling</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', fontFamily: FONT }}>{getMethodDisplay()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280', fontFamily: FONT }}>Nama</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', fontFamily: FONT }}>{getPsychologistName()}</span>
                </div>
              </div>
            </div>

            {/* Zoom info box - only for online */}
            {isOnline && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                backgroundColor: '#F0F9FC', borderRadius: 10,
                padding: '14px 16px', marginTop: 24, textAlign: 'left',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#488BBA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8V13" stroke="#488BBA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.9946 16H12.0036" stroke="#488BBA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 13, color: '#6B7280', lineHeight: '160%', fontFamily: FONT }}>
                  Tautan Zoom akan dikirimkan oleh admin sebelum sesi dimulai.
                </span>
              </div>
            )}

            {/* Button */}
            <button onClick={handleBackToDashboard}
              style={{
                width: '100%', height: 48, borderRadius: 12, border: 'none',
                backgroundColor: '#EB5757', color: '#FFFFFF',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT, marginTop: 24,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingSessionComplete
