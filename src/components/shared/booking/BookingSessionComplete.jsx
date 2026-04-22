import { useLocation, useNavigate, useOutletContext } from "react-router-dom"
import { useAuth } from "../../../hooks/useAuth"
import { useEffect, useState } from "react"

const FONT = 'Plus Jakarta Sans, sans-serif'
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']

const Snowflake = ({ size = 116, style }) => (
  <img
    src="/snowflake.svg"
    alt=""
    width={size}
    height={size}
    style={{ position: 'absolute', pointerEvents: 'none', ...style }}
  />
)

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
    const raw = bookingData?.id || bookingData?.bookingId
    if (!raw) return `RD-${Math.random().toString(36).substr(2, 3).toUpperCase()}`
    const str = String(raw)
    // If UUID, shorten it
    if (str.includes('-') && str.length > 10) {
      return `RD-${str.split('-')[0].toUpperCase().slice(0, 6)}`
    }
    return `RD-${str.padStart(3, '0')}`
  }

  const formatDateDisplay = () => {
    try {
      if (bookingData?.dateTimeFormatted?.date && !bookingData.dateTimeFormatted.date.includes('undefined')) {
        return bookingData.dateTimeFormatted.date
      }
      const dateStr = bookingData?.date
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

  const isChat = String(bookingData?.method || '').toLowerCase() === 'chat'

  const handleGoToChat = () => {
    const sessionId = bookingData?.sessionId || sessionStorage.getItem('chatSessionId')
    if (sessionId) {
      navigate(`/user/${userType}/chat?sessionId=${sessionId}`, { replace: true })
    } else {
      navigate(`/user/${userType}/chat`, { replace: true })
    }
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
      {/* Breadcrumb */}
      <div style={{ padding: '24px 40px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, lineHeight: '1.4' }}>
          <span onClick={() => navigate(`/user/${userType}/dashboard`)}
            style={{ color: '#6F7480', cursor: 'pointer', fontWeight: 400 }}>Dashboard</span>
          <span style={{ color: '#6D6F76' }}>/</span>
          <span onClick={() => navigate(`/user/${userType}/booking-session`)}
            style={{ color: '#6F7480', cursor: 'pointer', fontWeight: 400 }}>Booking Sesi</span>
          <span style={{ color: '#6D6F76' }}>/</span>
          <span style={{ color: '#E8655B', fontWeight: 600 }}>Ringkasan Pesanan</span>
        </nav>
      </div>

      {/* Content area */}
      <div style={{ padding: '0 40px 40px' }}>
        <div style={{
          backgroundColor: '#ECF9FC',
          borderRadius: 24,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 0',
          minHeight: 600,
        }}>
          {/* Snowflake decorations matching Figma positions */}
          <Snowflake size={116} style={{ top: 100, left: 40, opacity: 0.35 }} />
          <Snowflake size={89} style={{ bottom: 60, left: 12, opacity: 0.35 }} />
          <Snowflake size={105} style={{ top: 38, left: '31%', opacity: 0.35 }} />
          <Snowflake size={117} style={{ top: '48%', left: '32%', opacity: 0.35 }} />
          <Snowflake size={86} style={{ bottom: 100, left: '20%', opacity: 0.35 }} />
          <Snowflake size={111} style={{ top: 38, right: 0, opacity: 0.35 }} />
          <Snowflake size={160} style={{ top: '48%', right: -10, opacity: 0.35 }} />
          <Snowflake size={84} style={{ top: '55%', right: '22%', opacity: 0.35 }} />
          <Snowflake size={79} style={{ bottom: 80, right: '18%', opacity: 0.35 }} />
          <Snowflake size={174} style={{ top: 52, right: '38%', opacity: 0.35 }} />

          {/* Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #ECEEF0',
            padding: 32,
            width: '100%',
            maxWidth: 500,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}>
            {/* Icon & Text */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="17" viewBox="0 0 24 17" fill="none">
                  <path d="M2 8.5L8.5 15L22 2" stroke="#00A63E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <h1 style={{
                  fontSize: 24, fontWeight: 500, color: '#0F172B',
                  margin: 0, fontFamily: FONT, textAlign: 'center', lineHeight: '1.2',
                }}>
                  Terima Kasih
                </h1>
                <p style={{
                  fontSize: 14, color: '#6F7480', lineHeight: '1.6',
                  margin: 0, fontFamily: FONT, textAlign: 'center',
                }}>
                  Selamat, sesi konseling berhasil dibuat! Kami sudah mengirim detail antrean konseling Ruang Diri.
                </p>
              </div>
            </div>

            {/* Rincian Pemesanan */}
            <div style={{
              borderTop: '1px solid #ECEEF0',
              paddingTop: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}>
              <p style={{
                fontSize: 12, fontWeight: 500, color: '#9FA2AA',
                margin: 0, fontFamily: FONT, lineHeight: '1.4',
              }}>
                Rincian Pemesanan
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  ['Nomor Pemesanan', getBookingNumber()],
                  ['Tanggal', formatDateDisplay()],
                  ['Waktu', formatTimeDisplay()],
                  ['Jenis Konseling', getMethodDisplay()],
                  ['Nama', getPsychologistName()],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '8px 0',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#6F7480', fontFamily: FONT, lineHeight: '1.4', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172B', fontFamily: FONT, lineHeight: '1.4', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Zoom info - only for online */}
              {isOnline && (
                <div style={{
                  display: 'flex', gap: 12,
                  backgroundColor: '#ECF9FC', borderRadius: 12,
                  padding: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                    backgroundColor: '#DAF7FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 14.667A6.667 6.667 0 1 0 8 1.333a6.667 6.667 0 0 0 0 13.334Z" stroke="#447DFD" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 5.333V8.667" stroke="#447DFD" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7.997 10.667h.006" stroke="#447DFD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 400, color: '#6F7480',
                    lineHeight: '1.4', fontFamily: FONT,
                    display: 'flex', alignItems: 'center',
                  }}>
                    Tautan Zoom akan dikirimkan oleh admin sebelum sesi dimulai.
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isChat && (
                  <button onClick={handleGoToChat}
                    style={{
                      width: '100%', height: 44, borderRadius: 12, border: 'none',
                      backgroundColor: '#488BBA', color: '#FDFEFF',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      fontFamily: FONT, lineHeight: '1.4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 4, padding: '8px 16px',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Mulai Chat
                  </button>
                )}
                <button onClick={handleBackToDashboard}
                style={{
                  width: '100%', height: 44, borderRadius: 12, border: 'none',
                  backgroundColor: '#E8655B', color: '#FDFEFF',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT, lineHeight: '1.4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 4, padding: '8px 16px',
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
      </div>
    </div>
  )
}

export default BookingSessionComplete
