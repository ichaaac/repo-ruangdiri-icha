// src/components/shared/schedule/CreateScheduleModal.jsx - Simplified Create Modal

import React from "react";
import { toast } from "sonner";
import { useScheduleForm } from "./hooks/useScheduleForm";
import ScheduleFormFields from "./ScheduleFormFields";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

const CreateScheduleModal = ({
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  loading = false
}) => {
  const {
    formData,
    dropdowns,
    attachments,
    uploadingAttachments,
    participantSearch,
    hasShownUnsavedToast,
    previewAttachment,
    editorRef,
    photoInputRef,
    fileInputRef,
    setParticipantSearch,
    setHasShownUnsavedToast,
    setPreviewAttachment,
    eventTypes,
    notificationOptions,
    timezoneOptions,
    fixedLocationOptions,
    timeOptions,
    psychologists,
    participants,
    loadingPsychologists,
    loadingParticipants,
    getAvailableLocations,
    handleInputChange,
    toggleDropdown,
    handleFileSelect,
    removeAttachment,
    handleParticipantSelect,
    removeParticipant,
    removeDateSlot,
    updateAdditionalDate,
    validateForm,
    hasUnsavedChanges,
    parseErrorMessage,
    uploadAttachmentsMutation,
  } = useScheduleForm("create", initialData, isOpen);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const submitData = {
      agenda: formData.agenda.trim(),
      type: formData.type,
      description: formData.description.trim(),
      notificationOffset: formData.notificationOffset,
      dates: formData.dates
    };

    if (formData.type === "counseling") {
      if (formData.selectedPsychologist && formData.selectedParticipants.length > 0) {
        submitData.participants = {
          psychologistId: formData.selectedPsychologist.id,
          patientIds: formData.selectedParticipants.map(participant => participant.id)
        };
      }
    }

    if (formData.type === "counseling") {
      const isStandardLocation = fixedLocationOptions.find(opt => opt.value === formData.location);
      if (isStandardLocation) {
        submitData.location = formData.location;
      } else {
        submitData.location = "offline";
        submitData.actualLocationName = formData.location;
      }
    } else {
      submitData.customLocation = formData.customLocation;
    }
    
    try {
      const result = await onSubmit(submitData);
      
      // Handle attachments after successful creation
      if (result?.data && attachments.length > 0) {
        try {
          let scheduleIds = [];
          
          if (Array.isArray(result.data)) {
            scheduleIds = result.data.map(schedule => schedule.id);
          } else if (result.data.ids && Array.isArray(result.data.ids)) {
            scheduleIds = result.data.ids;
          } else if (result.data.id) {
            scheduleIds = [result.data.id];
          }
          
          if (scheduleIds.length > 0) {
            await uploadAttachmentsMutation.mutateAsync({
              scheduleIds,
              files: attachments.map(a => a.file)
            });
          }
        } catch (error) {
          console.error("Attachment upload error:", error);
          // Don't throw here - schedule was created successfully
          toast.error("Jadwal berhasil dibuat, tetapi gagal mengunggah lampiran", {
            description: "Anda dapat menambahkan lampiran nanti melalui edit jadwal.",
            duration: 5000,
          });
        }
      }
      
      // Modal will be closed by parent component on successful onSubmit
      
    } catch (error) {
      console.error("Create schedule error:", error);
      
      // FIXED: Don't close modal on error - let user retry
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to create schedule';
      const parsedMessage = parseErrorMessage(errorMessage);
      
      toast.error("Gagal membuat jadwal", {
        description: parsedMessage,
        duration: 5000,
      });
      
      // Don't return or close modal - let user retry
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges() && !hasShownUnsavedToast) {
      setHasShownUnsavedToast(true);
      
      toast("Ada perubahan yang belum disimpan. Yakin ingin membatalkan?", {
        action: {
          label: "Ya, Batalkan",
          onClick: () => {
            setHasShownUnsavedToast(false);
            onClose();
          },
          className: "!bg-[#EE4266] hover:!bg-[#d63854] !text-white !border-[#EE4266] hover:!border-[#d63854] !ml-auto"
        },
        cancel: {
          label: "Tetap Edit",
          onClick: () => {
            setHasShownUnsavedToast(false);
          },
          className: "!bg-transparent hover:!bg-gray-100 !text-[#EE4266] !border !border-[#EE4266] hover:!border-[#d63854]"
        },
        duration: 10000,
        className: "!bg-white !border !border-gray-200 !shadow-lg",
        onDismiss: () => setHasShownUnsavedToast(false),
        position: "top-center"
      });
    } else if (!hasUnsavedChanges()) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
        onClick={(e) => e.target === e.currentTarget && handleCancel()}
      >
        <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          
          {/* Header */}
          <div className="flex justify-end items-center p-6">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-[#EE4266] hover:text-[#d63854] transition-colors disabled:opacity-50"
            >
              <span className="material-icons text-[20px]">close</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <ScheduleFormFields
              formData={formData}
              dropdowns={dropdowns}
              attachments={attachments}
              participantSearch={participantSearch}
              editorRef={editorRef}
              photoInputRef={photoInputRef}
              fileInputRef={fileInputRef}
              eventTypes={eventTypes}
              notificationOptions={notificationOptions}
              timezoneOptions={timezoneOptions}
              timeOptions={timeOptions}
              psychologists={psychologists}
              participants={participants}
              loadingPsychologists={loadingPsychologists}
              loadingParticipants={loadingParticipants}
              getAvailableLocations={getAvailableLocations}
              handleInputChange={handleInputChange}
              toggleDropdown={toggleDropdown}
              handleFileSelect={handleFileSelect}
              removeAttachment={removeAttachment}
              handleParticipantSelect={handleParticipantSelect}
              removeParticipant={removeParticipant}
              removeDateSlot={removeDateSlot}
              updateAdditionalDate={updateAdditionalDate}
              setParticipantSearch={setParticipantSearch}
              setPreviewAttachment={setPreviewAttachment}
              uploadingAttachments={uploadingAttachments}
              loading={loading}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2 text-[#488BBA] border border-[#488BBA] rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.agenda.trim() || (formData.type === "counseling" && (!formData.selectedPsychologist || formData.selectedParticipants.length === 0 || !formData.location.trim()))}
                className="px-6 py-2 bg-[#488BBA] text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              >
                {loading ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#488BBA]"></div>
                <span className="text-[#488BBA] font-medium">Menyimpan...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AttachmentPreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
};

export default CreateScheduleModal;