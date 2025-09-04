// src/components/shared/schedule/hooks/useParticipantHandler.js - FIXED USER FETCHING

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { getCurrentUserAsPsychologist, isCurrentUserPsychologist } from '../../../../utils/timezoneUtils';

export const useParticipantHandler = (formData, isOpen = false, currentUserAsPsychologist = null) => {
  const [participantSearch, setParticipantSearch] = useState('');
  const isUserPsychologist = isCurrentUserPsychologist();

  console.log('=== useParticipantHandler ===');
  console.log('Is user psychologist:', isUserPsychologist);
  console.log('Current user as psychologist:', currentUserAsPsychologist);

  // Fetch psychologists - modified for psychologist users
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ['psychologists', formData.location],
    queryFn: async () => {
      try {
        // If current user is psychologist, return only themselves
        if (isUserPsychologist && currentUserAsPsychologist) {
          console.log('Returning current user as only psychologist option');
          return [currentUserAsPsychologist];
        }

        // Otherwise fetch all psychologists
        const response = await apiClient.get('/psychologists');
        const data = response.data?.data || response.data || [];

        if (!Array.isArray(data)) {
          console.warn('Psychologists API returned non-array data:', data);
          return [];
        }

        const formattedData = data.map((psychologist) => ({
          ...psychologist,
          id: psychologist.id || `psych-${Date.now()}-${Math.random()}`,
          fullName: psychologist.fullName || psychologist.name || 'Unknown Psychologist',
          email: psychologist.email || 'no-email@example.com',
        }));

        console.log('Fetched psychologists:', formattedData);
        return formattedData;
      } catch (error) {
        console.error('Error fetching psychologists:', error);
        toast.error('Gagal memuat data psikolog');
        return [];
      }
    },
    enabled: isOpen && formData.type === 'counseling',
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // FIXED: Fetch participants when dropdown opens, with better search handling
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ['participants', participantSearch.trim()],
    queryFn: async () => {
      try {
        console.log('=== Fetching participants ===');
        console.log('Search term:', participantSearch);
        
        const params = {
          limit: 40, // FIXED: Always include limit as requested
        };

        // Add search parameter if search term exists
        if (participantSearch.trim()) {
          params.search = participantSearch.trim();
        }

        console.log('API call params:', params);
        console.log('Making GET request to /users with params:', params);

        const response = await apiClient.get('/users', { params });
        
        console.log('Users API response:', response);
        
        const data = response.data?.data || [];

        if (!Array.isArray(data)) {
          console.warn('Participants API returned non-array data:', data);
          return [];
        }

        // Filter out psychologists from participants list if current user is not psychologist
        const filteredData = data.filter(user => {
          // If current user is psychologist, exclude all psychologists from participants
          if (isUserPsychologist) {
            return user.role !== 'psychologist';
          }
          // Otherwise return all users
          return true;
        });

        const formattedData = filteredData.map((participant) => ({
          ...participant,
          id: participant.id || `participant-${Date.now()}-${Math.random()}`,
          fullName: participant.fullName || participant.name || 'Unknown Participant',
          email: participant.email || 'no-email@example.com',
        }));

        console.log('Filtered and formatted participants:', formattedData);
        return formattedData;
      } catch (error) {
        console.error('Error fetching participants:', error);
        toast.error('Gagal memuat data partisipan');
        return [];
      }
    },
    // FIXED: Enable when modal is open and form type is counseling, not just when searching
    enabled: isOpen && formData.type === 'counseling',
    staleTime: 30 * 1000,
    retry: 1,
    // FIXED: Refetch when dropdown opens even without search
    refetchOnMount: true,
  });

  // Handle participant selection
  const handleParticipantSelect = (participant, slotIndex, handleInputChange) => {
    const newParticipants = [...formData.selectedParticipants];

    if (!newParticipants.find((p) => p.id === participant.id)) {
      if (slotIndex === 0 && !newParticipants[0]) {
        newParticipants[0] = participant;
      } else if (slotIndex === 1 && !newParticipants[1]) {
        newParticipants[1] = participant;
      } else if (!newParticipants[0]) {
        newParticipants[0] = participant;
      } else if (!newParticipants[1]) {
        newParticipants[1] = participant;
      }
    }

    handleInputChange('selectedParticipants', newParticipants.filter(Boolean));
    setParticipantSearch('');
  };

  // Remove participant
  const removeParticipant = (participantId, handleInputChange) => {
    const newParticipants = formData.selectedParticipants.filter((p) => p.id !== participantId);
    handleInputChange('selectedParticipants', newParticipants);
  };

  // Clear participant search
  const clearParticipantSearch = () => {
    setParticipantSearch('');
  };

  // Get available participants (excluding already selected ones)
  const getAvailableParticipants = () => {
    return participants.filter(
      (p) => !formData.selectedParticipants.find((sp) => sp.id === p.id)
    );
  };

  // Check if participant slot is filled
  const isParticipantSlotFilled = (slotIndex) => {
    return formData.selectedParticipants[slotIndex] != null;
  };

  // Get participant display name
  const getParticipantDisplayName = (participant) => {
    return participant.fullName || participant.name || 'Unknown';
  };

  // Truncate participant name for display
  const truncateParticipantName = (name, maxLength = 25) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  // ADDED: Check if psychologist dropdown should be disabled
  const isPsychologistDropdownDisabled = () => {
    return isUserPsychologist;
  };

  // ADDED: Get psychologist display text for disabled state
  const getPsychologistDisplayText = () => {
    if (isUserPsychologist && currentUserAsPsychologist) {
      return currentUserAsPsychologist.fullName || currentUserAsPsychologist.email || 'Current User';
    }
    return 'Email/nama Psikolog';
  };

  return {
    // State
    participantSearch,
    psychologists,
    participants,
    loadingPsychologists,
    loadingParticipants,

    // User state
    isUserPsychologist,
    currentUserAsPsychologist,

    // Setters
    setParticipantSearch,

    // Actions
    handleParticipantSelect,
    removeParticipant,
    clearParticipantSearch,
    getAvailableParticipants,
    isParticipantSlotFilled,
    getParticipantDisplayName,
    truncateParticipantName,

    // ADDED: Psychologist-specific functions
    isPsychologistDropdownDisabled,
    getPsychologistDisplayText,
  };
};