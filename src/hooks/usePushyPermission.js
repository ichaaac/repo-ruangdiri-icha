import { useState, useEffect } from 'react'
import Pushy from 'pushy-sdk-web'

export const usePushyPermission = (userId) => {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!userId) return
    try {
      await Pushy.register({ serviceWorkerFile: '/service-worker.js' })
      await Pushy.subscribe(`user-${userId}`)
      setPermission('granted')
    } catch {
      setPermission(Notification.permission)
    }
  }

  const shouldShowBanner = permission === 'default'

  return { permission, requestPermission, shouldShowBanner }
}
