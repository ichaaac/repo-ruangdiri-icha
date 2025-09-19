// src/components/shared/schedule/CreateScheduleModal.jsx
import { toast } from "sonner"
import { useScheduleForm } from "./hooks/useScheduleForm"
import ScheduleFormFields from "./ScheduleFormFields"
import AttachmentPreviewModal from "./AttachmentPreviewModal"

const CreateScheduleModal = ({ isOpen, onClose, onSubmit, initialData = null, loading = false, organizationType = "school" }) => {  const {
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
    updateAdditionalDate,
    validateForm,
    hasUnsavedChanges,
    parseErrorMessage,
    uploadAttachmentsMutation,
    setUploadingAttachments,
    // User context for psychologist view-only behavior
    currentUserTimezone,
    isUserPsychologist,
    currentUserAsPsychologist,
} = useScheduleForm("create", initialData, isOpen, organizationType)

const newAttachmentsToUpload = attachments.filter((att) => !att.isExisting);

// CreateScheduleModal.jsx

// CreateScheduleModal.jsx

const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // LANGSUNG BANGUN PAYLOAD LENGKAP UNTUK CREATE
    const submitData = {
      agenda: formData.agenda.trim(),
      type: formData.type,
      description: formData.description.trim(),
      notificationOffset: formData.notificationOffset,
      dates: formData.dates,
    }

    if (formData.type === "counseling") {
      if (formData.selectedPsychologist && formData.selectedParticipants.length > 0) {
        submitData.participants = {
          psychologistId: formData.selectedPsychologist.id,
          patientIds: formData.selectedParticipants.map((p) => p.id),
        }
      }
      
      const isStandardLocation = fixedLocationOptions.find((opt) => opt.value === formData.location)
      if (isStandardLocation) {
        submitData.location = formData.location
      } else {
        submitData.location = formData.location // FIXED: Send actual location, not "offline" + actualLocationName
      }

    } else {
      if (formData.customLocation) {
        submitData.customLocation = formData.customLocation
      }
    }

    const newAttachmentsToUpload = attachments.filter((att) => !att.isExisting)

    try {
      console.log("=== CreateScheduleModal handleSubmit ===")
      console.log("Submit data:", submitData)
      console.log("Attachments to upload:", newAttachmentsToUpload)

      // Step 1: Create the schedule FIRST
      console.log("Step 1: Creating schedule...")
      const result = await onSubmit(submitData)
      console.log("Schedule creation result:", result)
      
      // Step 2: Extract schedule ID from successful creation with better validation
      let scheduleIds = []
      console.log("Extracting schedule IDs from result...")
      
      if (result?.data?.data) {
        const createdSchedule = Array.isArray(result.data.data) ? result.data.data : [result.data.data];
        console.log("Created schedule data:", createdSchedule)
        
        scheduleIds = createdSchedule
          .map(s => {
            const id = s?.id || s?.scheduleId || s?.Id;
            console.log("Processing schedule object:", s, "Extracted ID:", id);
            return id;
          })
          .filter(Boolean);
          
        console.log("Final extracted schedule IDs:", scheduleIds)
      } else if (result?.data?.id) {
        // Handle single schedule creation with direct ID
        scheduleIds = [result.data.id];
        console.log("Single schedule ID extracted:", scheduleIds)
      } else if (result?.id) {
        // Handle direct ID response
        scheduleIds = [result.id];
        console.log("Direct ID extracted:", scheduleIds)
      }

      // Step 3: Handle attachments ONLY AFTER successful schedule creation
      if (newAttachmentsToUpload.length === 0) {
        // No attachments to upload
        toast.success("Jadwal berhasil dibuat")
      } else {
        // Validate we have schedule IDs before uploading
        if (scheduleIds.length === 0) {
          console.error("No schedule IDs found for attachment upload. Full result:", result)
          toast.warning("Jadwal berhasil dibuat, tetapi lampiran tidak dapat diunggah", {
            description: "ID jadwal tidak ditemukan dari response server.",
            duration: 8000
          })
          return
        }
        
        // Upload attachments immediately with proper schedule IDs
        toast.success("Jadwal berhasil dibuat, sedang mengunggah lampiran...")
        
        const uploadAttachments = async () => {
          try {
            console.log("Uploading attachments with schedule IDs:", scheduleIds)
            await uploadAttachmentsMutation.mutateAsync({
              scheduleIds,
              files: newAttachmentsToUpload.map((a) => a.file),
            })
            toast.success(`Jadwal dan ${newAttachmentsToUpload.length} lampiran berhasil dibuat`)
          } catch (attachmentError) {
            console.error("Attachment upload error:", attachmentError)
            const errorMessage = attachmentError?.response?.data?.message || attachmentError.message || "Upload gagal"
            
            // Toast with retry button
            toast.error("Gagal mengunggah lampiran", {
              description: `${errorMessage}. Jadwal sudah dibuat.`,
              duration: 10000,
              action: {
                label: "Coba Lagi",
                onClick: () => uploadAttachments(), // Retry function
                className: "!bg-[#488BBA] hover:!bg-blue-600 !text-white !border-[#488BBA] hover:!border-blue-600 !ml-auto"
              }
            })
          }
        }
        
        // Execute upload immediately
        await uploadAttachments()
      }
      
    } catch (error) {
      console.error("Create schedule error:", error)
      const errorMessage = error?.response?.data?.message || error.message || "Failed to create schedule"
      const parsedMessage = parseErrorMessage(errorMessage)
      toast.error("Gagal membuat jadwal", {
        description: parsedMessage,
        duration: 8000,
      })
    }
}

  const handleCancel = () => {
    if (hasUnsavedChanges() && !hasShownUnsavedToast) {
      setHasShownUnsavedToast(true)

      toast("Ada perubahan yang belum disimpan. Yakin ingin membatalkan?", {
        action: {
          label: "Ya, Batalkan",
          onClick: () => {
            setHasShownUnsavedToast(false)
            onClose()
          },
          className: "!bg-[#EE4266] hover:!bg-[#d63854] !text-white !border-[#EE4266] hover:!border-[#d63854] !ml-auto",
        },
        cancel: {
          label: "Tetap Edit",
          onClick: () => {
            setHasShownUnsavedToast(false)
          },
          className:
            "!bg-transparent hover:!bg-gray-100 !text-[#EE4266] !border !border-[#EE4266] hover:!border-[#d63854]",
        },
        duration: 10000,
        className: "!bg-white !border !border-gray-200 !shadow-lg",
        onDismiss: () => setHasShownUnsavedToast(false),
        position: "top-center",
      })
    } else if (!hasUnsavedChanges()) {
      onClose()
    }
  }

  if (!isOpen) return null

  // FIXED: Combined loading state for better UX
  const isSubmitting = loading || uploadAttachmentsMutation.isPending

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
        onClick={(e) => e.target === e.currentTarget && handleCancel()}
      >
        <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header - Removed close button */}
          <div className="flex justify-end items-center p-6">{/* Removed close button as per request */}</div>

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
              updateAdditionalDate={updateAdditionalDate}
              setParticipantSearch={setParticipantSearch}
              setPreviewAttachment={setPreviewAttachment}
              uploadingAttachments={uploadingAttachments}
              // Pass user context to enforce view-only psychologist field
              isUserPsychologist={isUserPsychologist}
              currentUserAsPsychologist={currentUserAsPsychologist}
              currentUserTimezone={currentUserTimezone}
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
                disabled={
                  isSubmitting ||
                  !formData.agenda.trim() ||
                  (formData.type === "counseling" &&
                    (!formData.selectedPsychologist ||
                      formData.selectedParticipants.length === 0 ||
                      !formData.location.trim()))
                }
                className="px-6 py-2 bg-[#488BBA] text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center gap-2"
              >
                {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {isSubmitting ? "Menyimpan..." : "Tambah"}
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
                    {uploadAttachmentsMutation.isPending ? "Mengunggah lampiran..." : "Menyimpan jadwal..."}
                  </span>
                  {attachments.filter((att) => !att.isExisting).length > 0 && (
                    <span className="text-sm text-gray-500">
                      {uploadAttachmentsMutation.isPending
                        ? `${attachments.filter((att) => !att.isExisting).length} file`
                        : "Mohon tunggu"}
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
  )
}

export default CreateScheduleModal
