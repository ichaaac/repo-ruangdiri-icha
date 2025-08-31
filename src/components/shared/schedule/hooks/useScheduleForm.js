// src/components/shared/schedule/hooks/useScheduleForm.js - REFACTORED VERSION

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { parseScheduleDateTime } from "../utils/timezoneHandler";

// Import the new modular hooks
import { useFormValidation } from "./useFormValidation";
import { useAttachmentHandler } from "./useAttachmentHandler";
import { useParticipantHandler } from "./useParticipantHandler";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useScheduleForm = (mode = "create", initialData = null, isOpen = false, organizationType = "school") => {
  // Form data state
  const [formData, setFormData] = useState(() => ({
    agenda: "",
    type: "counseling",
    dates: [
      {
        date: formatDateLocal(new Date()),
        startTime: "09:00",
        endTime: "10:00",
        timezone: "WIB",
      },
    ],
    notificationOffset: 60,
    selectedPsychologist: null,
    selectedParticipants: [],
    location: "",
    customLocation: "",
    description: "",
    multipleDate: false,
  }));

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
  } = useParticipantHandler(formData, isOpen);

  // Event types and options
  const eventTypes = [
    { label: "Konseling", value: "counseling", textColor: "#9986FF" },
    ...(organizationType === "school" ? [{ label: "Kelas", value: "class", textColor: "#3CE69E" }] : []),
    { label: "Seminar", value: "seminar", textColor: "#FF886D" },
    { label: "Lainnya", value: "others", textColor: "#979797" },
  ];

  const notificationOptions = [
    { label: "1 jam", value: 60 },
    { label: "12 jam", value: 720 },
    { label: "1 hari", value: 1440 },
    { label: "3 hari", value: 4320 },
  ];

  const timezoneOptions = [
    { label: "WIB", value: "WIB" },
    { label: "WITA", value: "WITA" },
    { label: "WIT", value: "WIT" },
  ];

  const fixedLocationOptions = [
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Sit-in", value: "organization" },
  ];

  // Generate time options
  const timeOptions = (() => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        times.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
      }
    }
    return times;
  })();

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

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      try {
        if (mode === "edit" && initialData) {
          // Initialize edit form
          let dates = [];
          if (initialData.dates && initialData.dates.length > 0) {
            dates = initialData.dates.map((dateInfo) => ({
              ...dateInfo,
              timezone: dateInfo.timezone || "WIB",
            }));
          } else if (initialData.startDateTime) {
            const scheduleData = parseScheduleDateTime(
              initialData.startDateTime,
              initialData.endDateTime,
              initialData.timezone
            );

            dates = [
              {
                date: scheduleData.date,
                startTime: scheduleData.startTime,
                endTime: scheduleData.endTime,
                timezone: scheduleData.timezone || "WIB",
              },
            ];
          }

          const transformedData = {
            agenda: initialData.agenda || "",
            type: initialData.type || "counseling",
            description: initialData.description || "",
            notificationOffset: initialData.notificationOffset || 60,
            dates: dates.length > 0 ? dates : [
              {
                date: formatDateLocal(new Date()),
                startTime: "09:00",
                endTime: "10:00",
                timezone: "WIB",
              },
            ],
            location: initialData.type === "counseling" ? (initialData.location || "") : "",
            customLocation: initialData.type !== "counseling" ? (initialData.customLocation || "") : "",
            selectedPsychologist: initialData.selectedPsychologist || null,
            selectedParticipants: Array.isArray(initialData.selectedParticipants)
              ? initialData.selectedParticipants
              : [],
            multipleDate: dates.length > 1 || initialData.multipleDate || false,
          };

          setFormData(transformedData);
          initializeAttachments(initialData);

          if (editorRef.current && transformedData.description) {
            editorRef.current.innerHTML = transformedData.description;
          }
        } else {
          // Initialize create form
          let defaultDates = [
            {
              date: formatDateLocal(new Date()),
              startTime: "09:00",
              endTime: "10:00",
              timezone: "WIB",
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
                timezone: dateInfo.timezone || "WIB",
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
                timezone: "WIB",
              },
            ];
          }

          const createModeData = {
            agenda: "",
            type: "counseling",
            dates: defaultDates,
            notificationOffset: 60,
            selectedPsychologist: null,
            selectedParticipants: [],
            location: "",
            customLocation: "",
            description: "",
            multipleDate: initialData?.multipleDate || initialData?.draggedDays > 1 || defaultDates.length > 1,
          };

          setFormData(createModeData);
          clearAttachments();

          if (editorRef.current) {
            editorRef.current.innerHTML = "";
          }
        }

        setDropdowns({});
        clearParticipantSearch();
        setHasShownUnsavedToast(false);
        setPreviewAttachment(null);
      } catch (error) {
        console.error("Error initializing form data:", error);
        toast.error("Gagal memuat form, silakan coba lagi");
        
        // Fallback to safe default state
        setFormData({
          agenda: "",
          type: "counseling",
          dates: [
            {
              date: formatDateLocal(new Date()),
              startTime: "09:00",
              endTime: "10:00",
              timezone: "WIB",
            },
          ],
          notificationOffset: 60,
          selectedPsychologist: null,
          selectedParticipants: [],
          location: "",
          customLocation: "",
          description: "",
          multipleDate: false,
        });
        clearAttachments();
      }
    }
  }, [isOpen, mode, initialData]);

  // Event handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "selectedPsychologist" && formData.type === "counseling") {
      setFormData((prev) => ({ ...prev, selectedPsychologist: value, location: "" }));
      return;
    }

    if (field === "multipleDate") {
      if (value) {
        const firstDate = formData.dates[0];
        const nextDay = new Date(firstDate.date);
        nextDay.setDate(nextDay.getDate() + 1);

        const secondDate = {
          ...firstDate,
          date: formatDateLocal(nextDay),
        };

        setFormData((prev) => ({
          ...prev,
          multipleDate: true,
          dates: [firstDate, secondDate],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          multipleDate: false,
          dates: [prev.dates[0]],
        }));
      }
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
        return date;
      });
      setFormData((prev) => ({
        ...prev,
        dates: updatedDates,
        multipleDate: updatedDates.length > 1,
      }));
      return;
    }
  };

  const toggleDropdown = (dropdown) => {
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
  };

  // Location options
  const getAvailableLocations = () => {
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
  };

  // Wrapped participant handlers
  const handleParticipantSelect = (participant, slotIndex) => {
    handleParticipantSelectBase(participant, slotIndex, handleInputChange);
  };

  const removeParticipant = (participantId) => {
    removeParticipantBase(participantId, handleInputChange);
  };

  // Date handlers
  const updateAdditionalDate = (index, field, value) => {
    const newDates = [...formData.dates];
    newDates[index] = { ...newDates[index], [field]: value };

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
  };

  // Unsaved changes detection
  const hasUnsavedChanges = () => {
    if (mode !== "edit" || !initialData) {
      return (
        formData.agenda.trim() !== "" ||
        formData.description.trim() !== "" ||
        formData.selectedParticipants.length > 0 ||
        formData.selectedPsychologist !== null ||
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
  };

  // Validation wrapper
  const validateFormData = () => {
    return validateForm(formData, mode, initialData);
  };

  return {
    // Form state
    formData,
    dropdowns,
    attachments,
    uploadingAttachments,
    participantSearch,
    hasShownUnsavedToast,
    previewAttachment,

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
    timezoneOptions,
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