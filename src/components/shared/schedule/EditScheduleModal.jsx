// src/components/shared/schedule/EditScheduleModal.jsx
import { toast } from "sonner"
import { useScheduleForm } from "./hooks/useScheduleForm"
import ScheduleFormFields from "./ScheduleFormFields"
import AttachmentPreviewModal from "./AttachmentPreviewModal"

const EditScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  onCancelReturnToView,
  organizationType = "school",
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
    updateAdditionalDate,
    validateForm,
    hasUnsavedChanges,
    parseErrorMessage,
    uploadAttachmentsMutation,
    setUploadingAttachments,
} = useScheduleForm("edit", initialData, isOpen, organizationType)

  // FIXED: Check if schedule is in the past (cannot edit)
  const isScheduleInPast = () => {
    if (!initialData?.startDateTime) return false
    
    const scheduleStartTime = new Date(initialData.startDateTime)
    const now = new Date()
    
    // Allow editing if schedule is more than 5 minutes from now
    return scheduleStartTime < new Date(now.getTime() - 5 * 60 * 1000)
  }

  // FIXED: Check if schedule is within 24 hours (counseling restriction)
  const isWithin24Hours = () => {
    if (!initialData?.startDateTime || initialData.type !== "counseling") return false
    
    const scheduleStartTime = new Date(initialData.startDateTime)
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    return scheduleStartTime < twentyFourHoursFromNow
  }


 const newAttachmentsToUpload = attachments.filter((att) => !att.isExisting)


