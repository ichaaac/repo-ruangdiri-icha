// src/components/shared/schedule/hooks/useSchedule.js - React Query Implementation

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createScheduleApi } from '../lib/scheduleApi.js';

// Query keys factory - best practice for organization
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
  
  // Create enhanced API client - memoized to prevent recreation
  const scheduleApi = useMemo(() => createScheduleApi(type), [type]);
  
  // Local state for UI controls
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return weekStart;
  });

  // Helper to generate week range - memoized
  const getWeekParams = useCallback((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      from: weekStart.toISOString().split('T')[0], // Send as YYYY-MM-DD
      to: weekEnd.toISOString().split('T')[0],     // Send as YYYY-MM-DD
      timezone: 'Asia/Jakarta'
    };
  }, []);

  const weekParams = useMemo(() => getWeekParams(selectedWeek), [selectedWeek, getWeekParams]);

  // ===== QUERIES =====
  
  // Schedules Query with proper error handling
  const schedulesQuery = useQuery({
    queryKey: scheduleKeys.list(weekParams),
    queryFn: async () => {
      try {
        const response = await scheduleApi.getSchedules(weekParams);
        
        // Handle different response structures
        if (response.data?.status === 'success') {
          return response.data.data || [];
        }
        
        // Fallback for different API response structures
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Error fetching schedules:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch schedules');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
    enabled: !!selectedWeek,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnMount: 'always',    // Always fetch on mount
  });

  // Counseling Queue Query with auto-refresh
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
    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 5 * 60 * 1000,        // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    refetchIntervalInBackground: true,
    retry: 2,
  });

  // Notifications Query with shorter cache time
  const notificationsQuery = useQuery({
    queryKey: scheduleKeys.notifications,
    queryFn: async () => {
      try {
        // Mock implementation - replace with actual API when available
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return [
          {
            id: '1',
            user: { 
              fullName: "Antony Martial",
              avatar: "https://ui-avatars.com/api/?name=Antony+Martial&background=488BBA&color=fff"
            },
            action: "Made an appointment",
            time: "1 jam yang lalu",
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            user: { 
              fullName: "Jessica Chen",
              avatar: "https://ui-avatars.com/api/?name=Jessica+Chen&background=488BBA&color=fff"
            },
            action: "Updated schedule",
            time: "2 jam yang lalu",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            user: { 
              fullName: "John Smith",
              avatar: "https://ui-avatars.com/api/?name=John+Smith&background=488BBA&color=fff"
            },
            action: "Cancelled appointment",
            time: "3 jam yang lalu",
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          }
        ];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    staleTime: 60 * 1000,  // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // ===== MUTATIONS =====
  
  // Create Schedule Mutation with optimistic updates
  const createScheduleMutation = useMutation({
    mutationFn: async (formData) => {
      try {
        const response = await scheduleApi.createSchedule(formData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create schedule');
      }
    },
    onMutate: async (newSchedule) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });

      // Snapshot the previous value
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));

      // Optimistically update to the new value
      if (previousSchedules) {
        const optimisticSchedule = {
          id: `temp-${Date.now()}`,
          agenda: newSchedule.agenda,
          startDateTime: `${newSchedule.dates[0].date}T${newSchedule.dates[0].startTime}:00`,
          endDateTime: `${newSchedule.dates[0].date}T${newSchedule.dates[0].endTime}:00`,
          type: newSchedule.type,
          location: newSchedule.location,
          description: newSchedule.description,
          isOptimistic: true,
        };
        
        queryClient.setQueryData(
          scheduleKeys.list(weekParams),
          [...previousSchedules, optimisticSchedule]
        );
      }

      // Return a context object with the snapshotted value
      return { previousSchedules };
    },
    onError: (err, newSchedule, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      
      // Also invalidate counseling queue as it might be affected
      queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
    },
  });

  // Update Schedule Mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, formData }) => {
      try {
        const response = await scheduleApi.updateSchedule(scheduleId, formData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update schedule');
      }
    },
    onSuccess: (data, { scheduleId }) => {
      // Update the specific schedule in cache if possible
      queryClient.setQueryData(scheduleKeys.list(weekParams), (old) => {
        if (!old) return old;
        return old.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, ...data.data }
            : schedule
        );
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
    },
    onError: (error) => {
      console.error('Error updating schedule:', error);
    },
  });

  // Delete Schedule Mutation
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: scheduleKeys.list(weekParams) });

      // Snapshot the previous value
      const previousSchedules = queryClient.getQueryData(scheduleKeys.list(weekParams));

      // Optimistically update by removing the schedule
      if (previousSchedules) {
        queryClient.setQueryData(
          scheduleKeys.list(weekParams),
          previousSchedules.filter(schedule => schedule.id !== scheduleId)
        );
      }

      return { previousSchedules };
    },
    onError: (err, scheduleId, context) => {
      // Roll back on error
      if (context?.previousSchedules) {
        queryClient.setQueryData(scheduleKeys.list(weekParams), context.previousSchedules);
      }
    },
    onSuccess: (scheduleId) => {
      // Remove from all related queries
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
    },
  });

  // Check Schedule Exists Mutation
  const checkScheduleExistsMutation = useMutation({
    mutationFn: async ({ date, startTime, endTime }) => {
      try {
        const response = await scheduleApi.checkScheduleExists({
          date,
          startTime,
          endTime,
          timezone: 'Asia/Jakarta'
        });
        
        // Return true if schedule exists, false otherwise
        return response.data?.status === 'fail'; // API returns fail if schedule exists
      } catch (error) {
        console.error('Error checking schedule existence:', error);
        return false; // Assume it doesn't exist on error
      }
    },
    retry: false, // Don't retry this check
  });

  // ===== HANDLERS =====
  
  // Handle week selection with cache optimization
  const handleWeekSelect = useCallback((weekStart) => {
    setSelectedWeek(weekStart);
    
    // Prefetch next/previous weeks
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);
    const prevWeek = new Date(weekStart);
    prevWeek.setDate(weekStart.getDate() - 7);
    
    // Prefetch adjacent weeks
    queryClient.prefetchQuery({
      queryKey: scheduleKeys.list(getWeekParams(nextWeek)),
      queryFn: () => scheduleApi.getSchedules(getWeekParams(nextWeek)).then(res => res.data?.data || []),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: scheduleKeys.list(getWeekParams(prevWeek)),
      queryFn: () => scheduleApi.getSchedules(getWeekParams(prevWeek)).then(res => res.data?.data || []),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, scheduleApi, getWeekParams]);

  // Handle date selection
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    
    // Also update the week to include this date
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    setSelectedWeek(weekStart);
  }, []);

  // Refresh all data
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
      const timeHour = parseInt(timeSlot.split(':')[0]);
      return hour === timeHour;
    });
  }, [schedulesQuery.data]);

  // ===== COMPUTED VALUES =====
  
  const loading = {
    schedules: schedulesQuery.isLoading,
    queue: counselingQueueQuery.isLoading,
    notifications: notificationsQuery.isLoading,
    submit: createScheduleMutation.isPending || 
            updateScheduleMutation.isPending || 
            deleteScheduleMutation.isPending,
    checkExists: checkScheduleExistsMutation.isPending,
  };

  const error = {
    schedules: schedulesQuery.error?.message || null,
    queue: counselingQueueQuery.error?.message || null,
    notifications: notificationsQuery.error?.message || null,
    submit: createScheduleMutation.error?.message || 
            updateScheduleMutation.error?.message || 
            deleteScheduleMutation.error?.message || null,
  };

  // Global loading and error states
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
    checkScheduleExists: checkScheduleExistsMutation.mutateAsync,
    refreshData,
    
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
    checkExistsMutation: checkScheduleExistsMutation,
    
    // Cache control
    invalidateSchedules: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
    invalidateQueue: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue }),
    invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: scheduleKeys.notifications }),
  };
};