// src/pages/shared/NotificationPage.jsx - Clean parent component

import React from "react"
import { useOutletContext } from "react-router-dom"
import Notifications from "@/components/shared/notifications/Notifications"

/**
 * Clean notification page parent
 * Works for both school and company organizations
 * All logic handled in Notifications component
 */
const NotificationPage = () => {
  const context = useOutletContext() || {}
  const { sidebarExpanded = false } = context

  return <Notifications sidebarExpanded={sidebarExpanded} />
}

export default NotificationPage