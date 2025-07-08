// src/components/shared/schedule/hooks/useSchedule.js - FULL FIXED CODE

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createScheduleApi } from '../lib/scheduleApi.js';

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
      timezone: 'Asia/Jakarta'
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
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
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
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    retry: 2,
  });

  // ===== NOTIFICATIONS QUERY =====
  const notificationsQuery = useQuery({
    queryKey: scheduleKeys.notifications,
    queryFn: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [
          // {
          //   id: '1',
          //   user: { 
          //     fullName: "Antony Martial",
          //     avatar: "https://ui-avatars.com/api/?name=Antony+Martial&background=488BBA&color=fff"
          //   },
          //   action: "Made an appointment",
          //   time: "1 jam yang lalu",
          //   createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          // },
          // {
          //   id: '2',
          //   user: { 
          //     fullName: "Jessica Chen",
          //     avatar: "https://ui-avatars.com/api/?name=Jessica+Chen&background=488BBA&color=fff"
          //   },
          //   action: "Updated schedule",
          //   time: "2 jam yang lalu",
          //   createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          // }
        ];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
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
    },
    onSuccess: (data) => {
      console.log('Schedule created successfully:', data);
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.counselingQueue });
    }
  });

  // ===== UPDATE SCHEDULE MUTATION =====
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, formData }) => {
      try {
        console.log('Updating schedule:', scheduleId, formData);
        const response = await scheduleApi.updateSchedule(scheduleId, formData);
        return response.data;
      } catch (error) {
        console.error('Update schedule error:', error);
        throw new Error(error.response?.data?.message || 'Failed to update schedule');
      }
    },
    onSuccess: (data, { scheduleId }) => {
      console.log('Schedule updated successfully:', data);
      
      // Update specific schedule in cache
      queryClient.setQueryData(scheduleKeys.list(weekParams), (old) => {
        if (!old) return old;
        return old.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, ...data.data }
            : schedule
        );
      });
      
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
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
    },
    onSuccess: (scheduleId) => {
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.list(weekParams) });
    }
  });

  // ===== CHECK SCHEDULE EXISTS - REMOVED (Backend handles conflicts) =====
  // No longer needed - backend will handle all conflict checking and availability

  // ===== HANDLERS =====
  const handleWeekSelect = useCallback((weekStart) => {
    setSelectedWeek(weekStart);
    
    // Prefetch adjacent weeks
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);
    const prevWeek = new Date(weekStart);
    prevWeek.setDate(weekStart.getDate() - 7);
    
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