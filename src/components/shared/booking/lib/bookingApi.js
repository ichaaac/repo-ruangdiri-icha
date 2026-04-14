// src/components/shared/booking/lib/bookingApi.js - Updated for New Backend Response

import { apiClient } from "@/lib/api"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);



export const createBookingApi = (userType = "student") => {
  // Helper: flatten availability payloads into flat slot list
  const flattenAvailabilityFromNewBackend = (payload) => {
    try {
      // Flatten list of { date, dayOfWeek, timeSlots: [...] }
      const flattenAvailabilityList = (list) => {
        const out = []
        for (const day of list || []) {
          const dateStr = day?.date
          const dow = typeof day?.dayOfWeek === 'number' ? day.dayOfWeek : (dateStr ? new Date(dateStr).getDay() : undefined)
          const tz = day?.timezone || 'Asia/Jakarta'
          const times = Array.isArray(day?.timeSlots) ? day.timeSlots : []
          for (const t of times) {
            if (!t?.startTime || !t?.endTime) continue
            out.push({
              date: dateStr,
              dayOfWeek: dow,
              startTime: t.startTime,
              endTime: t.endTime,
              timezone: t.timezone || tz,
              // counts (new backend)
              availablePsychologists: typeof t.availablePsychologists === 'number' ? t.availablePsychologists : undefined,
              totalPsychologists: typeof t.totalPsychologists === 'number' ? t.totalPsychologists : undefined,
              bookedPsychologists: typeof t.bookedPsychologists === 'number' ? t.bookedPsychologists : undefined,
              availabilityRate: typeof t.availabilityRate === 'number' ? t.availabilityRate : undefined,
              // ✅ FIXED: Add psychologist IDs from backend
              availablePsychologistIds: Array.isArray(t.availablePsychologistIds) ? t.availablePsychologistIds : [],
              bookedPsychologistIds: Array.isArray(t.bookedPsychologistIds) ? t.bookedPsychologistIds : [],
              // legacy flags
              isBooked: typeof t.isBooked === 'boolean' ? t.isBooked : undefined,
              hasScheduledSessions: false,
              scheduledSessions: [],
            })
          }
        }
        return out
      }

      // Array payload cases
      if (Array.isArray(payload)) {
        if (payload.length === 0) return payload
        const first = payload[0]
        if (first && typeof first === 'object' && Array.isArray(first.timeSlots)) {
          return flattenAvailabilityList(payload)
        }
        return payload
      }

      // New top-level availability
      if (Array.isArray(payload?.availability)) {
        return flattenAvailabilityList(payload.availability)
      }

      // Legacy psychologists structure
      const psychologists = payload?.psychologists
      if (!Array.isArray(psychologists)) return []

      const slots = []
      for (const p of psychologists) {
        const id = p?.psychologist?.id
        const fullName = p?.psychologist?.fullName
        const weekly = Array.isArray(p?.weeklySchedule) ? p.weeklySchedule : []
        for (const w of weekly) {
          const dayOfWeek = w?.dayOfWeek
          const tz = w?.timezone || 'Asia/Jakarta'
          const times = Array.isArray(w?.timeSlots) ? w.timeSlots : []
          for (const t of times) {
            if (!t?.startTime || !t?.endTime) continue
            slots.push({
              dayOfWeek,
              startTime: t.startTime,
              endTime: t.endTime,
              timezone: tz,
              psychologist: { id, fullName },
              hasScheduledSessions: false,
              scheduledSessions: [],
            })
          }
        }

        // Also flatten upcomingAvailable (date-specific) with isBooked flags
        const upcoming = Array.isArray(p?.upcomingAvailable) ? p.upcomingAvailable : []
        const defaultTz = weekly?.[0]?.timezone || 'Asia/Jakarta'
        for (const d of upcoming) {
          const dateStr = d?.date
          if (!dateStr) continue
          const dow = new Date(dateStr).getDay()
          const times = Array.isArray(d?.timeSlots) ? d.timeSlots : []
          for (const t of times) {
            if (!t?.startTime || !t?.endTime) continue
            slots.push({
              dayOfWeek: dow,
              date: dateStr,
              startTime: t.startTime,
              endTime: t.endTime,
              timezone: defaultTz,
              isBooked: typeof t.isBooked === 'boolean' ? t.isBooked : undefined,
              psychologist: { id, fullName },
              hasScheduledSessions: false,
              scheduledSessions: [],
            })
          }
        }
      }
      return slots
    } catch (e) {
      console.error('Failed to flatten availability payload:', e)
      return []
    }
  }
  // Validation helper for booking data
  const validateBookingData = (data) => {
    const errors = []

    if (!data.psychologistId) {
      errors.push("Psychologist is required")
    }

    if (!data.method || !["online", "offline", "chat"].includes(data.method)) {
      errors.push("Valid counseling method is required")
    }

    if (!data.date) {
      errors.push("Date is required")
    }

    if (!data.startTime) {
      errors.push("Start time is required")
    }

    if (!data.endTime) {
      errors.push("End time is required")
    }

    return errors
  }

  // Transform counseling method display
  const getCounselingMethodDisplay = (method) => {
    const methods = {
      online: "Daring (Zoom)",
      offline: "Luring",
      chat: "Chat",
    }
    return methods[method] || method
  }

  // Transform counseling method description
  const getCounselingMethodDescription = (method) => {
    const descriptions = {
      online:
        "Konseling yang dilakukan secara virtual dengan psikolog menggunakan platform percakapan audiovisual selama 1 jam.",
      offline: "Konseling yang dilakukan secara tatap muka dengan psikolog selama 1 jam.",
      chat: "Konseling melalui ruang chat dengan psikolog selama 15 menit dalam satu sesi.",
    }
    return descriptions[method] || ""
  }

  // Get available counseling methods
  const getAvailableMethods = () => {
    return [
      {
        id: "offline",
        name: "Luring",
        description: "Konseling yang dilakukan secara tatap muka dengan psikolog selama 1 jam.",
        duration: "1 jam",
        image: "/placeholder.svg?height=192&width=288",
      },
      {
        id: "online",
        name: "Daring (Zoom)",
        description:
          "Konseling yang dilakukan secara virtual dengan psikolog menggunakan platform percakapan audiovisual selama 1 jam.",
        duration: "1 jam",
        image: "/placeholder.svg?height=192&width=288",
      },
      {
        id: "chat",
        name: "Chat",
        description: "Konseling melalui ruang chat dengan psikolog selama 15 menit dalam satu sesi.",
        duration: "15 menit",
        image: "/placeholder.svg?height=192&width=288",
      },
    ]
  }

  // Format booking datetime for display
  const formatBookingDateTime = (date, startTime, endTime) => {
    try {
      const dateObj = new Date(date)
      const formattedDate = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })

      return {
        date: formattedDate,
        time: `${startTime} - ${endTime} WIB`,
      }
    } catch (error) {
      return { date: "TBD", time: "TBD" }
    }
  }

  // Create counseling chat session (helper function)
  const createCounselingChatSession = async (counselingId, psychologistName, scheduledAt) => {
    try {
      const payload = {
        counselingId,
        scheduledAt: scheduledAt.toISOString(),
      }

      const response = await apiClient.post("/chat/sessions/counseling", payload)

      if (response.data && response.data.status === "success") {
        return response.data.data
      }

      throw new Error(response.data?.message || "Failed to create chat session")
    } catch (error) {
      console.error("Error creating counseling chat session:", error)
      throw error
    }
  }

  return {
    // Get booked slots for a specific psychologist and date
    getBookedSlots: async (psychologistId, date, timezone = 'Asia/Jakarta') => {
      try {
        const response = await apiClient.get(
          `/psychologists/${psychologistId}/booked-slots`,
          {
            params: { date, timezone }
          }
        )

        if (response.data && response.data.status === "success") {
          return {
            status: "success",
            data: response.data.data,
          }
        }

        return response
      } catch (error) {
        console.error("Error fetching booked slots:", error)
        throw error
      }
    },

    // Get available counseling methods
    getCounselingMethods: async () => {
      try {
        // This could be an API call or static data
        return {
          status: "success",
          data: getAvailableMethods(),
        }
      } catch (error) {
        console.error("Error fetching counseling methods:", error)
        throw error
      }
    },

    // Get available psychologists
    getPsychologists: async (params = {}) => {
      try {
        const response = await apiClient.get("/psychologists", {
          params: {
            ...params,
            available: true, // Only get available psychologists
          },
        })

        if (response.data && response.data.status === "success") {
          return {
            ...response,
            data: {
              ...response.data,
              data: response.data.data.map((psychologist) => ({
                ...psychologist,
                displayName: psychologist.fullName || psychologist.name,
                specialties: psychologist.specialties || [],
                availability: psychologist.availability || {},
                rating: psychologist.rating || 0,
              })),
            },
          }
        }

        return response
      } catch (error) {
        console.error("Error fetching psychologists:", error)
        // Return fallback psychologists for demo
        return {
          status: "fallback",
          data: {
            data: [
              {
                id: "1",
                fullName: "Dr. Sarah Wijaya",
                email: "sarah.wijaya@ruangdiri.com",
                specialties: ["Anxiety", "Depression"],
                rating: 4.8,
                available: true,
              },
              {
                id: "2",
                fullName: "Dr. Ahmad Rahman",
                email: "ahmad.rahman@ruangdiri.com",
                specialties: ["Stress Management", "Career Counseling"],
                rating: 4.9,
                available: true,
              },
            ],
          },
        }
      }
    },

    // Get available locations for offline counseling
    getLocations: async () => {
      try {
        const response = await apiClient.get("/psychologists/locations")

        if (response.data && Array.isArray(response.data)) {
          return {
            status: "success",
            data: response.data.map((location, index) => ({
              id: index + 1,
              name: location.locations,
              address: location.address,
            })),
          }
        }

        return {
          status: "success",
          data: response.data || [],
        }
      } catch (error) {
        console.error("Error fetching locations:", error)
        // Return fallback locations
        return {
          status: "fallback",
          data: [
            {
              id: 1,
              name: "PT. Jasa Raharja Headquarter",
              address: "Kuningan, Jakarta Selatan",
            },
            {
              id: 2,
              name: "Biro Psikologi Sehati",
              address: "Bekasi, Jawa Barat",
            },
            {
              id: 3,
              name: "Jiwaku Sehati",
              address: "Bekasi, Jawa Barat",
            },
          ],
        }
      }
    },

    // UPDATED: Get available time slots for a specific date and psychologist
    getAvailableTimeSlots: async (params = {}) => {
      try {
        const { psychologistId, date, method } = params

        const response = await apiClient.get("/psychologists/availability")

        if (response.data && response.data.status === "success") {
          // Handle new nested structure from backend
          const payload = response.data.data
          const availabilityData = flattenAvailabilityFromNewBackend(payload)

          // Extract all psychologist IDs
          const allPsychologistIds = new Set()
          availabilityData.forEach(slot => {
            if (slot.psychologist?.id) allPsychologistIds.add(slot.psychologist.id)
            if (slot.psychologistId) allPsychologistIds.add(slot.psychologistId)
            if (slot.availablePsychologistIds) {
              slot.availablePsychologistIds.forEach(id => allPsychologistIds.add(id))
            }
          })

          // If no specific filtering needed, return all availability data
          if (!date && !psychologistId) {
            return {
              status: "success",
              data: availabilityData,
            }
          }

          // Filter by date if provided
          if (date) {
            const selectedDate = new Date(date)
            const selectedDayOfWeek = selectedDate.getDay() // 0=Sunday, 6=Saturday

            // Filter availability for the selected day (prefer exact date if provided by backend)
            const filteredSlots = availabilityData.filter((slot) =>
              slot.date ? (slot.date === date) : (slot.dayOfWeek === selectedDayOfWeek)
            )

            // Further filter by psychologist if provided
            const finalSlots = psychologistId
              ? filteredSlots.filter(
                  (slot) =>
                    slot.psychologist?.fullName?.includes(psychologistId) ||
                    slot.psychologist?.id === psychologistId
                )
              : filteredSlots

            return {
              status: "success",
              data: finalSlots,
            }
          }

          // Filter by psychologist only
          if (psychologistId) {
            const filteredSlots = availabilityData.filter(
              (slot) =>
                slot.psychologist?.fullName?.includes(psychologistId) ||
                slot.psychologist?.id === psychologistId
            )

            return {
              status: "success",
              data: filteredSlots,
            }
          }

          return {
            status: "success",
            data: availabilityData,
          }
        }

        return response
      } catch (error) {
        console.error("Error fetching time slots:", error)
        // Return fallback time slots for development
        const fallbackSlots = [
          {
            dayOfWeek: 1, // Monday
            startTime: "09:00:00",
            endTime: "10:00:00",
            psychologist: {
              id: "1",
              fullName: "Dr. Sarah Wijaya, M.Psi., Psikolog"
            }
          },
          {
            dayOfWeek: 1, // Monday
            startTime: "10:00:00",
            endTime: "11:00:00",
            psychologist: {
              id: "2",
              fullName: "Dr. Ahmad Rahman, M.Psi., Psikolog"
            }
          },
          {
            dayOfWeek: 2, // Tuesday
            startTime: "09:00:00",
            endTime: "10:00:00",
            psychologist: {
              id: "1",
              fullName: "Dr. Sarah Wijaya, M.Psi., Psikolog"
            }
          },
          {
            dayOfWeek: 2, // Tuesday
            startTime: "14:00:00",
            endTime: "15:00:00",
            psychologist: {
              id: "2",
              fullName: "Dr. Ahmad Rahman, M.Psi., Psikolog"
            }
          },
        ]

        return {
          status: "fallback",
          data: fallbackSlots,
        }
      }
    },

    // UPDATED: Get available dates based on availability data
    getAvailableDates: async (params = {}) => {
      try {
        const { psychologistId, method } = params

        const response = await apiClient.get("/psychologists/availability")

        if (response.data && response.data.status === "success") {
          const payload = response.data.data
          const availabilityData = flattenAvailabilityFromNewBackend(payload)

          // Filter by psychologist if specified
          const filteredAvailability = psychologistId
            ? availabilityData.filter(
                (slot) => 
                  slot.psychologist?.fullName?.includes(psychologistId) || 
                  slot.psychologist?.id === psychologistId
              )
            : availabilityData

          // Get unique days of week that have availability
          const availableDaysOfWeek = [...new Set(filteredAvailability.map((slot) => slot.dayOfWeek))]

          // Generate available dates for next 60 days
          const availableDates = []
          const today = new Date()

          for (let i = 0; i <= 60; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)

            // Check if this day of week has availability
            if (availableDaysOfWeek.includes(date.getDay())) {
              availableDates.push({
                value: date.toISOString().split("T")[0],
                label: date.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                dayOfWeek: date.getDay(),
              })
            }
          }

          return {
            status: "success",
            data: availableDates,
          }
        }

        return { status: "error", data: [] }
      } catch (error) {
        console.error("Error fetching available dates:", error)
        // Fallback: return weekdays only
        const dates = []
        const today = new Date()

        for (let i = 0; i <= 30; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)

          // Skip weekends for fallback
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            dates.push({
              value: date.toISOString().split("T")[0],
              label: date.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              }),
              dayOfWeek: date.getDay(),
            })
          }
        }

        return { status: "fallback", data: dates }
      }
    },

    // Get user's subscription info
    getSubscriptionInfo: async () => {
      try {
        const response = await apiClient.get("/users/subscription")

        if (response.data && response.data.status === "success") {
          // Extract subscription data
          const subscriptionData = response.data.data || {}

          // Handle remainingQuota - use nullish coalescing to preserve 0 value
          const remainingQuota = subscriptionData.remainingQuota ?? subscriptionData.quota ?? 0

          return {
            ...response,
            data: {
              ...response.data,
              data: {
                ...subscriptionData,
                displayType: subscriptionData.type === "organization" ? "Organisasi" : "Individual",
                remainingQuota: remainingQuota,
              },
            },
          }
        }

        return response
      } catch (error) {
        console.error("Error fetching subscription info:", error)
        console.error("Error details:", error.response?.data)
        // Return fallback subscription info
        return {
          status: "fallback",
          data: {
            type: "organization",
            displayType: "Organisasi",
            remainingQuota: 18,
          },
        }
      }
    },

    // Create booking appointment - MAIN ENDPOINT WITH CHAT INTEGRATION
    createBooking: async (bookingData) => {
      try {
        const validationErrors = []

        if (!bookingData.method || !["online", "offline", "chat"].includes(bookingData.method)) {
          validationErrors.push("Valid counseling method is required")
        }

        if (!bookingData.date) {
          validationErrors.push("Date is required")
        }

        if (!bookingData.startTime) {
          validationErrors.push("Start time is required")
        }

        if (!bookingData.endTime) {
          validationErrors.push("End time is required")
        }

        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(", ")}`)
        }

        // ✅ FIXED: Ensure time format includes seconds (HH:MM:SS)
        const formatTimeWithSeconds = (time) => {
          if (!time) return time
          // If already has seconds (HH:MM:SS), return as is
          if (time.split(':').length === 3) return time
          // If only HH:MM, add :00
          return `${time}:00`
        }

        // Transform data for API
        const transformedData = {
          method: bookingData.method, // 'online', 'offline', 'chat'
          notes: bookingData.notes || "",
          date: bookingData.date,
          startTime: formatTimeWithSeconds(bookingData.startTime),
          endTime: formatTimeWithSeconds(bookingData.endTime),
          timezone: bookingData.timezone || "Asia/Jakarta",
        }

        // Only include psychologistId if available (backend can auto-assign)
        if (bookingData.psychologistId) {
          transformedData.psychologistId = bookingData.psychologistId
        }

        // Add location for offline bookings
        if (bookingData.method === "offline" && bookingData.locationId) {
          transformedData.locationId = bookingData.locationId
        }

        const response = await apiClient.post("/counselings/book", transformedData)

        if (response.data && response.data.status === "success") {
          const bookingResult = {
            ...response.data.data,
            methodDisplay: getCounselingMethodDisplay(response.data.data.method),
            dateTimeFormatted: formatBookingDateTime(
              response.data.data.date,
              response.data.data.startTime,
              response.data.data.endTime,
            ),
          }

          // Ensure raw method is always present (fallback to requested method)
          if (!bookingResult.method) {
            bookingResult.method = bookingData.method
          }

          // Create chat session for chat bookings
          if (bookingData.method === "chat") {
            try {
              const chatSession = await createCounselingChatSession(
                response.data.data.id,
                bookingData.psychologistName,
                new Date(bookingData.date + "T" + bookingData.startTime),
              )

              bookingResult.chatSessionCreated = true
              bookingResult.chatSessionId = chatSession.sessionId
            } catch (chatError) {
              console.error("Failed to create chat session:", chatError)
              bookingResult.chatSessionCreated = false
              bookingResult.chatSessionError = chatError.message
            }
          }

          return {
            ...response,
            data: {
              ...response.data,
              data: bookingResult,
            },
          }
        }

        return response
      } catch (error) {
        console.error("Error creating booking:", error)

        if (error.response) {
          console.error("Booking error response:", error.response.data)
          const errorMessage =
            (error.response.data && error.response.data.message) ||
            (error.response.data && error.response.data.error) ||
            `HTTP ${error.response.status}: Booking failed`
          throw new Error(errorMessage)
        } else if (error.request) {
          console.error("Booking error request:", error.request)
          throw new Error("Network error: Could not create booking")
        } else {
          console.error("Booking error message:", error.message)
          throw new Error(error.message || "Unknown error occurred during booking")
        }
      }
    },

    // Get user's booking history
    getBookingHistory: async (params = {}) => {
      try {
        // Use the organization schedules endpoint (my-bookings doesn't exist)
        const response = await apiClient.get("/counselings/schedules/organization", {
          params: { limit: 100, ...params },
        })

        if (response.data && response.data.status === "success") {
          const rawData = Array.isArray(response.data.data) ? response.data.data : []

          // Get current user ID from JWT token
          const token = localStorage.getItem("token")
          let currentUserId = null
          try {
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]))
              currentUserId = payload.sub
            }
          } catch {}

          // Filter sessions that include the current user (as student/employee)
          // Include sessions without users array (e.g. cancelled sessions where BE strips users)
          const userSessions = currentUserId
            ? rawData.filter(session => {
                if (!session.users || session.users.length === 0) return true
                return session.users.some(u => u.id === currentUserId && u.role !== "psychologist")
              })
            : rawData

          // Transform to the format expected by dashboard
          const transformed = userSessions.map(session => {
            const startDt = new Date(session.startDateTime)
            const dateStr = startDt.toISOString().split("T")[0]
            const hours = String(startDt.getHours()).padStart(2, "0")
            const minutes = String(startDt.getMinutes()).padStart(2, "0")
            const startTime = `${hours}:${minutes}`
            // Assume 1 hour sessions
            const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
            const endTime = `${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}`

            // Find psychologist in users
            const psychologist = session.users?.find(u => u.role === "psychologist")

            // Determine method from location
            const locationToMethod = { online: "online", offline: "offline", chat: "chat" }
            const method = locationToMethod[session.location] || session.location || "online"

            // Use counselingStatus from API if available, otherwise derive from date
            const now = new Date()
            const status = session.counselingStatus || (startDt > now ? "scheduled" : "completed")

            const statusDisplayMap = {
              scheduled: "Terjadwal",
              confirmed: "Terkonfirmasi",
              pending: "Menunggu",
              completed: "Selesai",
              cancelled: "Dibatalkan",
              rescheduled: "Diubah",
            }

            return {
              id: session.id,
              date: dateStr,
              startTime,
              endTime,
              method,
              methodDisplay: getCounselingMethodDisplay(method),
              psychologistName: psychologist?.fullName || "-",
              psychologist: psychologist || null,
              status,
              statusDisplay: statusDisplayMap[status] || status,
              dateTimeFormatted: formatBookingDateTime(dateStr, startTime, endTime),
            }
          })

          return {
            ...response,
            data: {
              ...response.data,
              data: transformed,
            },
          }
        }

        return response
      } catch (error) {
        console.error("Error fetching booking history:", error)
        throw error
      }
    },

    cancelCounseling: async (scheduleId, reason = "") => {
      const response = await apiClient.post(`/counselings/schedules/${scheduleId}/cancel`, { reason })
      return response.data
    },

    rescheduleCounseling: async (counselingId, { date, startTime, endTime, timezone = "Asia/Jakarta", notes = "" }) => {
      const response = await apiClient.put(`/counselings/${counselingId}/reschedule`, {
        date,
        startTime,
        endTime,
        timezone,
        notes,
      })
      return response.data
    },

    rescheduleCounselingBySchedule: async (scheduleId, { date, startTime, endTime, timezone = "Asia/Jakarta", notes = "" }) => {
      const response = await apiClient.put(`/counselings/schedules/${scheduleId}/reschedule`, {
        date,
        startTime,
        endTime,
        timezone,
        notes,
      })
      return response.data
    },

    // Helper methods
    getCounselingMethodDisplay: getCounselingMethodDisplay,
    getCounselingMethodDescription: getCounselingMethodDescription,
    formatBookingDateTime: formatBookingDateTime,
    getAvailableMethods: getAvailableMethods,
    createCounselingChatSession: createCounselingChatSession,
  }
}

export const getBookingConfig = (userType) => {
  const baseConfig = {
    allowedMethods: ["online", "offline", "chat"],
    defaultTimezone: "Asia/Jakarta",
    maxAdvanceBookingDays: 30,
    minAdvanceBookingHours: 24,
    maxCancellationHours: 24,
  }

  if (userType === "student") {
    return {
      ...baseConfig,
      preferredMethods: ["online", "chat", "offline"],
      defaultMethod: "online",
    }
  } else if (userType === "employee") {
    return {
      ...baseConfig,
      preferredMethods: ["online", "offline", "chat"],
      defaultMethod: "online",
    }
  }

  return baseConfig
}
