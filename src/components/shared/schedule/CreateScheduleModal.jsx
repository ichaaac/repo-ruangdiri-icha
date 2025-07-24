// src/components/shared/schedule/CreateScheduleModal.jsx - FIXED ATTACHMENT HANDLING

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
      console.log('=== CreateScheduleModal handleSubmit ===');
      console.log('Submit data:', submitData);
      console.log('Attachments to upload:', attachments);
      
      // FIXED: Create schedule first, then handle attachments
      const result = await onSubmit(submitData);
      console.log('Schedule creation result:', result);
      
      // FIXED: Handle attachments after successful creation with better error handling
      if (result?.data && attachments.length > 0) {
        console.log('Processing attachments...');
        
        try {
          // Extract schedule IDs from various response formats
          let scheduleIds = [];
          
          // Handle array response (multiple schedules)
          if (Array.isArray(result.data)) {
            scheduleIds = result.data
              .filter(schedule => schedule && schedule.id)
              .map(schedule => schedule.id);
          } 
          // Handle response with ids array
          else if (result.data.ids && Array.isArray(result.data.ids)) {
            scheduleIds = result.data.ids;
          } 
          // Handle single schedule response
          else if (result.data.id) {
            scheduleIds = [result.data.id];
          }
          // Handle nested data structure
          else if (result.data.data) {
            if (Array.isArray(result.data.data)) {
              scheduleIds = result.data.data
                .filter(schedule => schedule && schedule.id)
                .map(schedule => schedule.id);
            } else if (result.data.data.id) {
              scheduleIds = [result.data.data.id];
            }
          }
          
          console.log('Extracted schedule IDs for attachment upload:', scheduleIds);
          
          if (scheduleIds.length > 0) {
            console.log(`Uploading ${attachments.length} attachments to ${scheduleIds.length} schedule(s)...`);
            
            // FIXED: Use the mutation with proper error handling
            await uploadAttachmentsMutation.mutateAsync({
              scheduleIds,
              files: attachments.map(a => a.file)
            });
            
            console.log('Attachments uploaded successfully');
            toast.success(`Jadwal dan ${attachments.length} lampiran berhasil dibuat`);
          } else {
            console.warn('No schedule IDs found for attachment upload');
            toast.success("Jadwal berhasil dibuat", {
              description: "Lampiran tidak dapat diunggah karena ID jadwal tidak ditemukan.",
            });
          }
        } catch (attachmentError) {
          console.error("Attachment upload error:", attachmentError);
          
          // FIXED: Don't throw here - schedule was created successfully
          const errorMessage = attachmentError?.response?.data?.message || 
                              attachmentError?.message || 
                              'Unknown attachment upload error';
          
          toast.error("Jadwal berhasil dibuat, tetapi gagal mengunggah lampiran", {
            description: `Error: ${errorMessage}. Anda dapat menambahkan lampiran nanti melalui edit jadwal.`,
            duration: 8000,
          });
        }
      } else if (attachments.length === 0) {
        console.log('No attachments to upload');
        toast.success("Jadwal berhasil dibuat");
      } else {
        console.warn('Schedule created but no result data for attachments');
        toast.success("Jadwal berhasil dibuat", {
          description: "Lampiran tidak dapat diunggah. Anda dapat menambahkan lampiran nanti melalui edit jadwal.",
        });
      }
      
      // Modal will be closed by parent component on successful onSubmit
      
    } catch (error) {
      console.error("Create schedule error:", error);
      
      // FIXED: Don't close modal on error - let user retry
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to create schedule';
      const parsedMessage = parseErrorMessage(errorMessage);
      
      toast.error("Gagal membuat jadwal", {
        description: parsedMessage,
        duration: 8000,
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

  // FIXED: Combined loading state for better UX
  const isSubmitting = loading || uploadAttachmentsMutation.isPending;

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
              disabled={isSubmitting}
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
              loading={isSubmitting}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6 py-2 text-[#488BBA] border border-[#488BBA] rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.agenda.trim() || (formData.type === "counseling" && (!formData.selectedPsychologist || formData.selectedParticipants.length === 0 || !formData.location.trim()))}
                className="px-6 py-2 bg-[#488BBA] text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isSubmitting ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </div>

          {/* FIXED: Better loading overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#488BBA]"></div>
                <div className="text-center">
                  <span className="text-[#488BBA] font-medium block">
                    {uploadAttachmentsMutation.isPending ? 'Mengunggah lampiran...' : 'Menyimpan jadwal...'}
                  </span>
                  {attachments.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {uploadAttachmentsMutation.isPending ? `${attachments.length} file` : 'Mohon tunggu'}
                    </span>
                  )}
                </div>
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