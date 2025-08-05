// src/components/shared/booking/hooks/useBooking.js

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBookingApi, getBookingConfig } from '../lib/bookingApi';
import { useAuth } from '../../../../hooks/useAuth';

export const useBooking = (userType = "student") => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bookingApi = createBookingApi(userType);
  const config = getBookingConfig(userType);

  // State management
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Get available counseling methods
  const {
    data: counselingMethods,
    isLoading: methodsLoading,
    error: methodsError
  } = useQuery({
    queryKey: ['counseling-methods', userType],
    queryFn: () => bookingApi.getCounselingMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data?.data || []
  });

  // Get available psychologists
  const {
    data: psychologists,
    isLoading: psychologistsLoading,
    error: psychologistsError,
    refetch: refetchPsychologists
  } = useQuery({
    queryKey: ['psychologists', selectedMethod?.id],
    queryFn: () => bookingApi.getPsychologists({ 
      method: selectedMethod?.id,
      userType 
    }),
    enabled: !!selectedMethod?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => data?.data?.data || []
  });

  // Get available time slots
  const {
    data: timeSlots,
    isLoading: timeSlotsLoading,
    error: timeSlotsError,
    refetch: refetchTimeSlots
  } = useQuery({
    queryKey: ['time-slots', selectedPsychologist?.id, selectedDate, selectedMethod?.id],
    queryFn: () => bookingApi.getAvailableTimeSlots({
      psychologistId: selectedPsychologist?.id,
      date: selectedDate,
      method: selectedMethod?.id
    }),
    enabled: !!(selectedPsychologist?.id && selectedDate && selectedMethod?.id),
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data?.data || []
  });

  // Get user's subscription info (from user data)
  const subscriptionInfo = user?.organization ? {
    displayType: 'Organisasi',
    remainingQuota: user.organization.remainingQuota || 0,
    totalQuota: user.organization.totalQuota || 0
  } : null;

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => bookingApi.createBooking(bookingData),
    onSuccess: (data) => {
      console.log('Booking created successfully:', data);
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['booking-history'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-info'] });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
    },
    onError: (error) => {
      console.error('Booking creation failed:', error);
    }
  });

  // Auto-select first available psychologist when method changes
  useEffect(() => {
    if (psychologists && psychologists.length > 0 && selectedMethod && !selectedPsychologist) {
      setSelectedPsychologist(psychologists[0]);
    }
  }, [psychologists, selectedMethod, selectedPsychologist]);

  // Handle method selection
  const handleMethodSelection = useCallback((method) => {
    setSelectedMethod(method);
    setSelectedPsychologist(null); // Reset psychologist when method changes
    setSelectedTimeSlot(null); // Reset time slot
  }, []);

  // Handle psychologist selection
  const handlePsychologistSelection = useCallback((psychologist) => {
    setSelectedPsychologist(psychologist);
    setSelectedTimeSlot(null); // Reset time slot when psychologist changes
    
    // Refetch time slots for new psychologist
    if (selectedDate) {
      refetchTimeSlots();
    }
  }, [selectedDate, refetchTimeSlots]);

  // Handle date selection
  const handleDateSelection = useCallback((date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
    
    // Refetch time slots for new date
    if (selectedPsychologist?.id) {
      refetchTimeSlots();
    }
  }, [selectedPsychologist?.id, refetchTimeSlots]);

  // Handle time slot selection
  const handleTimeSlotSelection = useCallback((timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  }, []);

  // Handle booking submission
  const handleBookingSubmit = useCallback(async () => {
    if (!selectedMethod || !selectedPsychologist || !selectedDate || !selectedTimeSlot) {
      throw new Error('Please fill in all required fields');
    }

    const bookingData = {
      psychologistId: selectedPsychologist.id,
      method: selectedMethod.id,
      notes: notes.trim(),
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      timezone: config.defaultTimezone
    };

    const result = await createBookingMutation.mutateAsync(bookingData);
    return result?.data?.data || result;
  }, [
    selectedMethod,
    selectedPsychologist,
    selectedDate,
    selectedTimeSlot,
    notes,
    config.defaultTimezone,
    createBookingMutation
  ]);

  // Validation helpers
  const isFormValid = useCallback(() => {
    return !!(
      selectedMethod &&
      selectedPsychologist &&
      selectedDate &&
      selectedTimeSlot
    );
  }, [selectedMethod, selectedPsychologist, selectedDate, selectedTimeSlot]);

  const getValidationErrors = useCallback(() => {
    const errors = [];
    
    if (!selectedMethod) errors.push('Please select a counseling method');
    if (!selectedPsychologist) errors.push('Please select a psychologist');
    if (!selectedDate) errors.push('Please select a date');
    if (!selectedTimeSlot) errors.push('Please select a time slot');
    
    return errors;
  }, [selectedMethod, selectedPsychologist, selectedDate, selectedTimeSlot]);

  // Reset booking form
  const resetBookingForm = useCallback(() => {
    setSelectedMethod(null);
    setSelectedPsychologist(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setNotes('');
    setShowConfirmModal(false);
  }, []);

  // Format helpers
  const formatSelectedBooking = useCallback(() => {
    if (!selectedMethod || !selectedPsychologist || !selectedDate || !selectedTimeSlot) {
      return null;
    }

    return {
      method: selectedMethod,
      psychologist: selectedPsychologist,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      notes: notes,
      formattedDateTime: bookingApi.formatBookingDateTime(
        selectedDate,
        selectedTimeSlot.startTime,
        selectedTimeSlot.endTime
      )
    };
  }, [selectedMethod, selectedPsychologist, selectedDate, selectedTimeSlot, notes, bookingApi]);

  // Loading states
  const loading = {
    methods: methodsLoading,
    psychologists: psychologistsLoading,
    timeSlots: timeSlotsLoading,
    subscription: subscriptionLoading,
    creating: createBookingMutation.isPending
  };

  // Error states
  const errors = {
    methods: methodsError,
    psychologists: psychologistsError,
    timeSlots: timeSlotsError,
    subscription: subscriptionError,
    creating: createBookingMutation.error
  };

  return {
    // Data
    counselingMethods,
    psychologists,
    timeSlots,
    subscriptionInfo,
    config,

    // State
    selectedMethod,
    selectedPsychologist,
    selectedDate,
    selectedTimeSlot,
    notes,
    showConfirmModal,

    // Handlers
    handleMethodSelection,
    handlePsychologistSelection,
    handleDateSelection,
    handleTimeSlotSelection,
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
    refetchTimeSlots,

    // Loading & Error states
    loading,
    errors,

    // Success states
    bookingCreated: createBookingMutation.isSuccess,
    createdBookingData: createBookingMutation.data
  };
};