import { useState, useEffect } from 'react'
import { LuBell, LuX } from 'react-icons/lu'
import { usePushyPermission } from '@/hooks/usePushyPermission'

const PushNotificationBanner = ({ userId }) => {
  const [visible, setVisible] = useState(false)
  const { shouldShowBanner, requestPermission } = usePushyPermission(userId)

  useEffect(() => {
    if (!shouldShowBanner) return
    const timer = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(timer)
  }, [shouldShowBanner])

  const handleAllow = async () => {
    setVisible(false)
    await requestPermission()
  }

  const handleDismiss = () => {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid #ECEEF0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 9999,
        fontFamily: "'Plus Jakarta Sans', 'Public Sans', sans-serif",
        animation: 'slideUp 0.3s ease',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LuBell size={18} color="#488BBE" strokeWidth={2} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172B' }}>
            Aktifkan Notifikasi
          </span>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            color: '#94A3B8',
            flexShrink: 0,
          }}
        >
          <LuX size={16} />
        </button>
      </div>

      {/* Body */}
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
        Dapatkan update jadwal, konseling, dan informasi penting meski browser ditutup.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#64748B',
          }}
        >
          Nanti
        </button>
        <button
          onClick={handleAllow}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#488BBE',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#FFFFFF',
          }}
        >
          Aktifkan
        </button>
      </div>
    </div>
  )
}

export default PushNotificationBanner
