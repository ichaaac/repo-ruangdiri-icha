// src/components/shared/schedule/hooks/useScheduleForm.js - FIXED INFINITE RENDERING

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { parseScheduleDateTime } from "../utils/timezoneHandler";
import { getCurrentUserTimezone, getCurrentUserAsPsychologist, isCurrentUserPsychologist, formatDateLocal } from "../../../../utils/timezoneUtils";

// Import the new modular hooks
import { useFormValidation } from "./useFormValidation";
import { useAttachmentHandler } from "./useAttachmentHandler";
import { useParticipantHandler } from "./useParticipantHandler";

export const useScheduleForm = (mode = "create", initialData = null, isOpen = false, organizationType = "school") => {
  // FIXED: Memoize user data to prevent re-renders
  const currentUserTimezone = useMemo(() => getCurrentUserTimezone(), []);
  const currentUserAsPsychologist = useMemo(() => getCurrentUserAsPsychologist(), []);
  const isUserPsychologist = useMemo(() => isCurrentUserPsychologist(), []);

  console.log('=== useScheduleForm Initialization ===');
  console.log('Current user timezone:', currentUserTimezone);
  console.log('Is user psychologist:', isUserPsychologist);
  console.log('Current user as psychologist:', currentUserAsPsychologist);

  // FIXED: Memoize initial form data to prevent re-creation
  const getInitialFormData = useCallback(() => ({
    agenda: "",
    type: "counseling",
    dates: [
      {
        date: formatDateLocal(new Date()),
        startTime: "09:00",
        endTime: "10:00",
        timezone: currentUserTimezone,
      },
    ],
    notificationOffset: 60,
    selectedPsychologist: isUserPsychologist ? currentUserAsPsychologist : null,
    selectedParticipants: [],
    location: "",
    customLocation: "",
    description: "",
    multipleDate: false,
  }), [currentUserTimezone, isUserPsychologist, currentUserAsPsychologist]);

  // Form data state
  const [formData, setFormData] = useState(getInitialFormData);

  // UI state
  const [dropdowns, setDropdowns] = useState({});
  const [hasShownUnsavedToast, setHasShownUnsavedToast] = useState(false);

  // Refs
  const editorRef = useRef(null);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize modular hooks
  const { validateForm, parseErrorMessage } = useFormValidation();
  
  const {
    attachments,
    uploadingAttachments,
    previewAttachment,
    setUploadingAttachments,
    setPreviewAttachment,
    handleFileSelect,
    removeAttachment,
    initializeAttachments,
    clearAttachments,
    getNewAttachments,
    getUploadBaseUrl,
    uploadAttachmentsMutation,
    deleteAttachmentMutation,
  } = useAttachmentHandler(initialData, organizationType);

  const {
    participantSearch,
    psychologists,
    participants,
    loadingPsychologists,
    loadingParticipants,
    setParticipantSearch,
    handleParticipantSelect: handleParticipantSelectBase,
    removeParticipant: removeParticipantBase,
    clearParticipantSearch,
    getAvailableParticipants,
  } = useParticipantHandler(formData, isOpen, currentUserAsPsychologist);

  // Event types and options - FIXED: Memoize to prevent re-creation
  const eventTypes = useMemo(() => [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    ...(organizationType === "school" ? [{ label: "Kelas", value: "class", textColor: "#3CE69E" }] : []),
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" },
  ], [organizationType]);

  const notificationOptions = useMemo(() => [
    { label: "1 jam", value: 60 },
    { label: "12 jam", value: 720 },
    { label: "1 hari", value: 1440 },
    { label: "3 hari", value: 4320 },
  ], []);

  const fixedLocationOptions = useMemo(() => [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Sit-in", value: "organization" },
  ], []);

  // Generate time options - FIXED: Memoize to prevent re-creation
  const timeOptions = useMemo(() => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        times.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
      }
    }
    return times;
  }, []);

  // Fetch psychologist locations
  const { data: backendLocations = [] } = useQuery({
    queryKey: ["psychologist-locations"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/psychologists/locations");
        const data = response.data || [];

        let locations = [];
        if (Array.isArray(data)) {
          locations = data
            .map((item) => {
              if (typeof item === "string") {
                return item;
              } else if (typeof item === "object" && item !== null) {
                if (item.locations && Array.isArray(item.locations)) {
                  return item.locations[0] || item.address || JSON.stringify(item);
                }
                return item.name || item.label || item.value || JSON.stringify(item);
              }
              return String(item);
            })
            .filter(Boolean);
        }

        return locations;
      } catch (error) {
        console.error("Error fetching psychologist locations:", error);
        toast.error("Gagal memuat lokasi psikolog");
        return [];
      }
    },
    enabled: isOpen && formData.type === "counseling" && !formData.selectedPsychologist,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // FIXED: Memoize initial data processing to prevent infinite loops
  const processedInitialData = useMemo(() => {
    if (!initialData) return null;

    // Process initial data only once
    if (mode === "edit") {
      let dates = [];
      if (initialData.dates && initialData.dates.length > 0) {
        dates = initialData.dates.map((dateInfo) => ({
          ...dateInfo,
          timezone: currentUserTimezone,
        }));
      } else if (initialData.startDateTime) {
        const scheduleData = parseScheduleDateTime(
          initialData.startDateTime,
          initialData.endDateTime,
          currentUserTimezone
        );

        dates = [
          {
            date: scheduleData.date,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            timezone: currentUserTimezone,
          },
        ];
      }

      return {
        agenda: initialData.agenda || "",
        type: initialData.type || "counseling",
        description: initialData.description || "",
        notificationOffset: initialData.notificationOffset || 60,
        dates: dates.length > 0 ? dates : [
          {
            date: formatDateLocal(new Date()),
            startTime: "09:00",
            endTime: "10:00",
            timezone: currentUserTimezone,
          },
        ],
        location: initialData.type === "counseling" ? (initialData.location || "") : "",
        customLocation: initialData.type !== "counseling" ? (initialData.customLocation || "") : "",
        selectedPsychologist: isUserPsychologist ? currentUserAsPsychologist : (initialData.selectedPsychologist || null),
        selectedParticipants: Array.isArray(initialData.selectedParticipants)
          ? initialData.selectedParticipants
          : [],
        multipleDate: dates.length > 1 || initialData.multipleDate || false,
      };
    } else {
      // Create mode
      let defaultDates = [
        {
          date: formatDateLocal(new Date()),
          startTime: "09:00",
          endTime: "10:00",
          timezone: currentUserTimezone,
        },
      ];

      if (initialData?.dates && Array.isArray(initialData.dates) && initialData.dates.length > 0) {
        defaultDates = initialData.dates.map((dateInfo) => {
          let dateString = dateInfo.date;
          if (dateInfo.date instanceof Date) {
            dateString = formatDateLocal(dateInfo.date);
          }

          return {
            date: dateString,
            startTime: dateInfo.startTime || "09:00",
            endTime: dateInfo.endTime || "10:00",
            timezone: currentUserTimezone,
          };
        });
      } else if (initialData?.startDateTime && initialData?.endDateTime) {
        const startDate = new Date(initialData.startDateTime);
        const endDate = new Date(initialData.endDateTime);

        defaultDates = [
          {
            date: formatDateLocal(startDate),
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
            timezone: currentUserTimezone,
          },
        ];
      }

      return {
        agenda: "",
        type: "counseling",
        dates: defaultDates,
        notificationOffset: 60,
        selectedPsychologist: isUserPsychologist ? currentUserAsPsychologist : null,
        selectedParticipants: [],
        location: "",
        customLocation: "",
        description: "",
        multipleDate: initialData?.multipleDate || initialData?.draggedDays > 1 || defaultDates.length > 1,
      };
    }
  }, [
    initialData, 
    mode, 
    currentUserTimezone, 
    isUserPsychologist, 
    currentUserAsPsychologist
  ]);

  // FIXED: Initialize form data only when necessary, with proper dependencies
  useEffect(() => {
    if (!isOpen) return;

    try {
      console.log('=== Form Data Initialization Effect ===');
      console.log('Mode:', mode);
      console.log('Is open:', isOpen);
      console.log('Processed initial data:', processedInitialData);

      if (processedInitialData) {
        setFormData(processedInitialData);
        initializeAttachments(initialData);

        if (editorRef.current && processedInitialData.description) {
          editorRef.current.innerHTML = processedInitialData.description;
        }
      } else {
        // Fallback to initial state
        const fallbackData = getInitialFormData();
        setFormData(fallbackData);
        clearAttachments();

        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }

      // Reset UI state
      setDropdowns({});
      clearParticipantSearch();
      setHasShownUnsavedToast(false);
      setPreviewAttachment(null);

    } catch (error) {
      console.error("Error initializing form data:", error);
      toast.error("Gagal memuat form, silakan coba lagi");
      
      // Fallback to safe default state
      const fallbackData = getInitialFormData();
      setFormData(fallbackData);
      clearAttachments();
    }
  }, [
    isOpen, 
    processedInitialData, 
    getInitialFormData,
    // Note: Do NOT include formData in dependencies - it will cause infinite loop
  ]); // FIXED: Stable dependencies only

  // Event handlers - FIXED: Memoize to prevent re-creation
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // FIXED: Prevent psychologist field changes if current user is psychologist
    if (field === "selectedPsychologist" && isUserPsychologist) {
      console.log('Psychologist change blocked: Current user is psychologist');
      return;
    }

    if (field === "selectedPsychologist" && formData.type === "counseling") {
      setFormData((prev) => ({ ...prev, selectedPsychologist: value, location: "" }));
      return;
    }

    if (field === "multipleDate") {
      setFormData((prev) => {
        if (value) {
          const firstDate = prev.dates[0];
          const nextDay = new Date(firstDate.date);
          nextDay.setDate(nextDay.getDate() + 1);

          const secondDate = {
            ...firstDate,
            date: formatDateLocal(nextDay),
          };

          return {
            ...prev,
            multipleDate: true,
            dates: [firstDate, secondDate],
          };
        } else {
          return {
            ...prev,
            multipleDate: false,
            dates: [prev.dates[0]],
          };
        }
      });
      return;
    }

    if (field === "dates") {
      const updatedDates = value.map((date) => {
        const startIndex = timeOptions.indexOf(date.startTime);
        const endIndex = timeOptions.indexOf(date.endTime);
        if (startIndex >= endIndex) {
          return {
            ...date,
            endTime: timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)],
          };
        }
        return {
          ...date,
          timezone: currentUserTimezone,
        };
      });
      setFormData((prev) => ({
        ...prev,
        dates: updatedDates,
        multipleDate: updatedDates.length > 1,
      }));
      return;
    }
  }, [isUserPsychologist, timeOptions, currentUserTimezone]);

  const toggleDropdown = useCallback((dropdown) => {
    // FIXED: Prevent psychologist dropdown if current user is psychologist
    if (dropdown === "psychologist" && isUserPsychologist) {
      console.log('Psychologist dropdown blocked: Current user is psychologist');
      return;
    }

    setDropdowns((prev) => {
      const newState = {
        ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
        [dropdown]: !prev[dropdown],
      };

      if (dropdown.includes("participants") && prev[dropdown]) {
        clearParticipantSearch();
      }

      return newState;
    });
  }, [isUserPsychologist, clearParticipantSearch]);

  // Location options - FIXED: Memoize to prevent re-calculation
  const getAvailableLocations = useCallback(() => {
    if (formData.selectedPsychologist) {
      return fixedLocationOptions;
    } else {
      return (backendLocations || [])
        .map((location) => {
          if (typeof location === "object" && location !== null) {
            if (location.locations && Array.isArray(location.locations)) {
              const locationValue = location.locations[0] || location.address || "Unknown";
              return { label: locationValue, value: locationValue };
            } else if (location.name || location.label || location.value) {
              return {
                label: location.name || location.label || location.value,
                value: location.value || location.name || location.label,
              };
            } else {
              const locationStr = JSON.stringify(location);
              return { label: locationStr, value: locationStr };
            }
          } else {
            return { label: String(location), value: String(location) };
          }
        })
        .filter((location) => location.label && location.value);
    }
  }, [formData.selectedPsychologist, fixedLocationOptions, backendLocations]);

  // Wrapped participant handlers - FIXED: Memoize to prevent re-creation
  const handleParticipantSelect = useCallback((participant, slotIndex) => {
    handleParticipantSelectBase(participant, slotIndex, handleInputChange);
  }, [handleParticipantSelectBase, handleInputChange]);

  const removeParticipant = useCallback((participantId) => {
    removeParticipantBase(participantId, handleInputChange);
  }, [removeParticipantBase, handleInputChange]);

  // Date handlers - FIXED: Memoize to prevent re-creation
  const updateAdditionalDate = useCallback((index, field, value) => {
    const newDates = [...formData.dates];
    newDates[index] = { 
      ...newDates[index], 
      [field]: value,
      timezone: currentUserTimezone
    };

    if (field === "startTime") {
      const startTimeIndex = timeOptions.indexOf(value);
      const endTimeIndex = timeOptions.indexOf(newDates[index].endTime);

      if (startTimeIndex >= endTimeIndex) {
        const newEndTimeIndex = Math.min(startTimeIndex + 1, timeOptions.length - 1);
        newDates[index].endTime = timeOptions[newEndTimeIndex];
      }
    }

    if (field === "endTime") {
      const startTimeIndex = timeOptions.indexOf(newDates[index].startTime);
      const endTimeIndex = timeOptions.indexOf(value);

      if (endTimeIndex <= startTimeIndex) {
        const newStartTimeIndex = Math.max(endTimeIndex - 1, 0);
        newDates[index].startTime = timeOptions[newStartTimeIndex];
      }
    }

    handleInputChange("dates", newDates);
  }, [formData.dates, currentUserTimezone, timeOptions, handleInputChange]);

  // Unsaved changes detection - FIXED: Memoize to prevent re-calculation
  const hasUnsavedChanges = useCallback(() => {
    if (mode !== "edit" || !initialData) {
      return (
        formData.agenda.trim() !== "" ||
        formData.description.trim() !== "" ||
        formData.selectedParticipants.length > 0 ||
        (formData.selectedPsychologist !== null && (!isUserPsychologist || formData.selectedPsychologist !== currentUserAsPsychologist)) ||
        attachments.length > 0
      );
    }

    const current = {
      agenda: formData.agenda,
      type: formData.type,
      description: formData.description,
      notificationOffset: formData.notificationOffset,
      dates: formData.dates,
      location: formData.location,
      customLocation: formData.customLocation,
      multipleDate: formData.multipleDate,
    };

    const initial = {
      agenda: initialData.agenda || "",
      type: initialData.type || "counseling",
      description: initialData.description || "",
      notificationOffset: initialData.notificationOffset || 60,
      dates: initialData.dates || [],
      location: initialData.location || "",
      customLocation: initialData.customLocation || "",
      multipleDate: initialData.multipleDate || false,
    };

    return JSON.stringify(current) !== JSON.stringify(initial) || getNewAttachments().length > 0;
  }, [
    mode, 
    initialData, 
    formData, 
    isUserPsychologist, 
    currentUserAsPsychologist, 
    attachments.length, 
    getNewAttachments
  ]);

  // Validation wrapper - FIXED: Memoize to prevent re-creation
  const validateFormData = useCallback(() => {
    return validateForm(formData, mode, initialData);
  }, [validateForm, formData, mode, initialData]);

  return {
    // Form state
    formData,
    dropdowns,
    attachments,
    uploadingAttachments,
    participantSearch,
    hasShownUnsavedToast,
    previewAttachment,

    // User data
    currentUserTimezone,
    isUserPsychologist,
    currentUserAsPsychologist,

    // Refs
    editorRef,
    photoInputRef,
    fileInputRef,

    // Setters
    setParticipantSearch,
    setHasShownUnsavedToast,
    setPreviewAttachment,
    setUploadingAttachments,

    // Options and constants
    eventTypes,
    notificationOptions,
    fixedLocationOptions,
    timeOptions,

    // Query data
    psychologists,
    participants,
    loadingPsychologists,
    loadingParticipants,
    getAvailableLocations,

    // Handlers
    handleInputChange,
    toggleDropdown,
    handleFileSelect,
    removeAttachment,
    handleParticipantSelect,
    removeParticipant,
    updateAdditionalDate,

    // Validation and utilities
    validateForm: validateFormData,
    hasUnsavedChanges,
    parseErrorMessage,
    getNewAttachments,
    getUploadBaseUrl,

    // Mutations
    uploadAttachmentsMutation,
    deleteAttachmentMutation,
  };
};