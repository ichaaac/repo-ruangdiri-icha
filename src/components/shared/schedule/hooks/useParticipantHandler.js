// src/components/shared/schedule/hooks/useParticipantHandler.js

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export const useParticipantHandler = (formData, isOpen = false) => {
  const [participantSearch, setParticipantSearch] = useState('');

  // Fetch psychologists
  const { data: psychologists = [], isLoading: loadingPsychologists } = useQuery({
    queryKey: ['psychologists', formData.location],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/psychologists');
        const data = response.data?.data || response.data || [];

        if (!Array.isArray(data)) {
          console.warn('Psychologists API returned non-array data:', data);
          return [];
        }

        return data.map((psychologist) => ({
          ...psychologist,
          id: psychologist.id || `psych-${Date.now()}-${Math.random()}`,
          fullName: psychologist.fullName || psychologist.name || 'Unknown Psychologist',
          email: psychologist.email || 'no-email@example.com',
        }));
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

  // Fetch participants
  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ['participants', participantSearch],
    queryFn: async () => {
      try {
        const params = {
          limit: 100,
          ...(participantSearch && { search: participantSearch }),
        };
        const response = await apiClient.get('/users', { params });
        const data = response.data?.data || [];

        if (!Array.isArray(data)) {
          console.warn('Participants API returned non-array data:', data);
          return [];
        }

        return data.map((participant) => ({
          ...participant,
          id: participant.id || `participant-${Date.now()}-${Math.random()}`,
          fullName: participant.fullName || participant.name || 'Unknown Participant',
          email: participant.email || 'no-email@example.com',
        }));
      } catch (error) {
        console.error('Error fetching participants:', error);
        toast.error('Gagal memuat data partisipan');
        return [];
      }
    },
    enabled: isOpen && formData.type === 'counseling' && participantSearch.trim() !== '',
    staleTime: 30 * 1000,
    retry: 1,
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

  return {
    // State
    participantSearch,
    psychologists,
    participants,
    loadingPsychologists,
    loadingParticipants,

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
  };
};