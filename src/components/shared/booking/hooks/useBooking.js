// src/components/shared/booking/hooks/useBooking.js - UPDATED WITH PSYCHOLOGIST FILTERING

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBookingApi, getBookingConfig } from "../lib/bookingApi"
import { useAuth } from "@/hooks/useAuth"

export const useBooking = (userType = "student") => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const bookingApi = createBookingApi(userType)
  const config = getBookingConfig(userType)
  const availabilityThreshold = Number(import.meta.env?.VITE_BOOKING_MIN_AVAILABLE_PSY || 1)

  // State management
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [selectedPsychologist, setSelectedPsychologist] = useState(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [notes, setNotes] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Get available counseling methods
  const {
    data: counselingMethods,
    isLoading: methodsLoading,
    error: methodsError,
  } = useQuery({
    queryKey: ["counseling-methods", userType],
    queryFn: () => bookingApi.getCounselingMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data?.data || [],
  })

  // UPDATED: Get psychologist availability from correct endpoint
  const {
    data: psychologistAvailability,
    isLoading: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability,
} = useQuery({
    queryKey: ["psychologist-availability"],
    queryFn: () => bookingApi.getAvailableTimeSlots(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => {
      console.log("=== BACKEND AVAILABILITY RESPONSE ===")
      console.log("Raw availability data:", data)
      console.log("Full data object:", JSON.stringify(data, null, 2))

      // ✅ DEBUG: Extract and log all psychologist IDs from response
      const availabilityData = data?.data || []
      const psychologistIds = new Set()
      availabilityData.forEach(slot => {
        if (slot.psychologistId) psychologistIds.add(slot.psychologistId)
        if (slot.psychologist?.id) psychologistIds.add(slot.psychologist.id)
        if (slot.availablePsychologistIds) {
          slot.availablePsychologistIds.forEach(id => psychologistIds.add(id))
        }
      })

      console.log("🔍 All psychologist IDs from backend:", Array.from(psychologistIds))
      console.log("🔍 Total slots from backend:", availabilityData.length)

      // 🔍 Log each slot's availability info
      console.log("🔍 DETAILED SLOT AVAILABILITY:")
      availabilityData.forEach((slot, index) => {
        console.log(`  [${index}] ${slot.date || 'weekly'} ${slot.startTime}-${slot.endTime}:`, {
          availablePsychologists: slot.availablePsychologists,
          totalPsychologists: slot.totalPsychologists,
          bookedPsychologists: slot.bookedPsychologists,
          isBooked: slot.isBooked,
          psychologistId: slot.psychologist?.id || slot.psychologistId,
          availablePsychologistIds: slot.availablePsychologistIds
        })
      })

      // ✅ Check for invalid IDs
      const invalidIds = Array.from(psychologistIds).filter(id =>
        id && id.startsWith('8f875267')
      )
      const validIds = Array.from(psychologistIds).filter(id =>
        id && id.startsWith('7d3c1c42')
      )

      if (invalidIds.length > 0) {
        console.error("❌ INVALID PSYCHOLOGIST IDs DETECTED:", invalidIds)
      }
      if (validIds.length > 0) {
        console.log("✅ VALID PSYCHOLOGIST IDs FOUND:", validIds)
      }

      return availabilityData
    },
  })

  // Get available locations for offline counseling
  const {
    data: locations,
    isLoading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ["counseling-locations"],
    queryFn: () => bookingApi.getLocations(),
    enabled: selectedMethod?.id === "offline",
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data?.data || [],
  })

  // UPDATED: Calculate available dates from backend availability data
  const availableDates = useCallback(() => {
    if (!psychologistAvailability || psychologistAvailability.length === 0) {
      console.log("No psychologist availability data")
      return []
    }

    console.log("Processing availability data:", psychologistAvailability)

    // Prefer using date-specific availability when present
    const dated = psychologistAvailability.filter((slot) => !!slot.date)
    if (dated.length > 0) {
      // Group by date and include only if any slot is not booked
      const byDate = dated.reduce((acc, s) => {
        (acc[s.date] ||= []).push(s)
        return acc
      }, {})

      const filteredDates = Object.entries(byDate)
        .filter(([dateStr, slots]) => {
          // Keep date if any slot is available by counts or flags
          return slots.some((s) => {
            if (typeof s.availablePsychologists === 'number') {
              return s.availablePsychologists >= availabilityThreshold
            }
            if (typeof s.isBooked === 'boolean') {
              return s.isBooked === false
            }
            // Fallback: assume available when no explicit info
            return true
          })
        })
        .map(([dateStr]) => dateStr)

      const result = filteredDates.map((dateStr) => {
        const d = new Date(dateStr)
        return {
          value: dateStr,
          label: d.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          dayOfWeek: d.getDay(),
        }
      })
      console.log("Available dates (filtered by not fully booked):", result)
      return result
    }

    // Change from 28 to 60 days
    const today = new Date()
    const sixtyDaysFromNow = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000))  // ✅ 60 days
    const availableDaysOfWeek = [...new Set(psychologistAvailability.map((slot) => slot.dayOfWeek))]
    const dates = []

    for (let i = 0; i <= 28; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayOfWeek = date.getDay()
      const currentDate = new Date(date)
      const isBeyond60Days = currentDate > sixtyDaysFromNow
      if (availableDaysOfWeek.includes(dayOfWeek)) {
        dates.push({
          value: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          dayOfWeek,
          isBeyond60Days,
        })
      }
    }
    console.log("Available dates (from weekly schedule fallback):", dates)
    return dates
  }, [psychologistAvailability])

  // Compute fully booked dates (all slots unavailable) for calendar indicators
  const fullyBookedDates = useCallback(() => {
    if (!psychologistAvailability || psychologistAvailability.length === 0) return []

    const dated = psychologistAvailability.filter((slot) => !!slot.date)
    if (dated.length === 0) return []

    const byDate = dated.reduce((acc, s) => {
      (acc[s.date] ||= []).push(s)
      return acc
    }, {})

    return Object.entries(byDate)
      .filter(([, slots]) => {
        // Date is fully booked if NO slot has availability
        return slots.every((s) => {
          if (typeof s.availablePsychologists === 'number') {
            return s.availablePsychologists < availabilityThreshold
          }
          if (typeof s.isBooked === 'boolean') {
            return s.isBooked === true
          }
          return false
        })
      })
      .map(([dateStr]) => dateStr)
  }, [psychologistAvailability, availabilityThreshold])

  // UPDATED: Fetch booked slots when date is selected
  const {
    data: bookedSlotsData,
    isLoading: bookedSlotsLoading,
    refetch: refetchBookedSlots,
  } = useQuery({
    queryKey: ["booked-slots", selectedDate],
    queryFn: async () => {
      if (!selectedDate || !psychologistAvailability || psychologistAvailability.length === 0) {
        return { bookedSlots: [], availableSlots: [] }
      }

      // Extract unique psychologist IDs from availability data
      const psychologistIds = new Set()
      psychologistAvailability.forEach(slot => {
        if (slot.psychologistId) psychologistIds.add(slot.psychologistId)
        if (slot.psychologist?.id) psychologistIds.add(slot.psychologist.id)
        if (slot.availablePsychologistIds && Array.isArray(slot.availablePsychologistIds)) {
          slot.availablePsychologistIds.forEach(id => psychologistIds.add(id))
        }
      })

      console.log("=== FETCHING BOOKED SLOTS ===")
      console.log("Date:", selectedDate)
      console.log("Psychologist IDs:", Array.from(psychologistIds))
      console.log("psychologistAvailability data:", psychologistAvailability)

      if (psychologistIds.size === 0) {
        console.error("❌ NO PSYCHOLOGIST IDs FOUND! Cannot fetch booked slots.")
        console.log("psychologistAvailability:", psychologistAvailability)
        return { bookedSlots: [], availableSlots: [] }
      }

      // Fetch booked slots for each psychologist
      const allBookedSlots = []
      const allAvailableSlots = []

      for (const psychologistId of psychologistIds) {
        try {
          console.log(`Calling API for psychologist: ${psychologistId}`)
          const result = await bookingApi.getBookedSlots(psychologistId, selectedDate)
          console.log(`API Response for ${psychologistId}:`, result)

          if (result.status === "success" && result.data) {
            console.log(`✅ Success! Data:`, result.data)

            // Combine booked and available slots with psychologist info
            if (result.data.bookedSlots) {
              result.data.bookedSlots.forEach(slot => {
                const bookedSlot = {
                  ...slot,
                  psychologistId: result.data.psychologistId,
                  isBooked: true,
                }
                console.log(`Adding BOOKED slot:`, bookedSlot)
                allBookedSlots.push(bookedSlot)
              })
            }
            if (result.data.availableSlots) {
              result.data.availableSlots.forEach(slot => {
                const availableSlot = {
                  ...slot,
                  psychologistId: result.data.psychologistId,
                  isBooked: false,
                }
                console.log(`Adding AVAILABLE slot:`, availableSlot)
                allAvailableSlots.push(availableSlot)
              })
            }
          } else {
            console.warn(`❌ API returned non-success status:`, result)
          }
        } catch (error) {
          // Suppress error, just log it - don't show toast
          console.error(`❌ Failed to fetch booked slots for psychologist ${psychologistId}:`, error)
        }
      }

      console.log("=== FETCH COMPLETE ===")
      console.log("Total booked slots:", allBookedSlots.length, allBookedSlots)
      console.log("Total available slots:", allAvailableSlots.length, allAvailableSlots)
      console.log("🔴 BOOKED SLOTS SUMMARY:")
      allBookedSlots.forEach(slot => {
        console.log(`  ❌ ${slot.startTime}-${slot.endTime} (Psychologist: ${slot.psychologistId})`)
      })

      return {
        bookedSlots: allBookedSlots,
        availableSlots: allAvailableSlots,
      }
    },
    enabled: !!selectedDate && psychologistAvailability && psychologistAvailability.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false, // Don't retry on error
    onError: () => {
      // Suppress all errors from this query - no toast
      console.log("Booked slots query error suppressed")
    },
  })

  // UPDATED: Fixed 7 hourly time slots with booked slots data
  const timeSlots = useCallback(() => {
    if (!selectedDate) {
      console.log("No selected date for time slots")
      return []
    }

    // ✅ FIXED: Define 7 fixed hourly slots
    const FIXED_SLOTS = [
      { start: '09:00:00', end: '10:00:00' },
      { start: '10:00:00', end: '11:00:00' },
      { start: '11:00:00', end: '12:00:00' },
      { start: '13:00:00', end: '14:00:00' },
      { start: '14:00:00', end: '15:00:00' },
      { start: '15:00:00', end: '16:00:00' },
      { start: '16:00:00', end: '17:00:00' },
    ]

    // ✅ Check if selected date is today — disable past time slots
    const now = new Date()
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const isToday = selectedDate === todayStr
    const currentHHMM = isToday
      ? now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
      : null

    // Use booked slots data if available and has data
    if (bookedSlotsData && (bookedSlotsData.bookedSlots?.length > 0 || bookedSlotsData.availableSlots?.length > 0)) {
      const { bookedSlots = [], availableSlots = [] } = bookedSlotsData

      // Combine all slots
      const combinedSlots = [...bookedSlots, ...availableSlots]
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      // ✅ Also get general availability data for cross-reference (more accurate)
      const dated = (psychologistAvailability || []).filter(a => a.date === selectedDate)

      console.log("=== USING BOOKED SLOTS DATA FROM API ===")
      console.log("Booked slots:", bookedSlots)
      console.log("Available slots:", availableSlots)
      console.log("General availability for date:", dated)

      // Map to fixed slots format
      const result = FIXED_SLOTS.map((fixedSlot, index) => {
        const fixedStart = fixedSlot.start.substring(0, 5)
        const fixedEnd = fixedSlot.end.substring(0, 5)

        // Find matching slot from booked-slots API
        const matchingSlot = combinedSlots.find(slot => {
          return slot.startTime.substring(0, 5) === fixedStart && slot.endTime.substring(0, 5) === fixedEnd
        })

        // ✅ Cross-reference with general availability API (more reliable)
        const generalSlot = dated.find(a => {
          return a.startTime.substring(0, 5) === fixedStart && a.endTime?.substring(0, 5) === fixedEnd
        })

        const isPast = isToday && fixedStart <= currentHHMM

        // Determine availability: trust general API over booked-slots API
        let isAvailable = false
        let isBooked = false
        let reason = "Tidak ada psikolog tersedia"
        let psychologistId = matchingSlot?.psychologistId
        let psychologistName = matchingSlot?.psychologistName || "Psikolog Tersedia"

        if (isPast) {
          isAvailable = false
          reason = "Jam sudah lewat"
        } else if (generalSlot && typeof generalSlot.availablePsychologists === 'number') {
          // ✅ Trust general availability API — it has accurate booking counts
          isAvailable = generalSlot.availablePsychologists >= availabilityThreshold
          isBooked = generalSlot.bookedPsychologists > 0
          reason = isAvailable ? undefined : "Sudah Terbooking"
          if (isAvailable && generalSlot.availablePsychologistIds?.length > 0) {
            psychologistId = psychologistId || generalSlot.availablePsychologistIds[0]
          }
        } else if (matchingSlot) {
          isAvailable = !matchingSlot.isBooked
          isBooked = matchingSlot.isBooked
          reason = isBooked ? matchingSlot.bookingInfo || "Sudah dibooking" : undefined
        }

        return {
          startTime: fixedStart,
          endTime: fixedEnd,
          psychologistId,
          psychologistName,
          available: isAvailable,
          isBooked,
          displayTime: `${fixedStart} - ${fixedEnd} WIB`,
          uniqueId: `${selectedDate}-${fixedSlot.start}-${fixedSlot.end}-${index}`,
          reason,
        }
      })

      console.log("=== FINAL SLOTS FROM API ===", result)
      return result
    }

    console.log("=== NO BOOKED SLOTS DATA, USING FALLBACK ===")
    console.log("bookedSlotsData:", bookedSlotsData)

    // Fallback to old logic if booked slots not available yet
    if (!psychologistAvailability || psychologistAvailability.length === 0) {
      console.log("No availability data for time slots")
      return []
    }

    const selectedDateObj = new Date(selectedDate)
    const dayOfWeek = selectedDateObj.getDay()

    console.log("Calculating time slots for:", selectedDate, "dayOfWeek:", dayOfWeek)

    // Filter availability for selected day
    const dayAvailability = psychologistAvailability.filter((availability) => availability.dayOfWeek === dayOfWeek)

    // Prefer date-specific slots if present for the selected date
    const hasDated = dayAvailability.some((a) => !!a.date)
    const source = hasDated
      ? dayAvailability.filter((a) => a.date === selectedDate)
      : dayAvailability

    console.log("Day availability (selected source):", source)

    // ✅ Map each fixed slot to check availability from backend data
    const allSlots = FIXED_SLOTS.map((fixedSlot, index) => {
      // Find matching availability from backend for this time slot
      const matchingAvailability = source.find((availability) => {
        const backendStart = availability.startTime.substring(0, 5)
        const backendEnd = availability.endTime.substring(0, 5)
        const fixedStart = fixedSlot.start.substring(0, 5)
        const fixedEnd = fixedSlot.end.substring(0, 5)
        return backendStart === fixedStart && backendEnd === fixedEnd
      })

      // Check if this slot is available
      let isAvailable = false
      let psychologistId = undefined
      let psychologistName = "Psikolog Tersedia"
      let availablePsychologistIds = []
      let scheduledSessionsCount = 0
      let reason = "Tidak ada psikolog tersedia"

      if (matchingAvailability) {
        // ✅ Check if slot time has already passed today
        const isPast = isToday && fixedSlot.start.substring(0, 5) <= currentHHMM

        // Check availability using backend data
        if (isPast) {
          isAvailable = false
          reason = "Jam sudah lewat"
        } else if (typeof matchingAvailability.availablePsychologists === 'number') {
          isAvailable = matchingAvailability.availablePsychologists >= availabilityThreshold
          reason = isAvailable
            ? undefined
            : `Tidak cukup psikolog tersedia (sisa: ${matchingAvailability.availablePsychologists})`
        } else if (typeof matchingAvailability.isBooked === 'boolean') {
          isAvailable = matchingAvailability.isBooked === false
          reason = isAvailable ? undefined : "Sudah dibooking"
        } else {
          scheduledSessionsCount = matchingAvailability.scheduledSessions?.length || 0
          isAvailable = !matchingAvailability.hasScheduledSessions || scheduledSessionsCount < 2
          reason = isAvailable ? undefined : "Psikolog tidak tersedia"
        }

        // Get psychologist info if available
        if (isAvailable) {
          // ✅ TRUST BACKEND: Backend already filters with INNER JOIN, no validation needed
          psychologistId = matchingAvailability.psychologist?.id
            || matchingAvailability.psychologistId
            || (matchingAvailability.availablePsychologistIds && matchingAvailability.availablePsychologistIds.length > 0
              ? matchingAvailability.availablePsychologistIds[0]
              : undefined)

          psychologistName = matchingAvailability.psychologist?.fullName
            || matchingAvailability.psychologistName
            || "Psikolog Tersedia"

          availablePsychologistIds = matchingAvailability.availablePsychologistIds || []
        } else {
          // For unavailable slots, still get psychologist info
          psychologistId = matchingAvailability.psychologist?.id
            || matchingAvailability.psychologistId
            || (matchingAvailability.availablePsychologistIds && matchingAvailability.availablePsychologistIds.length > 0
              ? matchingAvailability.availablePsychologistIds[0]
              : undefined)

          psychologistName = matchingAvailability.psychologist?.fullName
            || matchingAvailability.psychologistName
            || "Unknown Psychologist"
        }
      }

      // Build display time
      const displayTime = isAvailable
        ? `${fixedSlot.start.substring(0, 5)} - ${fixedSlot.end.substring(0, 5)} WIB`
        : `${fixedSlot.start.substring(0, 5)} - ${fixedSlot.end.substring(0, 5)} WIB (${reason || 'Tidak tersedia'})`

      const slot = {
        startTime: fixedSlot.start.substring(0, 5),
        endTime: fixedSlot.end.substring(0, 5),
        psychologistName: psychologistName,
        psychologistId: psychologistId,
        availablePsychologistIds: availablePsychologistIds,
        available: isAvailable,
        displayTime: displayTime,
        uniqueId: `${selectedDate}-${fixedSlot.start}-${fixedSlot.end}-${index}`,
        scheduledSessionsCount: scheduledSessionsCount,
        hasScheduledSessions: matchingAvailability?.hasScheduledSessions || false,
        reason: reason,
      }

      // ✅ DEBUG: Log psychologist info for each slot
      console.log(`[Slot ${fixedSlot.start}-${fixedSlot.end}] psychologistId:`, psychologistId, "| available:", isAvailable, "| availablePsychologistIds:", availablePsychologistIds)

      return slot
    })

    // Sort by time; prioritize available
    allSlots.sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.available === b.available ? 0 : a.available ? -1 : 1
      }
      return a.startTime.localeCompare(b.startTime)
    })

    console.log("=== FINAL TIME SLOTS (7 fixed slots) ===")
    console.log("Total slots:", allSlots.length)
    console.log("Available slots:", allSlots.filter(s => s.available).length)
    console.log("Slots with psychologistId:", allSlots.filter(s => s.psychologistId).length)
    console.log("All slots:", allSlots)
    return allSlots
  }, [selectedDate, psychologistAvailability, bookedSlotsData, availabilityThreshold])

  // UPDATED: Calculate dynamic quota from availability (time-slot based)
  const availableQuota = useCallback(() => {
    if (!psychologistAvailability || psychologistAvailability.length === 0) {
      console.log("🔍 [useBooking] No availability data, quota = 0")
      return 0
    }

    // Count all available slots (not fully booked)
    const availableSlots = psychologistAvailability.filter((slot) => {
      // Check if slot has available psychologists
      if (typeof slot.availablePsychologists === 'number') {
        return slot.availablePsychologists >= availabilityThreshold
      }
      // Check if slot is not booked
      if (typeof slot.isBooked === 'boolean') {
        return slot.isBooked === false
      }
      // Fallback: check scheduled sessions
      const scheduledCount = slot.scheduledSessions?.length || 0
      return !slot.hasScheduledSessions || scheduledCount < 2
    })

    const quota = availableSlots.length

    console.log("🔍 [useBooking] Total slots:", psychologistAvailability.length)
    console.log("🔍 [useBooking] Available slots:", quota)

    return quota
  }, [psychologistAvailability, availabilityThreshold])

  // Debug: Log quota whenever availability changes
  useEffect(() => {
    const quota = availableQuota()
    console.log("🔍 [useBooking] Dynamic quota updated:", quota)
  }, [availableQuota])

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => bookingApi.createBooking(bookingData),
    onSuccess: (data) => {
      console.log("Booking created successfully:", data)

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["booking-history"] })
      queryClient.invalidateQueries({ queryKey: ["psychologist-availability"] })
    },
    onError: (error) => {
      console.error("Booking creation failed:", error)
    },
  })

  // UPDATED: Reset dependent fields when method changes
  useEffect(() => {
    if (selectedMethod?.id !== "offline") {
      setSelectedLocation(null)
    }
    // Reset date, time, and psychologist when method changes
    setSelectedDate("")
    setSelectedTimeSlot(null)
    setSelectedPsychologist(null)
  }, [selectedMethod])

  // Handle method selection with field reset
  const handleMethodSelection = useCallback((method) => {
    console.log("Method selection:", method)
    setSelectedMethod(method)
    
    // Reset all dependent fields when method changes
    setSelectedDate("")
    setSelectedTimeSlot(null)
    setSelectedPsychologist(null)
    
    // Only reset location if switching away from offline
    if (method?.id !== "offline") {
      setSelectedLocation(null)
    }
  }, [])

  // Handle date selection
  const handleDateSelection = useCallback((date) => {
    console.log("Date selection:", date)
    setSelectedDate(date)
    setSelectedTimeSlot(null) // Reset time slot when date changes
  }, [])

  // UPDATED: Handle time slot selection with availability check
  const handleTimeSlotSelection = useCallback((timeSlot) => {
    console.log("Time slot selection:", timeSlot)
    
    // Only allow selection of available slots
    if (timeSlot.available) {
      setSelectedTimeSlot(timeSlot)
    } else {
      console.warn("Attempted to select unavailable time slot:", timeSlot)
    }
  }, [])

  // Handle location selection
  const handleLocationSelection = useCallback((location) => {
    console.log("Location selection:", location)
    setSelectedLocation(location)
  }, [])

  // Handle booking submit
  const handleBookingSubmit = useCallback(async () => {
    console.log("=== BOOKING SUBMIT VALIDATION ===")
    console.log("Selected method:", selectedMethod)
    console.log("Selected date:", selectedDate)
    console.log("Selected time slot:", selectedTimeSlot)
    console.log("Selected location:", selectedLocation)

    if (!selectedMethod || !selectedDate || !selectedTimeSlot) {
      throw new Error("Please fill in all required fields")
    }

    // Check if selected time slot is available
    if (!selectedTimeSlot.available) {
      throw new Error("Selected time slot is no longer available")
    }

    // Only check location requirement for offline method
    if (selectedMethod.id === "offline" && !selectedLocation) {
      throw new Error("Please select a location for offline counseling")
    }

    const bookingData = {
      method: selectedMethod.id,
      notes: notes.trim(),
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      psychologistName: selectedTimeSlot.psychologistName,
      psychologistId: selectedTimeSlot.psychologistId,
      timezone: config.defaultTimezone,
    }

    // Add location for offline bookings only
    if (selectedMethod.id === "offline" && selectedLocation) {
      bookingData.locationId = selectedLocation.id
    }

    // ✅ DEBUG: Log booking data before submission
    console.log("=== DEBUG BOOKING DATA ===")
    console.log("Selected time slot:", selectedTimeSlot)
    console.log("psychologistId FROM SLOT:", bookingData.psychologistId)
    console.log("availablePsychologistIds FROM SLOT:", selectedTimeSlot.availablePsychologistIds)
    console.log("Full bookingData:", JSON.stringify(bookingData, null, 2))

    // ✅ VALIDATION: Check which ID is being used
    if (bookingData.psychologistId?.startsWith('8f875267')) {
      console.error("❌❌❌ SENDING INVALID PSYCHOLOGIST ID! ❌❌❌")
      console.error("Invalid ID:", bookingData.psychologistId)
      console.error("This ID does NOT exist in database!")
      console.error("Selected slot details:", selectedTimeSlot)
    } else if (bookingData.psychologistId?.startsWith('7d3c1c42')) {
      console.log("✅✅✅ Sending VALID psychologist ID ✅✅✅")
      console.log("Valid ID:", bookingData.psychologistId)
    } else {
      console.warn("⚠️ Unknown psychologist ID format:", bookingData.psychologistId)
    }

    // If psychologistId is missing, try fallback from availablePsychologistIds
    if (!bookingData.psychologistId) {
      if (selectedTimeSlot.availablePsychologistIds && selectedTimeSlot.availablePsychologistIds.length > 0) {
        bookingData.psychologistId = selectedTimeSlot.availablePsychologistIds[0]
      }
      // If still missing, backend will auto-assign
    }

    console.log("Final booking data (after validation):", bookingData)

    const result = await createBookingMutation.mutateAsync(bookingData)
    return result?.data?.data || result
  }, [
    selectedMethod,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    config.defaultTimezone,
    createBookingMutation,
  ])

  const isFormValid = useCallback(() => {
    const hasRequiredFields = !!(selectedMethod && selectedDate && selectedTimeSlot)
    const isTimeSlotAvailable = selectedTimeSlot?.available === true

    // Check location requirement only for offline method
    const hasLocationIfOffline = selectedMethod?.id !== "offline" || selectedLocation

    return hasRequiredFields && isTimeSlotAvailable && hasLocationIfOffline
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation])

  const getValidationErrors = useCallback(() => {
    const errors = []

    if (!selectedMethod) errors.push("Please select a counseling method")
    if (!selectedDate) errors.push("Please select a date")
    if (!selectedTimeSlot) errors.push("Please select a time slot")
    if (selectedTimeSlot && !selectedTimeSlot.available) {
      errors.push("Selected time slot is not available")
    }
    if (selectedMethod?.id === "offline" && !selectedLocation) {
      errors.push("Please select a location for offline counseling")
    }

    return errors
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation])

  // Reset booking form
  const resetBookingForm = useCallback(() => {
    setSelectedMethod(null)
    setSelectedPsychologist(null)
    setSelectedDate("")
    setSelectedTimeSlot(null)
    setSelectedLocation(null)
    setNotes("")
    setShowConfirmModal(false)
  }, [])

  // Format helpers
  const formatSelectedBooking = useCallback(() => {
    if (!selectedMethod || !selectedDate || !selectedTimeSlot) {
      return null
    }

    return {
      method: selectedMethod,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      location: selectedLocation,
      notes: notes,
      formattedDateTime: bookingApi.formatBookingDateTime(
        selectedDate,
        selectedTimeSlot.startTime,
        selectedTimeSlot.endTime,
      ),
    }
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation, notes, bookingApi])

  const loading = {
    methods: methodsLoading,
    locations: locationsLoading,
    timeSlots: bookedSlotsLoading, // UPDATED: Use booked slots loading
    availableDates: availabilityLoading,
    quota: availabilityLoading, // UPDATED: Quota loading same as availability
    creating: createBookingMutation.isPending,
  }

  const errors = {
    methods: methodsError,
    locations: locationsError,
    timeSlots: null,
    availableDates: availabilityError,
    quota: availabilityError, // UPDATED: Quota error same as availability
    creating: createBookingMutation.error,
  }

  return {
    // Data
    counselingMethods,
    locations,
    timeSlots: timeSlots(), // Call function to get computed time slots
    availableDates: availableDates(), // Call function to get computed available dates
    availableQuota: availableQuota(), // UPDATED: Dynamic quota from availability
    fullyBookedDates: fullyBookedDates(),
    config,

    // State
    selectedMethod,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    showConfirmModal,

    // Handlers
    handleMethodSelection,
    handleDateSelection,
    handleTimeSlotSelection,
    handleLocationSelection,
    handleBookingSubmit,
    setNotes,
    setShowConfirmModal,

    // Validation
    isFormValid,
    getValidationErrors,

    // Utilities
    resetBookingForm,
    formatSelectedBooking,
    refetchLocations,
    refetchAvailability,

    // Loading & Error states
    loading,
    errors,

    // Success states
    bookingCreated: createBookingMutation.isSuccess,
    createdBookingData: createBookingMutation.data,
  }
}
