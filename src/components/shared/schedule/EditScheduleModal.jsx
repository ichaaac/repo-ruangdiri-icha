"use client"
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
  onCancelReturnToView, // New prop for returning to view modal
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
    setUploadingAttachments, // Declared variable
  } = useScheduleForm("edit", initialData, isOpen)

const handleSubmit = async () => {
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

    const newAttachmentsToUpload = attachments.filter((att) => !att.isExisting)

    try {
      console.log("=== EditScheduleModal handleSubmit ===")
      console.log("Submit data:", submitData)
      console.log("Attachments to upload:", newAttachmentsToUpload)

      // FIXED: Step 1 - Update schedule FIRST
      console.log("Step 1: Updating schedule...")
      const result = await onSubmit(submitData)
      console.log("Schedule update result:", result)

      // FIXED: Step 2 - Show success toast immediately after schedule update
      if (newAttachmentsToUpload.length === 0) {
        toast.success("Jadwal berhasil diperbarui")
      } else {
        toast.success("Jadwal berhasil diperbarui, sedang mengunggah lampiran...")
      }

      // FIXED: Step 3 - Upload attachments in background AFTER schedule is updated
      if (result?.data && newAttachmentsToUpload.length > 0) {
        console.log("Step 3: Processing attachments in background...")

        // Run attachment upload in background without blocking UI
        setTimeout(async () => {
          try {
            // For edit mode, we usually have a single schedule ID
            const scheduleIds = initialData?.id ? [initialData.id] : []

            console.log("Extracted schedule IDs for attachment upload:", scheduleIds)

            if (scheduleIds.length > 0) {
              console.log(
                `Uploading ${newAttachmentsToUpload.length} attachments to ${scheduleIds.length} schedule(s)...`,
              )

              // Upload attachments
              await uploadAttachmentsMutation.mutateAsync({
                scheduleIds,
                files: newAttachmentsToUpload.map((a) => a.file),
              })

              console.log("Attachments uploaded successfully")
              toast.success(`${newAttachmentsToUpload.length} lampiran berhasil diunggah`)
            } else {
              console.warn("No schedule IDs found for attachment upload")
              toast.warning("Lampiran tidak dapat diunggah karena ID jadwal tidak ditemukan")
            }
          } catch (attachmentError) {
            console.error("Background attachment upload error:", attachmentError)

            const errorMessage =
              attachmentError?.response?.data?.message || attachmentError?.message || "Unknown attachment upload error"

            // Show error toast
            toast.error("Gagal mengunggah lampiran", {
              description: `Error: ${errorMessage}. Silakan edit jadwal untuk menambahkan lampiran.`,
              duration: 8000,
            })
          }
        }, 100) // Small delay to ensure UI updates first
      }

      // Modal will be closed by parent component on successful onSubmit
    } catch (error) {
      console.error("Update schedule error:", error)

      // FIXED: Don't close modal on error - let user retry
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
                {isSubmitting ? "Menyimpan..." : "Update"}
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
