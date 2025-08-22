// src/components/shared/booking/hooks/useBooking.js - UPDATED FOR NEW BACKEND RESPONSE

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBookingApi, getBookingConfig } from "../lib/bookingApi"
import { useAuth } from "@/hooks/useAuth"

export const useBooking = (userType = "student") => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const bookingApi = createBookingApi(userType)
  const config = getBookingConfig(userType)

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
    queryFn: () => bookingApi.getAvailableTimeSlots(), // Use existing method that calls the correct endpoint
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

    const dates = []
    const today = new Date()
    
    // Get unique days of week that have availability
    const availableDaysOfWeek = [...new Set(psychologistAvailability.map((slot) => slot.dayOfWeek))]
    console.log("Available days of week:", availableDaysOfWeek)

    // Generate dates for next 60 days
    for (let i = 0; i <= 60; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

      // Check if this day has availability
      if (availableDaysOfWeek.includes(dayOfWeek)) {
        dates.push({
          value: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          dayOfWeek: dayOfWeek,
        })
      }
    }

    console.log("Generated available dates:", dates)
    return dates
  }, [psychologistAvailability])

  // UPDATED: Calculate time slots from backend availability data with new structure
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
    
    console.log("Day availability:", dayAvailability)

    // UPDATED: Convert to time slots format with new psychologist structure
    const slots = dayAvailability.map((availability, index) => ({
      startTime: availability.startTime.substring(0, 5), // Remove seconds: "09:00:00" -> "09:00"
      endTime: availability.endTime.substring(0, 5), // Remove seconds: "10:00:00" -> "10:00"
      psychologistName: availability.psychologist?.fullName || availability.psychologistName || "Unknown Psychologist",
      psychologistId: availability.psychologist?.id || availability.psychologistId,
      available: true,
      displayTime: `${availability.startTime.substring(0, 5)} - ${availability.endTime.substring(0, 5)} WIB`,
      uniqueId: `${availability.psychologist?.fullName || availability.psychologistName}-${availability.startTime}-${availability.endTime}-${index}`, // For unique keys
    }))

    console.log("Generated time slots:", slots)
    return slots
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

  // Reset location when method changes
  useEffect(() => {
    if (selectedMethod?.id !== "offline") {
      setSelectedLocation(null)
    }
  }, [selectedMethod])

  // Handle method selection
  const handleMethodSelection = useCallback((method) => {
    console.log("Method selection:", method)
    setSelectedMethod(method)
    setSelectedTimeSlot(null) // Reset time slot
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

  // Handle time slot selection
  const handleTimeSlotSelection = useCallback((timeSlot) => {
    console.log("Time slot selection:", timeSlot)
    setSelectedTimeSlot(timeSlot)
  }, [])

  // Handle location selection
  const handleLocationSelection = useCallback((location) => {
    console.log("Location selection:", location)
    setSelectedLocation(location)
  }, [])

  // UPDATED: Handle booking submit with new psychologist structure
  const handleBookingSubmit = useCallback(async () => {
    console.log("=== BOOKING SUBMIT VALIDATION ===")
    console.log("Selected method:", selectedMethod)
    console.log("Selected date:", selectedDate)
    console.log("Selected time slot:", selectedTimeSlot)
    console.log("Selected location:", selectedLocation)

    if (!selectedMethod || !selectedDate || !selectedTimeSlot) {
      throw new Error("Please fill in all required fields")
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
      psychologistId: selectedTimeSlot.psychologistId, // Include psychologist ID
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

    // Check location requirement only for offline method
    const hasLocationIfOffline = selectedMethod?.id !== "offline" || selectedLocation

    return hasRequiredFields && hasLocationIfOffline
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation])

  const getValidationErrors = useCallback(() => {
    const errors = []

    if (!selectedMethod) errors.push("Please select a counseling method")
    if (!selectedDate) errors.push("Please select a date")
    if (!selectedTimeSlot) errors.push("Please select a time slot")
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