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
      console.log("Raw availability data:", data)
      return data?.data || []
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

  // UPDATED: Calculate time slots with psychologist availability filtering
  const timeSlots = useCallback(() => {
    if (!selectedDate || !psychologistAvailability || psychologistAvailability.length === 0) {
      console.log("No selected date or availability data for time slots")
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

    // Determine availability: if isBooked flag exists, use it; otherwise fallback to scheduledSessions logic
    const availableSlots = source.filter((availability) => {
      if (typeof availability.availablePsychologists === 'number') {
        return availability.availablePsychologists >= availabilityThreshold
      }
      if (typeof availability.isBooked === 'boolean') {
        return availability.isBooked === false
      }
      const scheduledSessionsCount = availability.scheduledSessions?.length || 0
      return !availability.hasScheduledSessions || scheduledSessionsCount < 2
    })

    // Convert available slots
    const slots = availableSlots.map((availability, index) => ({
      startTime: availability.startTime.substring(0, 5),
      endTime: availability.endTime.substring(0, 5),
      psychologistName: availability.psychologist?.fullName || availability.psychologistName || "Unknown Psychologist",
      psychologistId: availability.psychologist?.id || availability.psychologistId,
      available: true,
      displayTime: `${availability.startTime.substring(0, 5)} - ${availability.endTime.substring(0, 5)} WIB`,
      uniqueId: `${availability.date || 'any'}-${availability.startTime}-${availability.endTime}-a-${index}`,
      scheduledSessionsCount: availability.scheduledSessions?.length || 0,
      hasScheduledSessions: availability.hasScheduledSessions,
    }))

    // Include unavailable slots from isBooked
    const unavailableFromBooked = source
      .filter((availability) => {
        if (typeof availability.availablePsychologists === 'number') {
          return availability.availablePsychologists < availabilityThreshold
        }
        return availability.isBooked === true
      })
      .map((availability, index) => ({
        startTime: availability.startTime.substring(0, 5),
        endTime: availability.endTime.substring(0, 5),
        psychologistName: availability.psychologist?.fullName || availability.psychologistName || "Unknown Psychologist",
        psychologistId: availability.psychologist?.id || availability.psychologistId,
        available: false,
        displayTime: `${availability.startTime.substring(0, 5)} - ${availability.endTime.substring(0, 5)} WIB (${typeof availability.availablePsychologists === 'number' ? 'Penuh' : 'Sudah dibooking'})`,
        uniqueId: `${availability.date || 'any'}-${availability.startTime}-${availability.endTime}-u-${index}`,
        scheduledSessionsCount: availability.scheduledSessions?.length || 0,
        hasScheduledSessions: availability.hasScheduledSessions,
        reason: typeof availability.availablePsychologists === 'number' ? `Tidak cukup psikolog tersedia (sisa: ${availability.availablePsychologists ?? 0})` : "Sudah dibooking",
      }))

    // Also include unavailable from overbooked heuristic (without duplicating booked ones)
    const unavailableFromOverbooked = source
      .filter((availability) => {
        if (typeof availability.isBooked === 'boolean') return false
        const scheduledSessionsCount = availability.scheduledSessions?.length || 0
        return availability.hasScheduledSessions && scheduledSessionsCount >= 2
      })
      .map((availability, index) => ({
        startTime: availability.startTime.substring(0, 5),
        endTime: availability.endTime.substring(0, 5),
        psychologistName: availability.psychologist?.fullName || availability.psychologistName || "Unknown Psychologist",
        psychologistId: availability.psychologist?.id || availability.psychologistId,
        available: false,
        displayTime: `${availability.startTime.substring(0, 5)} - ${availability.endTime.substring(0, 5)} WIB (Tidak tersedia)`,
        uniqueId: `${availability.date || 'any'}-${availability.startTime}-${availability.endTime}-o-${index}`,
        scheduledSessionsCount: availability.scheduledSessions?.length || 0,
        hasScheduledSessions: availability.hasScheduledSessions,
        reason: "Psikolog tidak tersedia",
      }))

    const allSlots = [...slots, ...unavailableFromBooked, ...unavailableFromOverbooked]

    // Sort by time; prioritize available
    allSlots.sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.available === b.available ? 0 : a.available ? -1 : 1
      }
      return a.startTime.localeCompare(b.startTime)
    })

    console.log("Final time slots with availability:", allSlots)
    return allSlots
  }, [selectedDate, psychologistAvailability])

  // Get user's subscription info (from user data)
  const subscriptionInfo = user?.organization
    ? {
        displayType: "Organisasi",
        remainingQuota: user.organization.remainingQuota || 0,
        totalQuota: user.organization.totalQuota || 0,
      }
    : null

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

    console.log("Final booking data:", bookingData)

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
    timeSlots: false, // Computed from availability data
    availableDates: availabilityLoading,
    creating: createBookingMutation.isPending,
  }

  const errors = {
    methods: methodsError,
    locations: locationsError,
    timeSlots: null,
    availableDates: availabilityError,
    creating: createBookingMutation.error,
  }

  return {
    // Data
    counselingMethods,
    locations,
    timeSlots: timeSlots(), // Call function to get computed time slots
    availableDates: availableDates(), // Call function to get computed available dates
    subscriptionInfo,
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
