import { useState, useEffect, useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBookingApi, getBookingConfig } from "../lib/bookingApi"

const STALE_TIME = {
  METHODS: 5 * 60 * 1000,
  AVAILABILITY: 3 * 60 * 1000,
  LOCATIONS: 10 * 60 * 1000,
  BOOKED_SLOTS: 1 * 60 * 1000,
}

const FIXED_SLOTS = [
  { start: '09:00:00', end: '10:00:00' },
  { start: '10:00:00', end: '11:00:00' },
  { start: '11:00:00', end: '12:00:00' },
  { start: '13:00:00', end: '14:00:00' },
  { start: '14:00:00', end: '15:00:00' },
  { start: '15:00:00', end: '16:00:00' },
  { start: '16:00:00', end: '17:00:00' },
]

const FALLBACK_DAYS_AHEAD = 28

const extractPsychologistIds = (availabilityData) => {
  const ids = new Set()
  availabilityData.forEach((slot) => {
    if (slot.psychologistId) ids.add(slot.psychologistId)
    if (slot.psychologist?.id) ids.add(slot.psychologist.id)
    if (Array.isArray(slot.availablePsychologistIds)) {
      slot.availablePsychologistIds.forEach((id) => ids.add(id))
    }
  })
  return ids
}

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const isSlotAvailableByData = (slot) => {
  if (typeof slot.bookedPsychologists === 'number') {
    return slot.bookedPsychologists === 0
  }
  if (typeof slot.availablePsychologists === 'number') {
    return slot.availablePsychologists === slot.totalPsychologists
  }
  if (typeof slot.isBooked === 'boolean') {
    return slot.isBooked === false
  }
  const scheduledCount = slot.scheduledSessions?.length || 0
  return !slot.hasScheduledSessions || scheduledCount < 1
}
export const useBooking = (userType = 'student') => {
  const queryClient = useQueryClient()
  const bookingApi = useMemo(() => createBookingApi(userType), [userType])
  const config = useMemo(() => getBookingConfig(userType), [userType])
  const availabilityThreshold = Number(import.meta.env?.VITE_BOOKING_MIN_AVAILABLE_PSY || 1)

  const [selectedMethod, setSelectedMethod] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [notes, setNotes] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Check if user already has an active booking (1 person = 1 active booking)
  const { data: existingBookings } = useQuery({
    queryKey: ['booking-history', 'active-check'],
    queryFn: () => bookingApi.getBookingHistory(),
    staleTime: 30 * 1000,
    select: (res) => {
      const sessions = res?.data?.data || []
      return sessions.filter(s => ['scheduled', 'confirmed', 'pending'].includes(s.status))
    },
  })

  const hasActiveBooking = existingBookings?.length > 0
  const activeBookingInfo = existingBookings?.[0] || null

  const {
    data: counselingMethods,
    isLoading: methodsLoading,
    error: methodsError,
  } = useQuery({
    queryKey: ['counseling-methods', userType],
    queryFn: () => bookingApi.getCounselingMethods(),
    staleTime: STALE_TIME.METHODS,
    select: (data) => data?.data || [],
  })

  const {
    data: psychologistAvailability,
    isLoading: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ['psychologist-availability'],
    queryFn: () => bookingApi.getAvailableTimeSlots(),
    staleTime: STALE_TIME.AVAILABILITY,
    select: (data) => data?.data || [],
  })

  const {
    data: locations,
    isLoading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ['counseling-locations'],
    queryFn: () => bookingApi.getLocations(),
    enabled: selectedMethod?.id === 'offline',
    staleTime: STALE_TIME.LOCATIONS,
    select: (data) => data?.data || [],
  })
  const availableDates = useMemo(() => {
    if (!psychologistAvailability || psychologistAvailability.length === 0) return []

    const dated = psychologistAvailability.filter((slot) => !!slot.date)
    if (dated.length > 0) {
      const byDate = dated.reduce((acc, s) => {
        ;(acc[s.date] ||= []).push(s)
        return acc
      }, {})

      return Object.entries(byDate)
        .filter(([, slots]) =>
          slots.some((s) => isSlotAvailableByData(s))
        )
        .map(([dateStr]) => ({
          value: dateStr,
          label: formatDateLabel(dateStr),
          dayOfWeek: new Date(dateStr).getDay(),
        }))
    }

    const today = new Date()
    const availableDaysOfWeek = [
      ...new Set(psychologistAvailability.map((slot) => slot.dayOfWeek)),
    ]
    const dates = []

    for (let i = 0; i <= FALLBACK_DAYS_AHEAD; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayOfWeek = date.getDay()
      if (availableDaysOfWeek.includes(dayOfWeek)) {
        const value = date.toISOString().split('T')[0]
        dates.push({ value, label: formatDateLabel(value), dayOfWeek })
      }
    }
    return dates
  }, [psychologistAvailability])

  const fullyBookedDates = useMemo(() => {
    if (!psychologistAvailability || psychologistAvailability.length === 0) return []

    const dated = psychologistAvailability.filter((slot) => !!slot.date)
    if (dated.length === 0) return []

    const byDate = dated.reduce((acc, s) => {
      ;(acc[s.date] ||= []).push(s)
      return acc
    }, {})

    return Object.entries(byDate)
      .filter(([, slots]) =>
        slots.every((s) => !isSlotAvailableByData(s))
      )
      .map(([dateStr]) => dateStr)
  }, [psychologistAvailability])
  const {
    data: bookedSlotsData,
    isLoading: bookedSlotsLoading,
  } = useQuery({
    queryKey: ['booked-slots', selectedDate],
    queryFn: async () => {
      if (!selectedDate || !psychologistAvailability?.length) {
        return { bookedSlots: [], availableSlots: [] }
      }

      const psychologistIds = extractPsychologistIds(psychologistAvailability)
      if (psychologistIds.size === 0) {
        return { bookedSlots: [], availableSlots: [] }
      }

      const allBookedSlots = []
      const allAvailableSlots = []

      for (const psychologistId of psychologistIds) {
        try {
          const result = await bookingApi.getBookedSlots(psychologistId, selectedDate)
          if (result.status === 'success' && result.data) {
            result.data.bookedSlots?.forEach((slot) =>
              allBookedSlots.push({
                ...slot,
                psychologistId: result.data.psychologistId,
                isBooked: true,
              })
            )
            result.data.availableSlots?.forEach((slot) =>
              allAvailableSlots.push({
                ...slot,
                psychologistId: result.data.psychologistId,
                isBooked: false,
              })
            )
          }
        } catch {
          // Suppress per-psychologist errors — fallback logic handles missing data
        }
      }

      return { bookedSlots: allBookedSlots, availableSlots: allAvailableSlots }
    },
    enabled: !!selectedDate && !!psychologistAvailability?.length,
    staleTime: STALE_TIME.BOOKED_SLOTS,
    retry: false,
  })
  const timeSlots = useMemo(() => {
    if (!selectedDate) return []

    const now = new Date()
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const isToday = selectedDate === todayStr
    const currentHHMM = isToday
      ? now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
      : null

    const hasBookedSlotsData =
      bookedSlotsData &&
      (bookedSlotsData.bookedSlots?.length > 0 || bookedSlotsData.availableSlots?.length > 0)

    if (hasBookedSlotsData) {
      const { bookedSlots = [], availableSlots = [] } = bookedSlotsData
      const combinedSlots = [...bookedSlots, ...availableSlots].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      )
      const dated = (psychologistAvailability || []).filter((a) => a.date === selectedDate)

      return FIXED_SLOTS.map((fixedSlot, index) => {
        const fixedStart = fixedSlot.start.substring(0, 5)
        const fixedEnd = fixedSlot.end.substring(0, 5)
        const isPast = isToday && fixedStart <= currentHHMM

        const matchingSlot = combinedSlots.find(
          (slot) =>
            slot.startTime.substring(0, 5) === fixedStart &&
            slot.endTime.substring(0, 5) === fixedEnd
        )
        const generalSlot = dated.find(
          (a) =>
            a.startTime.substring(0, 5) === fixedStart &&
            a.endTime?.substring(0, 5) === fixedEnd
        )

        let isAvailable = false
        let isBooked = false
        let reason = 'Tidak ada psikolog tersedia'
        let psychologistId = matchingSlot?.psychologistId
        const psychologistName = matchingSlot?.psychologistName || 'Psikolog Tersedia'

        if (isPast) {
          reason = 'Jam sudah lewat'
        } else if (generalSlot && typeof generalSlot.availablePsychologists === 'number') {
          isAvailable = generalSlot.bookedPsychologists === 0
          isBooked = generalSlot.bookedPsychologists > 0
          reason = isAvailable ? undefined : 'Sudah Terbooking'
          if (isAvailable && generalSlot.availablePsychologistIds?.length > 0) {
            psychologistId = psychologistId || generalSlot.availablePsychologistIds[0]
          }
        } else if (matchingSlot) {
          isAvailable = !matchingSlot.isBooked
          isBooked = matchingSlot.isBooked
          reason = isBooked ? matchingSlot.bookingInfo || 'Sudah dibooking' : undefined
        }

        return {
          startTime: fixedStart,
          endTime: fixedEnd,
          psychologistId,
          psychologistName,
          available: isAvailable,
          isBooked,
          displayTime: fixedStart + ' - ' + fixedEnd + ' WIB',
          uniqueId: selectedDate + '-' + fixedSlot.start + '-' + fixedSlot.end + '-' + index,
          reason,
        }
      })
    }

    if (!psychologistAvailability?.length) return []

    const dayOfWeek = new Date(selectedDate).getDay()
    const dayAvailability = psychologistAvailability.filter((a) => a.dayOfWeek === dayOfWeek)
    const hasDated = dayAvailability.some((a) => !!a.date)
    const source = hasDated
      ? dayAvailability.filter((a) => a.date === selectedDate)
      : dayAvailability

    const allSlots = FIXED_SLOTS.map((fixedSlot, index) => {
      const fixedStart = fixedSlot.start.substring(0, 5)
      const fixedEnd = fixedSlot.end.substring(0, 5)

      const matchingAvailability = source.find(
        (a) =>
          a.startTime.substring(0, 5) === fixedStart &&
          a.endTime.substring(0, 5) === fixedEnd
      )

      let isAvailable = false
      let psychologistId
      let psychologistName = 'Psikolog Tersedia'
      let availablePsychologistIds = []
      let scheduledSessionsCount = 0
      let reason = 'Tidak ada psikolog tersedia'

      if (matchingAvailability) {
        const isPast = isToday && fixedStart <= currentHHMM

        if (isPast) {
          reason = 'Jam sudah lewat'
        } else if (typeof matchingAvailability.availablePsychologists === 'number') {
          isAvailable = matchingAvailability.bookedPsychologists === 0
          reason = isAvailable
            ? undefined
            : 'Sudah Terbooking'
        } else if (typeof matchingAvailability.isBooked === 'boolean') {
          isAvailable = matchingAvailability.isBooked === false
          reason = isAvailable ? undefined : 'Sudah dibooking'
        } else {
          scheduledSessionsCount = matchingAvailability.scheduledSessions?.length || 0
          isAvailable = !matchingAvailability.hasScheduledSessions || scheduledSessionsCount < 2
          reason = isAvailable ? undefined : 'Psikolog tidak tersedia'
        }

        psychologistId =
          matchingAvailability.psychologist?.id ||
          matchingAvailability.psychologistId ||
          matchingAvailability.availablePsychologistIds?.[0]

        psychologistName =
          matchingAvailability.psychologist?.fullName ||
          matchingAvailability.psychologistName ||
          (isAvailable ? 'Psikolog Tersedia' : 'Unknown Psychologist')

        availablePsychologistIds = matchingAvailability.availablePsychologistIds || []
      }

      return {
        startTime: fixedStart,
        endTime: fixedEnd,
        psychologistName,
        psychologistId,
        availablePsychologistIds,
        available: isAvailable,
        displayTime: isAvailable
          ? fixedStart + ' - ' + fixedEnd + ' WIB'
          : fixedStart + ' - ' + fixedEnd + ' WIB (' + (reason || 'Tidak tersedia') + ')',
        uniqueId: selectedDate + '-' + fixedSlot.start + '-' + fixedSlot.end + '-' + index,
        scheduledSessionsCount,
        hasScheduledSessions: matchingAvailability?.hasScheduledSessions || false,
        reason,
      }
    })

    allSlots.sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.available === b.available ? 0 : a.available ? -1 : 1
      }
      return a.startTime.localeCompare(b.startTime)
    })

    return allSlots
  }, [selectedDate, psychologistAvailability, bookedSlotsData, availabilityThreshold])
  const availableQuota = useMemo(() => {
    if (!psychologistAvailability?.length) return 0
    return psychologistAvailability.filter((slot) =>
      isSlotAvailableByData(slot)
    ).length
  }, [psychologistAvailability])

  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => bookingApi.createBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-history'] })
      queryClient.invalidateQueries({ queryKey: ['psychologist-availability'] })
      queryClient.invalidateQueries({ queryKey: ['booked-slots'] })
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] })
    },
  })

  // Reset dependent fields when counseling method changes
  useEffect(() => {
    setSelectedDate('')
    setSelectedTimeSlot(null)
    if (selectedMethod?.id !== 'offline') {
      setSelectedLocation(null)
    }
  }, [selectedMethod])

  const handleMethodSelection = useCallback((method) => {
    setSelectedMethod(method)
  }, [])

  const handleDateSelection = useCallback((date) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
  }, [])

  const handleTimeSlotSelection = useCallback((timeSlot) => {
    if (timeSlot.available) {
      setSelectedTimeSlot(timeSlot)
    }
  }, [])

  const handleLocationSelection = useCallback((location) => {
    setSelectedLocation(location)
  }, [])

  const handleBookingSubmit = useCallback(async () => {
    // Prevent double submission
    if (createBookingMutation.isPending) {
      throw new Error('Booking already in progress')
    }

    // Prevent double booking: 1 person = 1 active booking
    if (hasActiveBooking) {
      throw new Error('Anda sudah memiliki sesi konseling aktif. Batalkan atau selesaikan sesi sebelumnya terlebih dahulu.')
    }

    if (!selectedMethod || !selectedDate || !selectedTimeSlot) {
      throw new Error('Please fill in all required fields')
    }
    if (!selectedTimeSlot.available) {
      throw new Error('Selected time slot is no longer available')
    }
    if (selectedMethod.id === 'offline' && !selectedLocation) {
      throw new Error('Please select a location for offline counseling')
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

    if (selectedMethod.id === 'offline' && selectedLocation) {
      bookingData.locationId = selectedLocation.id
    }

    // Fallback: use first available psychologist ID if slot did not carry one
    if (!bookingData.psychologistId && selectedTimeSlot.availablePsychologistIds?.length > 0) {
      bookingData.psychologistId = selectedTimeSlot.availablePsychologistIds[0]
    }

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
    hasActiveBooking,
  ])

  const isFormValid = useCallback(() => {
    const hasRequiredFields = !!(selectedMethod && selectedDate && selectedTimeSlot)
    const isTimeSlotAvailable = selectedTimeSlot?.available === true
    const hasLocationIfOffline = selectedMethod?.id !== 'offline' || !!selectedLocation
    return hasRequiredFields && isTimeSlotAvailable && hasLocationIfOffline
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation])

  const getValidationErrors = useCallback(() => {
    const errors = []
    if (!selectedMethod) errors.push('Please select a counseling method')
    if (!selectedDate) errors.push('Please select a date')
    if (!selectedTimeSlot) errors.push('Please select a time slot')
    if (selectedTimeSlot && !selectedTimeSlot.available) {
      errors.push('Selected time slot is not available')
    }
    if (selectedMethod?.id === 'offline' && !selectedLocation) {
      errors.push('Please select a location for offline counseling')
    }
    return errors
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation])

  const resetBookingForm = useCallback(() => {
    setSelectedMethod(null)
    setSelectedDate('')
    setSelectedTimeSlot(null)
    setSelectedLocation(null)
    setNotes('')
    setShowConfirmModal(false)
  }, [])

  const formatSelectedBooking = useCallback(() => {
    if (!selectedMethod || !selectedDate || !selectedTimeSlot) return null
    return {
      method: selectedMethod,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      location: selectedLocation,
      notes,
      formattedDateTime: bookingApi.formatBookingDateTime(
        selectedDate,
        selectedTimeSlot.startTime,
        selectedTimeSlot.endTime
      ),
    }
  }, [selectedMethod, selectedDate, selectedTimeSlot, selectedLocation, notes, bookingApi])
  const loading = {
    methods: methodsLoading,
    locations: locationsLoading,
    timeSlots: bookedSlotsLoading,
    availableDates: availabilityLoading,
    quota: availabilityLoading,
    creating: createBookingMutation.isPending,
  }

  const errors = {
    methods: methodsError,
    locations: locationsError,
    timeSlots: null,
    availableDates: availabilityError,
    quota: availabilityError,
    creating: createBookingMutation.error,
  }

  return {
    counselingMethods,
    locations,
    timeSlots,
    availableDates,
    availableQuota,
    fullyBookedDates,
    config,

    selectedMethod,
    selectedDate,
    selectedTimeSlot,
    selectedLocation,
    notes,
    showConfirmModal,

    handleMethodSelection,
    handleDateSelection,
    handleTimeSlotSelection,
    handleLocationSelection,
    handleBookingSubmit,
    setNotes,
    setShowConfirmModal,

    isFormValid,
    getValidationErrors,

    resetBookingForm,
    formatSelectedBooking,
    refetchLocations,
    refetchAvailability,

    loading,
    errors,

    hasActiveBooking,
    activeBookingInfo,

    bookingCreated: createBookingMutation.isSuccess,
    createdBookingData: createBookingMutation.data,
  }
}
