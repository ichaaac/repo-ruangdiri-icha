

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBookingApi, getBookingConfig } from "../lib/bookingApi"
import { useAuth } from "../../../../hooks/useAuth"

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

  // Get available psychologists
  const {
    data: psychologists,
    isLoading: psychologistsLoading,
    error: psychologistsError,
    refetch: refetchPsychologists,
  } = useQuery({
    queryKey: ["psychologists", selectedMethod?.id],
    queryFn: () =>
      bookingApi.getPsychologists({
        method: selectedMethod?.id,
        userType,
      }),
    enabled: !!selectedMethod?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => data?.data?.data || [],
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

  // Get available time slots
  const {
    data: timeSlots,
    isLoading: timeSlotsLoading,
    error: timeSlotsError,
    refetch: refetchTimeSlots,
  } = useQuery({
    queryKey: ["time-slots", selectedPsychologist?.id, selectedDate, selectedMethod?.id],
    queryFn: () =>
      bookingApi.getAvailableTimeSlots({
        psychologistId: selectedPsychologist?.id,
        date: selectedDate,
        method: selectedMethod?.id,
      }),
    enabled: !!(selectedPsychologist?.id && selectedDate && selectedMethod?.id),
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data?.data || [],
  })

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
      queryClient.invalidateQueries({ queryKey: ["time-slots"] })
    },
    onError: (error) => {
      console.error("Booking creation failed:", error)
    },
  })

  // Auto-select first available psychologist when method changes
  useEffect(() => {
    if (psychologists && psychologists.length > 0 && selectedMethod && !selectedPsychologist) {
      setSelectedPsychologist(psychologists[0])
    }
  }, [psychologists, selectedMethod, selectedPsychologist])

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
    setSelectedPsychologist(null) // Reset psychologist when method changes
    setSelectedTimeSlot(null) // Reset time slot
    // Only reset location if switching away from offline
    if (method?.id !== "offline") {
      setSelectedLocation(null)
    }
  }, [])

  // Handle psychologist selection
  const handlePsychologistSelection = useCallback(
    (psychologist) => {
      setSelectedPsychologist(psychologist)
      setSelectedTimeSlot(null) // Reset time slot when psychologist changes

      // Refetch time slots for new psychologist
      if (selectedDate) {
        refetchTimeSlots()
      }
    },
    [selectedDate, refetchTimeSlots],
  )

  // Handle date selection
  const handleDateSelection = useCallback(
    (date) => {
      setSelectedDate(date)
      setSelectedTimeSlot(null) // Reset time slot when date changes

      // Refetch time slots for new date
      if (selectedPsychologist?.id) {
        refetchTimeSlots()
      }
    },
    [selectedPsychologist?.id, refetchTimeSlots],
  )

  // Handle time slot selection
  const handleTimeSlotSelection = useCallback((timeSlot) => {
    setSelectedTimeSlot(timeSlot)
  }, [])

  // Handle location selection
  const handleLocationSelection = useCallback((location) => {
    setSelectedLocation(location)
  }, [])

  // Handle booking submission - FIXED validation logic
  const handleBookingSubmit = useCallback(async () => {
    console.log("=== BOOKING SUBMIT VALIDATION ===")
    console.log("Selected method:", selectedMethod)
    console.log("Selected psychologist:", selectedPsychologist)
    console.log("Selected date:", selectedDate)
    console.log("Selected time slot:", selectedTimeSlot)
    console.log("Selected location:", selectedLocation)

    if (!selectedMethod || !selectedPsychologist || !selectedDate || !selectedTimeSlot) {
      throw new Error("Please fill in all required fields")
    }

    // ✅ FIXED: Only check location requirement for offline method
    if (selectedMethod.id === "offline" && !selectedLocation) {
      throw new Error("Please select a location for offline counseling")
    }

    const bookingData = {
      psychologistId: selectedPsychologist.id,
      method: selectedMethod.id,
      notes: notes.trim(),
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
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
    selectedPsychologist,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    config.defaultTimezone,
    createBookingMutation,
  ])

  // Validation helpers - FIXED
  const isFormValid = useCallback(() => {
    const hasRequiredFields = !!(selectedMethod && selectedPsychologist && selectedDate && selectedTimeSlot)

    // ✅ FIXED: Check location requirement only for offline method
    const hasLocationIfOffline = selectedMethod?.id !== "offline" || selectedLocation

    return hasRequiredFields && hasLocationIfOffline
  }, [selectedMethod, selectedPsychologist, selectedDate, selectedTimeSlot, selectedLocation])

  const getValidationErrors = useCallback(() => {
    const errors = []

    if (!selectedMethod) errors.push("Please select a counseling method")
    if (!selectedPsychologist) errors.push("Please select a psychologist")
    if (!selectedDate) errors.push("Please select a date")
    if (!selectedTimeSlot) errors.push("Please select a time slot")
    if (selectedMethod?.id === "offline" && !selectedLocation) {
      errors.push("Please select a location for offline counseling")
    }

    return errors
  }, [selectedMethod, selectedPsychologist, selectedDate, selectedTimeSlot, selectedLocation])

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
    if (!selectedMethod || !selectedPsychologist || !selectedDate || !selectedTimeSlot) {
      return null
    }

    return {
      method: selectedMethod,
      psychologist: selectedPsychologist,
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
  }, [selectedMethod, selectedPsychologist, selectedDate, selectedTimeSlot, selectedLocation, notes, bookingApi])

  // Loading states
  const loading = {
    methods: methodsLoading,
    psychologists: psychologistsLoading,
    locations: locationsLoading,
    timeSlots: timeSlotsLoading,
    creating: createBookingMutation.isPending,
  }

  // Error states
  const errors = {
    methods: methodsError,
    psychologists: psychologistsError,
    locations: locationsError,
    timeSlots: timeSlotsError,
    creating: createBookingMutation.error,
  }

  return {
    // Data
    counselingMethods,
    psychologists,
    locations,
    timeSlots,
    subscriptionInfo,
    config,

    // State
    selectedMethod,
    selectedPsychologist,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    showConfirmModal,

    // Handlers
    handleMethodSelection,
    handlePsychologistSelection,
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
    refetchPsychologists,
    refetchLocations,
    refetchTimeSlots,

    // Loading & Error states
    loading,
    errors,

    // Success states
    bookingCreated: createBookingMutation.isSuccess,
    createdBookingData: createBookingMutation.data,
  }
}