const handleSubmit = async () => {
    // FIXED: Check if schedule is in the past
    if (isScheduleInPast()) {
      toast.error("Tidak dapat mengedit jadwal yang sudah berlalu")
      return
    }

    // FIXED: Check counseling 24-hour restriction
    if (isWithin24Hours()) {
      toast.error("Tidak dapat mengedit jadwal konseling yang kurang dari 24 jam dari sekarang")
      return
    }

    if (!validateForm()) {
      return
    }

    // For edit mode - only send changed fields
    const submitData = {}

    if (formData.agenda.trim() !== (initialData.agenda || "").trim()) {
      submitData.agenda = formData.agenda.trim()
    }

    if (formData.type !== (initialData.type || "counseling")) {
      submitData.type = formData.type
    }

    if (formData.description.trim() !== (initialData.description || "").trim()) {
      submitData.description = formData.description.trim()
    }

    if (formData.notificationOffset !== (initialData.notificationOffset || 60)) {
      submitData.notificationOffset = formData.notificationOffset
    }

    const currentDatesStr = JSON.stringify(formData.dates)
    const initialDatesStr = JSON.stringify(initialData.dates || [])
    if (currentDatesStr !== initialDatesStr) {
      submitData.dates = formData.dates
    }

    if (formData.type === "counseling") {
      const currentPsychId = formData.selectedPsychologist?.id
      const initialPsychId = initialData.selectedPsychologist?.id

      const currentPatientIds = formData.selectedParticipants.map((p) => p.id).sort()
      const initialPatientIds = (initialData.selectedParticipants || []).map((p) => p.id).sort()

      const psychChanged = currentPsychId !== initialPsychId
      const patientsChanged = JSON.stringify(currentPatientIds) !== JSON.stringify(initialPatientIds)

      if (psychChanged || patientsChanged) {
        if (formData.selectedPsychologist && formData.selectedParticipants.length > 0) {
          submitData.participants = {
            psychologistId: formData.selectedPsychologist.id,
            patientIds: formData.selectedParticipants.map((participant) => participant.id),
          }
        }
      }
    }

    if (formData.type === "counseling") {
      const currentLoc = formData.location
      const initialLoc = initialData.location || initialData._originalBackendLocation || ""

      if (currentLoc !== initialLoc) {
        const isStandardLocation = fixedLocationOptions.find((opt) => opt.value === currentLoc)
        if (isStandardLocation) {
          submitData.location = currentLoc
        } else {
          submitData.location = "offline"
          submitData.actualLocationName = currentLoc
        }
      }
    } else {
      if (formData.customLocation !== (initialData.customLocation || "")) {
        submitData.customLocation = formData.customLocation
      }
    }

    if (initialData?.id) {
      submitData.id = initialData.id
    }

    // FIXED: Get new attachments to upload
    const newAttachmentsToUpload = attachments.filter((att) => !att.isExisting)

    try {
      console.log("=== EditScheduleModal handleSubmit ===")
      console.log("Submit data:", submitData)
      console.log("Attachments to upload:", newAttachmentsToUpload)

      // Step 1 - Update schedule FIRST
      console.log("Step 1: Updating schedule...")
      const result = await onSubmit(submitData)
      console.log("Schedule update result:", result)

      // FIXED: Flag to prevent duplicate toasts
      let hasShownSuccessToast = false

      // // Step 2 - Handle success notification based on attachments
      // if (newAttachmentsToUpload.length === 0) {
      //   // No attachments - show success immediately
      //   toast.success("Jadwal berhasil diperbarui")
      //   hasShownSuccessToast = true
      // }

      // Step 3 - Upload attachments in background AFTER schedule is updated
      if (result?.data && newAttachmentsToUpload.length > 0) {
        console.log("Step 3: Processing attachments in background...")

        // Run attachment upload in background without blocking UI
        setTimeout(async () => {
          try {
            const scheduleIds = initialData?.id ? [initialData.id] : []

            if (scheduleIds.length > 0) {
              await uploadAttachmentsMutation.mutateAsync({
                scheduleIds,
                files: newAttachmentsToUpload.map((a) => a.file),
              })

              console.log("Attachments uploaded successfully")
              
              // FIXED: Only show toast if we haven't shown it already
              if (!hasShownSuccessToast) {
                toast.success("Jadwal dan lampiran berhasil diperbarui")
              }
            } else {
              console.warn("No schedule IDs found for attachment upload")
              
              // Show warning only if main success toast wasn't shown
              if (!hasShownSuccessToast) {
                toast.warning("Lampiran tidak dapat diunggah karena ID jadwal tidak ditemukan")
              }
            }
          } catch (attachmentError) {
            console.error("Background attachment upload error:", attachmentError)

            const errorMessage =
              attachmentError?.response?.data?.message ||
              attachmentError?.message ||
              "Unknown attachment upload error"

            // Show error toast regardless
            toast.error("Gagal mengunggah lampiran", {
              description: `Error: ${errorMessage}. Silakan edit jadwal untuk menambahkan lampiran.`,
              duration: 8000,
            })
          }
        }, 100)
      }

      // Modal will be closed by parent component on successful onSubmit
    } catch (error) {
      console.error("Update schedule error:", error)

      // Don't close modal on error - let user retry
      const errorMessage = error?.response?.data?.message || error.message || "Failed to update schedule"
      const parsedMessage = parseErrorMessage(errorMessage)

      toast.error("Gagal memperbarui jadwal", {
        description: parsedMessage,
        duration: 8000,
      })

      // Don't return or close modal - let user retry
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
            if (onCancelReturnToView) {
              onCancelReturnToView() // Return to view modal
            } else {
              onClose() // Close completely
            }
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
      if (onCancelReturnToView) {
        onCancelReturnToView() // Return to view modal
      } else {
        onClose() // Close completely
      }
    }
  }

  if (!isOpen) return null

  // Combined loading state for better UX
  const isSubmitting = loading || uploadAttachmentsMutation.isPending

  // FIXED: Disable form if schedule is in the past
  const isFormDisabled = isScheduleInPast() || isSubmitting

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
        onClick={(e) => e.target === e.currentTarget && handleCancel()}
      >
        <div className="bg-white rounded-lg max-w-[600px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex justify-end items-center p-6">
            {/* Show past schedule warning */}
            {isScheduleInPast() && (
              <div className="flex-1 mr-4">
                <div className="bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2 rounded text-sm">
                  <span className="material-icons text-sm mr-1">warning</span>
                  Jadwal ini sudah berlalu dan tidak dapat diedit
                </div>
              </div>
            )}
            {/* Show 24-hour warning for counseling */}
            {!isScheduleInPast() && isWithin24Hours() && (
              <div className="flex-1 mr-4">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
                  <span className="material-icons text-sm mr-1">schedule</span>
                  Konseling kurang dari 24 jam tidak dapat diedit
                </div>
              </div>
            )}
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
              updateAdditionalDate={updateAdditionalDate}
              setParticipantSearch={setParticipantSearch}
              setPreviewAttachment={setPreviewAttachment}
              uploadingAttachments={uploadingAttachments}
              loading={isFormDisabled}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6 py-2 text-[#488BBA] border border-[#488BBA] rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isScheduleInPast() ? "Tutup" : "Batal"}
              </button>
              
              {/* FIXED: Hide update button if schedule is in the past */}
              {!isScheduleInPast() && (
                <button
                  onClick={handleSubmit}
                  disabled={
                    isFormDisabled ||
                    !formData.agenda.trim() ||
                    (formData.type === "counseling" &&
                      (!formData.selectedPsychologist ||
                        formData.selectedParticipants.length === 0 ||
                        !formData.location.trim()))
                  }
                  className="px-6 py-2 bg-[#488BBA] text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center gap-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {isSubmitting ? "Menyimpan..." : "Update"}
                </button>
              )}
            </div>
          </div>

          {/* Loading overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#488BBA]"></div>
                <div className="text-center">
                  <span className="text-[#488BBA] font-medium block">
                    {uploadAttachmentsMutation.isPending ? "Mengunggah lampiran..." : "Memperbarui jadwal..."}
                  </span>
                  {newAttachmentsToUpload.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {uploadAttachmentsMutation.isPending ? `${newAttachmentsToUpload.length} file` : "Mohon tunggu"}
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

export default EditScheduleModal