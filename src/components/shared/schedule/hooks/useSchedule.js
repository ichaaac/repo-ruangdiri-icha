// src/components/shared/schedule/hooks/useSchedule.js - FIXED IMMEDIATE UPDATE AFTER EDIT

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createScheduleApi } from '../lib/scheduleApi.js';
import { toast } from "sonner";

const scheduleKeys = {
  all: ['schedules'],
  lists: () => [...scheduleKeys.all, 'list'],
  list: (params) => [...scheduleKeys.lists(), params],
  details: () => [...scheduleKeys.all, 'detail'],
  detail: (id) => [...scheduleKeys.details(), id],
  counselingQueue: ['counseling-queue'],
  notifications: ['notifications'],
};

export const useSchedule = (type = "school") => {
  const queryClient = useQueryClient();
  const scheduleApi = useMemo(() => createScheduleApi(type), [type]);
  
  // Local state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return weekStart;
  });

  // Week params helper
  const getWeekParams = useCallback((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      from: weekStart.toISOString().split('T')[0],
      to: weekEnd.toISOString().split('T')[0],
      timezone: 'WIB'
    };
  }, []);

  const weekParams = useMemo(() => getWeekParams(selectedWeek), [selectedWeek, getWeekParams]);

  // ===== SCHEDULES QUERY =====
  const schedulesQuery = useQuery({
    queryKey: scheduleKeys.list(weekParams),
    queryFn: async () => {
      try {
        const response = await scheduleApi.getSchedules(weekParams);
        if (response.data?.status === 'success') {
          return response.data.data || [];
        }
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Error fetching schedules:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch schedules');
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!selectedWeek,
    retry: (failureCount, error) => {
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // ===== COUNSELING QUEUE QUERY =====
  const counselingQueueQuery = useQuery({
    queryKey: scheduleKeys.counselingQueue,
    queryFn: async () => {
      try {
        const response = await scheduleApi.getCounselingQueue();
        if (response.data?.status === 'success') {
          return response.data.data || [];
        }
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Error fetching counseling queue:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch counseling queue');
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  // ===== NOTIFICATIONS QUERY =====
  const notificationsQuery = useQuery({
    queryKey: scheduleKeys.notifications,
    queryFn: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
  });

  // ===== CREATE SCHEDULE MUTATION =====
  const createScheduleMutation = useMutation({
    mutationFn: async (formData) => {
      try {
        console.log('Creating schedule with payload:', formData);
        const response = await scheduleApi.createSchedule(formData);
        return response.data;
      } catch (error) {
        console.error('Create schedule error:', error);
        throw new Error(error.response?.data?.message || 'Failed to create schedule');
      }
    },
    onMutate: async (newSchedule) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));

      if (previousSchedules && newSchedule.dates && newSchedule.dates.length > 0) {
        const firstDate = newSchedule.dates[0];
        const optimisticSchedule = {
          id: `temp-${Date.now()}`,
          agenda: newSchedule.agenda,
          startDateTime: `${firstDate.date}T${firstDate.startTime}:00`,
          endDateTime: `${firstDate.date}T${firstDate.endTime}:00`,
          type: newSchedule.type,
          location: newSchedule.location || newSchedule.customLocation,
          description: newSchedule.description,
          dates: newSchedule.dates,
          timezone: firstDate.timezone || 'WIB',
          isOptimistic: true,
        };
        
        queryClient.setQueryData(
          scheduleKeys.list(weekParams),
          [...previousSchedules, optimisticSchedule]
        );
      }

      return { previousSchedules };
    },
    onError: (err, newSchedule, context) => {
      console.error('Create schedule mutation error:', err);
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
      toast.error(err.message);
    },
    onSuccess: (data) => {
      console.log('Schedule created successfully:', data);
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
    }
  });

  // ===== FIXED: UPDATE SCHEDULE MUTATION - BETTER ERROR HANDLING =====
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, formData }) => {
      try {
        console.log('Updating schedule:', scheduleId, formData);
        const response = await scheduleApi.updateSchedule(scheduleId, formData);
        console.log('Update response:', response);
        return { scheduleId, data: response.data };
      } catch (error) {
        console.error('Update schedule error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        throw new Error(error.response?.data?.message || error.message || 'Failed to update schedule');
      }
    },
    onMutate: async ({ scheduleId, formData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });
      await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      
      // Snapshot the previous values
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));
      const previousDetail = queryClient.getQueryData(scheduleKeys.detail(scheduleId));
      
      // FIXED: Optimistically update main schedules list with full transformation
      if (previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), (old) => {
          return old.map(schedule => {
            if (schedule.id === scheduleId) {
              // Create updated schedule object with proper transformation
              const updatedSchedule = {
                ...schedule,
                agenda: formData.agenda,
                description: formData.description,
                type: formData.type,
                notificationOffset: formData.notificationOffset,
                // Handle location properly based on type
                location: formData.type === "counseling" ? formData.location : (schedule.location || null),
                customLocation: formData.type !== "counseling" ? formData.customLocation : (schedule.customLocation || null),
                // Update dates if provided
                dates: formData.dates || schedule.dates,
                // Update participants if provided
                ...(formData.participants && {
                  participants: [
                    ...(formData.selectedPsychologist ? [formData.selectedPsychologist] : []),
                    ...(formData.selectedParticipants || [])
                  ]
                }),
                // Update times if dates changed
                ...(formData.dates && formData.dates.length > 0 && {
                  startDateTime: `${formData.dates[0].date}T${formData.dates[0].startTime}:00`,
                  endDateTime: `${formData.dates[0].date}T${formData.dates[0].endTime}:00`,
                }),
                isOptimistic: true,
                lastUpdated: new Date().toISOString()
              };
              
              console.log('Optimistic update applied:', updatedSchedule);
              return updatedSchedule;
            }
            return schedule;
          });
        });
      }
      
      // FIXED: Also update detail cache if exists
      if (previousDetail) {
        const updatedDetail = {
          ...previousDetail,
          agenda: formData.agenda,
          description: formData.description,
          type: formData.type,
          notificationOffset: formData.notificationOffset,
          location: formData.type === "counseling" ? formData.location : (previousDetail.location || null),
          customLocation: formData.type !== "counseling" ? formData.customLocation : (previousDetail.customLocation || null),
          dates: formData.dates || previousDetail.dates,
          ...(formData.participants && {
            participants: [
              ...(formData.selectedPsychologist ? [formData.selectedPsychologist] : []),
              ...(formData.selectedParticipants || [])
            ]
          }),
          isOptimistic: true,
          lastUpdated: new Date().toISOString()
        };
        
        queryClient.setQueryData(scheduleKeys.detail(scheduleId), updatedDetail);
      }
      
      return { previousSchedules, previousDetail };
    },
    onError: (err, { scheduleId }, context) => {
      console.error('Update schedule mutation error:', err);
      console.error('Error context:', context);
      
      // Rollback on error
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(scheduleKeys.detail(scheduleId), context.previousDetail);
      }
      
      // FIXED: Better error toast
      const errorMessage = err.message || 'Failed to update schedule';
      console.error('Displaying error toast:', errorMessage);
      toast.error(errorMessage, {
        description: 'Please try again or contact support if the problem persists.',
        duration: 5000,
      });
    },
    onSuccess: (result, { scheduleId }) => {
      console.log('Schedule updated successfully:', result);
      
      // FIXED: Apply real server data immediately
      const serverData = result.data?.data || result.data;
      
      if (serverData) {
        // Update main schedules list with server data
        queryClient.setQueryData(scheduleKeys.list(weekParams), (old) => {
          if (!old) return old;
          return old.map(schedule => 
            schedule.id === scheduleId 
              ? { 
                  ...schedule, 
                  ...serverData, 
                  isOptimistic: false,
                  lastUpdated: new Date().toISOString()
                }
              : schedule
          );
        });
        
        // Update detail cache with server data
        queryClient.setQueryData(scheduleKeys.detail(scheduleId), {
          ...serverData,
          isOptimistic: false,
          lastUpdated: new Date().toISOString()
        });
      }
      
      // FIXED: Force refresh after a short delay to ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
        queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
        queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
      }, 500);
      
      toast.success('Schedule updated successfully');
    }
  });

  // ===== DELETE SCHEDULE MUTATION =====
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId) => {
      try {
        await scheduleApi.deleteSchedule(scheduleId);
        return scheduleId;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete schedule');
      }
    },
    onMutate: async (scheduleId) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));

      if (previousSchedules) {
        queryClient.setQueryData(
          scheduleKeys.list(weekParams),
          previousSchedules.filter(schedule => schedule.id !== scheduleId)
        );
      }

      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
      toast.error(err.message);
    },
    onSuccess: (scheduleId) => {
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      toast.success('Schedule deleted successfully');
    }
  });

  // ===== HANDLERS =====
  const handleWeekSelect = useCallback((weekStart) => {
    setSelectedWeek(weekStart);
  }, []);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    setSelectedWeek(weekStart);
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue }),
      queryClient.invalidateQueries({ queryKey: scheduleKeys.notifications }),
    ]);
  }, [queryClient]);

  // ===== HELPER FUNCTIONS =====
  const getSchedulesForDate = useCallback((date) => {
    const schedules = schedulesQuery.data || [];
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      return scheduleDate.toDateString() === date.toDateString();
    });
  }, [schedulesQuery.data]);

  const getScheduleAtTime = useCallback((date, timeSlot) => {
    const schedules = schedulesQuery.data || [];
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      return scheduleDate.toDateString() === date.toDateString();
    });
    
    return daySchedules.find(schedule => {
      const scheduleTime = new Date(schedule.startDateTime);
      const hour = scheduleTime.getHours();
      const minute = scheduleTime.getMinutes();
      const [timeHour, timeMinute] = timeSlot.split(':').map(Number);
      return hour === timeHour && minute === timeMinute;
    });
  }, [schedulesQuery.data]);

  // ===== FIXED: SIMPLIFIED EDIT/DELETE FUNCTIONS WITH IMMEDIATE UPDATE =====
  const handleEditSchedule = useCallback(async (scheduleId, formData) => {
    try {
      console.log('=== handleEditSchedule called ===');
      console.log('Schedule ID:', scheduleId);
      console.log('Form Data:', formData);
      
      const result = await updateScheduleMutation.mutateAsync({ scheduleId, formData });
      
      console.log('=== Edit result ===');
      console.log('Result:', result);
      
      return result; // Return result for attachment handling
    } catch (error) {
      console.error('Error in handleEditSchedule:', error);
      throw error; // Re-throw so ViewSchedule can handle it
    }
  }, [updateScheduleMutation]);

  const handleDeleteSchedule = useCallback(async (schedule) => {
    try {
      await deleteScheduleMutation.mutateAsync(schedule.id);
    } catch (error) {
      console.error('Error in handleDeleteSchedule:', error);
      throw error;
    }
  }, [deleteScheduleMutation]);

  // ===== COMPUTED VALUES =====
  const loading = {
    schedules: schedulesQuery.isLoading,
    queue: counselingQueueQuery.isLoading,
    notifications: notificationsQuery.isLoading,
    submit: createScheduleMutation.isPending || 
            updateScheduleMutation.isPending || 
            deleteScheduleMutation.isPending,
  };

  const error = {
    schedules: schedulesQuery.error?.message || null,
    queue: counselingQueueQuery.error?.message || null,
    notifications: notificationsQuery.error?.message || null,
    submit: createScheduleMutation.error?.message || 
            updateScheduleMutation.error?.message || 
            deleteScheduleMutation.error?.message || null,
  };

  const isLoading = Object.values(loading).some(Boolean);
  const hasError = Object.values(error).some(val => val !== null);

  // ===== RETURN =====
  return {
    // State
    selectedDate,
    selectedWeek,
    schedules: schedulesQuery.data || [],
    counselingQueue: counselingQueueQuery.data || [],
    notifications: notificationsQuery.data || [],
    loading,
    error,
    
    // Query status
    isSchedulesLoading: schedulesQuery.isLoading,
    isSchedulesError: schedulesQuery.isError,
    schedulesError: schedulesQuery.error,
    
    // Actions
    setSelectedDate: handleDateSelect,
    setSelectedWeek: handleWeekSelect,
    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: (scheduleId, formData) => 
      updateScheduleMutation.mutateAsync({ scheduleId, formData }),
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    refreshData,
    
    // FIXED: Simplified handlers for ViewSchedule
    handleEditSchedule,
    handleDeleteSchedule,
    
    // Manual refetch methods
    loadSchedules: schedulesQuery.refetch,
    loadCounselingQueue: counselingQueueQuery.refetch,
    loadNotifications: notificationsQuery.refetch,
    
    // Computed values
    isLoading,
    hasError,
    
    // Helper functions
    getSchedulesForDate,
    getScheduleAtTime,
    
    // Mutation objects for additional control
    createMutation: createScheduleMutation,
    updateMutation: updateScheduleMutation,
    deleteMutation: deleteScheduleMutation,
    
    // Cache control
    invalidateSchedules: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
    invalidateQueue: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue }),
    invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.notifications }),
  };
};