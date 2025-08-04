// src/components/shared/schedule/hooks/useSchedule.js - FIXED LOADING STATES

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

  // SCHEDULES QUERY
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

  // COUNSELING QUEUE QUERY
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

  // NOTIFICATIONS QUERY
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

  // FIXED: CREATE SCHEDULE MUTATION - Ensure proper completion
  const createScheduleMutation = useMutation({
    mutationFn: async (formData) => {
      try {
        console.log('=== CREATE MUTATION START ===');
        const response = await scheduleApi.createSchedule(formData);
        console.log('=== CREATE MUTATION SUCCESS ===', response);
        return response.data;
      } catch (error) {
        console.error('=== CREATE MUTATION ERROR ===', error);
        throw error;
      }
    },
    onMutate: async (newSchedule) => {
      console.log('=== CREATE MUTATION ON_MUTATE ===');
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
      console.log('=== CREATE MUTATION ON_ERROR ===', err);
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
      toast.error(err.message || 'Failed to create schedule');
    },
    onSuccess: (data) => {
  console.log('=== CREATE MUTATION ON_SUCCESS ===', data);
  // Biarkan hanya logic untuk invalidasi data, jangan ada UI feedback di sini
  queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
  queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
},
    onSettled: () => {
      console.log('=== CREATE MUTATION ON_SETTLED ===');
      // FIXED: Force completion - mutation is definitely done at this point
    },
    retry: false, // FIXED: Don't retry failed creates to avoid confusion
  });

  // UPDATE SCHEDULE MUTATION (unchanged - working fine)
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, formData }) => {
      const response = await scheduleApi.updateSchedule(scheduleId, formData);
      return { scheduleId, data: response.data };
    },
    onMutate: async ({ scheduleId, formData }) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });
      await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));
      const previousDetail = queryClient.getQueryData(scheduleKeys.detail(scheduleId));
      
      if (previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), (old) => {
          return old.map(schedule => {
            if (schedule.id === scheduleId) {
              return {
                ...schedule,
                agenda: formData.agenda,
                description: formData.description,
                type: formData.type,
                notificationOffset: formData.notificationOffset,
                location: formData.type === "counseling" ? formData.location : (schedule.location || null),
                customLocation: formData.type !== "counseling" ? formData.customLocation : (schedule.customLocation || null),
                dates: formData.dates || schedule.dates,
                ...(formData.participants && {
                  participants: [
                    ...(formData.selectedPsychologist ? [formData.selectedPsychologist] : []),
                    ...(formData.selectedParticipants || [])
                  ]
                }),
                ...(formData.dates && formData.dates.length > 0 && {
                  startDateTime: `${formData.dates[0].date}T${formData.dates[0].startTime}:00`,
                  endDateTime: `${formData.dates[0].date}T${formData.dates[0].endTime}:00`,
                }),
                isOptimistic: true,
                lastUpdated: new Date().toISOString()
              };
            }
            return schedule;
          });
        });
      }
      
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
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(scheduleKeys.detail(scheduleId), context.previousDetail);
      }
      
      toast.error(err.message || 'Failed to update schedule');
    },
    onSuccess: (result, { scheduleId }) => {
      const serverData = result.data?.data || result.data;
      
      if (serverData && typeof serverData === 'object' && serverData.id) {
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
        
        queryClient.setQueryData(scheduleKeys.detail(scheduleId), {
          ...serverData,
          isOptimistic: false,
          lastUpdated: new Date().toISOString()
        });
      }
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
        queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
        queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
      }, 500);
      
      toast.success('Jadwal berhasil diperbarui');
    },
  });

  // FIXED: DELETE SCHEDULE MUTATION - Ensure proper completion
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId) => {
      try {
        console.log('=== DELETE MUTATION START ===', scheduleId);
        const response = await scheduleApi.deleteSchedule(scheduleId);
        console.log('=== DELETE MUTATION SUCCESS ===', response);
        return scheduleId;
      } catch (error) {
        console.error('=== DELETE MUTATION ERROR ===', error);
        throw error;
      }
    },
    onMutate: async (scheduleId) => {
      console.log('=== DELETE MUTATION ON_MUTATE ===', scheduleId);
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });
      await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));

      if (previousSchedules) {
        const filteredSchedules = previousSchedules.filter(schedule => schedule.id !== scheduleId);
        queryClient.setQueryData(scheduleKeys.list(weekParams), filteredSchedules);
      }

      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      console.log('=== DELETE MUTATION ON_ERROR ===', err);
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
      
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to delete schedule';
      toast.error("Gagal menghapus jadwal", {
        description: errorMessage,
        duration: 5000,
      });
    },
    onSuccess: (scheduleId) => {
      console.log('=== DELETE MUTATION ON_SUCCESS ===', scheduleId);
      // FIXED: Immediate cleanup and refresh without relying on timing
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
      
      toast.success('Jadwal berhasil dihapus', {
        description: "Jadwal telah dihapus secara permanen.",
        duration: 4000,
      });
    },
    onSettled: () => {
      console.log('=== DELETE MUTATION ON_SETTLED ===');
      // FIXED: Force completion - mutation is definitely done at this point
    },
    retry: false, // FIXED: Don't retry failed deletes to avoid confusion
  });

  // HANDLERS
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

  // HELPER FUNCTIONS
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

  // SIMPLIFIED EDIT/DELETE FUNCTIONS - FIXED to return immediately upon completion
  const handleEditSchedule = useCallback(async (scheduleId, formData) => {
    try {
      const result = await updateScheduleMutation.mutateAsync({ scheduleId, formData });
      return result;
    } catch (error) {
      // Error already handled in mutation
      throw error;
    }
  }, [updateScheduleMutation]);

  const handleDeleteSchedule = useCallback(async (schedule) => {
    try {
      await deleteScheduleMutation.mutateAsync(schedule.id);
      // Success - mutation completed
    } catch (error) {
      // Error already handled in mutation
      throw error;
    }
  }, [deleteScheduleMutation]);

  // FIXED: Simple loading states that properly reflect mutation status
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
    
    // Actions - FIXED: Direct mutation calls that complete properly
    setSelectedDate: handleDateSelect,
    setSelectedWeek: handleWeekSelect,
    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: (scheduleId, formData) => 
      updateScheduleMutation.mutateAsync({ scheduleId, formData }),
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    refreshData,
    
    // Simplified handlers
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