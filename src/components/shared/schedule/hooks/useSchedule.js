// src/components/shared/schedule/hooks/useSchedule.js

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createScheduleApi } from '../lib/scheduleApi.js';

// Simple query keys for schedule
const SCHEDULE_KEYS = {
  schedules: (params) => ['schedules', params],
  counselingQueue: ['counseling-queue'],
  notifications: ['notifications'],
};

export const useSchedule = (type = "school") => {
  // Create enhanced API client
  const scheduleApi = useMemo(() => createScheduleApi(type), [type]);
  const queryClient = useQueryClient();
  
  // Local state for UI controls
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return weekStart;
  });

  // Helper to generate week range
  const getWeekParams = useCallback((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      from: weekStart.toISOString(),
      to: weekEnd.toISOString(),
      timezone: 'Asia/Jakarta'
    };
  }, []);

  const weekParams = useMemo(() => getWeekParams(selectedWeek), [selectedWeek, getWeekParams]);

  // ===== QUERIES =====
  
  // Schedules Query
  const schedulesQuery = useQuery({
    queryKey: SCHEDULE_KEYS.schedules(weekParams),
    queryFn: async () => {
      const response = await scheduleApi.getSchedules(weekParams);
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!selectedWeek,
  });

  // Counseling Queue Query
  const counselingQueueQuery = useQuery({
    queryKey: SCHEDULE_KEYS.counselingQueue,
    queryFn: async () => {
      const response = await scheduleApi.getCounselingQueue();
      return response.data?.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });

  // Notifications Query (Mock for now)
  const notificationsQuery = useQuery({
    queryKey: SCHEDULE_KEYS.notifications,
    queryFn: async () => {
      // Mock implementation - replace with actual API call when available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        {
          id: '1',
          user: { fullName: "Antony Martial" },
          action: "Made an appointment",
          time: "1 jam yang lalu",
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          user: { fullName: "Jane Doe" },
          action: "Updated schedule",
          time: "2 jam yang lalu",
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          user: { fullName: "John Smith" },
          action: "Cancelled appointment",
          time: "3 jam yang lalu",
          createdAt: new Date().toISOString()
        }
      ];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // ===== MUTATIONS =====
  
  // Create Schedule Mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await scheduleApi.createSchedule(formData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate schedules for current week
      queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_KEYS.schedules(weekParams) 
      });
    },
    onError: (error) => {
      console.error('Error creating schedule:', error);
    },
  });

  // Update Schedule Mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, formData }) => {
      const response = await scheduleApi.updateSchedule(scheduleId, formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_KEYS.schedules(weekParams) 
      });
    },
    onError: (error) => {
      console.error('Error updating schedule:', error);
    },
  });

  // Delete Schedule Mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId) => {
      await scheduleApi.deleteSchedule(scheduleId);
      return scheduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_KEYS.schedules(weekParams) 
      });
    },
    onError: (error) => {
      console.error('Error deleting schedule:', error);
    },
  });

  // Check Schedule Exists (as mutation karena on-demand)
  const checkScheduleExistsMutation = useMutation({
    mutationFn: async ({ date, startTime, endTime }) => {
      const response = await scheduleApi.checkScheduleExists({
        date,
        startTime,
        endTime,
        timezone: 'Asia/Jakarta'
      });
      return response.data?.data !== null;
    },
  });

  // ===== HANDLERS =====
  
  // Handle week selection
  const handleWeekSelect = useCallback((weekStart) => {
    setSelectedWeek(weekStart);
  }, []);

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
      schedulesQuery.refetch(),
      counselingQueueQuery.refetch(),
      notificationsQuery.refetch(),
    ]);
  }, [schedulesQuery, counselingQueueQuery, notificationsQuery]);

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
  };
};