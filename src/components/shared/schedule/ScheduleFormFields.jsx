// src/components/shared/schedule/ScheduleFormFields.jsx

import { useState } from "react"

// Custom Tooltip Component for truncated text
const TruncateTooltip = ({ text, x, y, show, position = 'above' }) => {
  if (!show || !text) return null;

  const isAbove = position === 'above'

  return (
    <div
      className="fixed z-[10000]"
      style={{
        left: x,
        top: y,
        transform: `translateX(-50%) ${isAbove ? 'translateY(-100%)' : 'translateY(0%)'}`,
        pointerEvents: "none"
      }}
    >
      <div className="relative">
        <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 shadow-2xl border border-gray-700 max-w-xs">
          <div
            style={{
              maxWidth: "280px",
              whiteSpace: "normal",
              wordBreak: "break-word",
              fontWeight: "500",
              lineHeight: "1.4"
            }}
          >
            {text}
          </div>
        </div>
        
        {/* Arrow */}
        <div className={`absolute left-1/2 transform -translate-x-1/2 ${isAbove ? 'top-full' : 'bottom-full'}`}>
          {isAbove ? (
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          ) : (
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
          )}
        </div>
      </div>
    </div>
  );
};

const ScheduleFormFields = ({
  formData,
  dropdowns,
  attachments,
  participantSearch,
  editorRef,
  photoInputRef,
  fileInputRef,
  eventTypes,
  notificationOptions,
  timezoneOptions,
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
  setParticipantSearch,
  setPreviewAttachment,
  uploadingAttachments,
  loading,
}) => {
  const selectedEventType = eventTypes.find((type) => type.value === formData.type) || eventTypes[0]
  const showParticipants = formData.type === "counseling"

  // State for tooltips
  const [hoveredTooltip, setHoveredTooltip] = useState(null)

  const openAttachmentPreview = (attachment) => {
    setPreviewAttachment(attachment)
  }

  // Helper to get the base URL for uploads
  const getUploadBaseUrl = () => {
    return import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_API_URL || ""
  }

  // Helper to truncate text
  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  // Handle tooltip on hover
  const handleTooltipHover = (e, fullText) => {
    if (!fullText || fullText.length <= 25) {
      setHoveredTooltip(null)
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollY = window.scrollY
    const viewportHeight = window.innerHeight
    
    // Check if there's enough space above
    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom
    
    let x = rect.left + rect.width / 2
    let y, position
    
    if (spaceAbove > 100) {
      // Position above
      y = rect.top + scrollY - 10
      position = 'above'
    } else {
      // Position below
      y = rect.bottom + scrollY + 10
      position = 'below'
    }
    
    setHoveredTooltip({
      text: fullText,
      x: x,
      y: y,
      position: position
    })
  }

  const handleTooltipLeave = () => {
    setHoveredTooltip(null)
  }

  // Close tooltip when dropdown changes
  const handleDropdownToggle = (dropdown) => {
    setHoveredTooltip(null) // Clear tooltip when dropdown state changes
    toggleDropdown(dropdown)
  }

  return (
    <>
      {/* Agenda & Type */}
      <div className="flex gap-4 items-center">
        <span className="material-icons text-[#488BBA] text-[25px]">list_alt</span>
        <div className="flex-1 relative">
          {!formData.agenda.trim() && (
            <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
          )}
          <input
            type="text"
            value={formData.agenda}
            onChange={(e) => handleInputChange("agenda", e.target.value)}
            placeholder="Masukkan agenda"
            disabled={loading}
            className={`w-full pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
              formData.agenda.trim() ? "pl-3" : "pl-6"
            }`}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => !loading && handleDropdownToggle("type")}
            disabled={loading}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md min-w-[120px] focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
          >
            <span style={{ color: selectedEventType.textColor }} className="font-medium">
              {selectedEventType.label}
            </span>
            <span className="material-icons text-gray-400 ml-2">keyboard_arrow_down</span>
          </button>
          {dropdowns.type && !loading && (
            <div 
              className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10"
              onMouseLeave={handleTooltipLeave}
            >
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    handleInputChange("type", type.value)
                    handleDropdownToggle("type")
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                >
                  <span style={{ color: type.textColor }} className="font-medium">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date & Time section */}
      <div className="flex gap-4 items-start">
        <span className="material-icons text-[#488BBA] text-[25px] mt-1">schedule</span>
        <div className="flex-1 space-y-3">
          {formData.dates.map((dateInfo, index) => (
            <div key={index} className="flex gap-2 items-center flex-wrap">
              <input
                type="date"
                value={dateInfo.date}
                onChange={(e) => {
                  const newDates = [...formData.dates]
                  newDates[index] = { ...newDates[index], date: e.target.value }
                  handleInputChange("dates", newDates)
                }}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
              />

              <select
                value={dateInfo.startTime}
                onChange={(e) => updateAdditionalDate(index, "startTime", e.target.value)}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <span className="text-[#488BBA]">-</span>

              <select
                value={dateInfo.endTime}
                onChange={(e) => updateAdditionalDate(index, "endTime", e.target.value)}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <select
                value={dateInfo.timezone}
                onChange={(e) => updateAdditionalDate(index, "timezone", e.target.value)}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Multiple Date Checkbox - Always Visible */}
          <div 
            className="flex gap-2 items-center text-sm cursor-pointer select-none hover:opacity-80 transition-opacity"
            onClick={() => !loading && handleInputChange("multipleDate", !formData.multipleDate)}
          >
            <input
              type="checkbox"
              checked={formData.multipleDate}
              onChange={(e) => handleInputChange("multipleDate", e.target.checked)}
              disabled={loading}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-sm border-2 border-[#535353] flex items-center justify-center transition-colors ${
              formData.multipleDate 
                ? 'bg-[#535353]' 
                : 'bg-white'
            }`}>
              {formData.multipleDate && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-[#535353]">Multiple Date</span>
          </div>
        </div>
      </div>

      {/* Notification */}
      <div className="flex gap-4 items-center">
        <span className="material-icons text-[#488BBA] text-[25px]">notifications_active</span>
        <select
          value={formData.notificationOffset}
          onChange={(e) => handleInputChange("notificationOffset", Number.parseInt(e.target.value))}
          disabled={loading}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
        >
          {notificationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Participants - Only for Counseling */}
      {showParticipants && (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <span className="material-icons text-[#488BBA] text-[25px] mt-1">account_circle</span>
            <div className="flex-1">
              <div className="flex flex-col gap-4">
                {/* Psychologist Field */}
                <div>
                  <div className="relative">
                    {!formData.selectedPsychologist && (
                      <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
                    )}
                    <button
                      onClick={() => !loading && handleDropdownToggle("psychologist")}
                      disabled={loading}
                      className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                        formData.selectedPsychologist ? "px-3 py-2" : "pl-6"
                      }`}
                      style={{ minHeight: "42px" }}
                    >
                      {!formData.selectedPsychologist ? (
                        <span className="text-gray-500">Email/nama Psikolog</span>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                            <div className="text-[#535353] text-sm font-normal truncate">
                              {formData.selectedPsychologist.fullName}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInputChange("selectedPsychologist", null)
                                handleInputChange("location", "")
                              }}
                              disabled={loading}
                              className="w-4 h-4 flex items-center justify-center text-[#535353] hover:text-gray-700 shrink-0"
                            >
                              <span className="material-icons text-xs">close</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">
                        keyboard_arrow_down
                      </span>
                    </button>
                    {dropdowns.psychologist && !loading && (
                      <div 
                        className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
                        onMouseLeave={handleTooltipLeave}
                      >
                        {loadingPsychologists ? (
                          <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                        ) : psychologists && psychologists.length > 0 ? (
                          psychologists.map((psychologist) => {
                            const fullName = psychologist.fullName || 'Unknown';
                            const showTooltip = fullName.length > 25;
                            return (
                              <button
                                key={psychologist.id}
                                onClick={() => {
                                  handleInputChange("selectedPsychologist", psychologist)
                                  handleInputChange("location", "")
                                  handleDropdownToggle("psychologist")
                                }}
                                onMouseEnter={(e) => showTooltip && handleTooltipHover(e, fullName)}
                                onMouseLeave={handleTooltipLeave}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100"
                              >
                                <div className="font-medium text-sm truncate">{truncateText(fullName, 25)}</div>
                                <div className="text-xs text-gray-500 truncate">{truncateText(psychologist.email || 'No email', 30)}</div>
                              </button>
                            )
                          })
                        ) : (
                          <div className="p-3 text-center text-gray-500 text-sm">Tidak ada psikolog ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Participant 1 Field */}
                <div>
                  <div className="relative">
                    {!formData.selectedParticipants[0] && (
                      <span className="absolute left-2 top-3 text-[#EE4266] text-sm pointer-events-none z-10">*</span>
                    )}
                    <button
                      onClick={() =>
                        !loading && formData.selectedParticipants.length < 2 && handleDropdownToggle("participants1")
                      }
                      disabled={
                        loading || (formData.selectedParticipants.length >= 2 && !formData.selectedParticipants[0])
                      }
                      className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                        formData.selectedParticipants[0] ? "px-3 py-2" : "pl-6"
                      }`}
                      style={{ minHeight: "42px" }}
                    >
                      {!formData.selectedParticipants[0] ? (
                        <span className="text-gray-500">Email/nama Klien 1</span>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                            <div className="text-[#535353] text-sm font-normal truncate">
                              {formData.selectedParticipants[0].fullName}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeParticipant(formData.selectedParticipants[0].id)
                              }}
                              disabled={loading}
                              className="w-4 h-4 flex items-center justify-center text-[#535353] hover:text-gray-700 shrink-0"
                            >
                              <span className="material-icons text-xs">close</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">
                        keyboard_arrow_down
                      </span>
                    </button>
                    {dropdowns.participants1 &&
                      !loading &&
                      (formData.selectedParticipants.length < 2 || !formData.selectedParticipants[0]) && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
                             onMouseLeave={handleTooltipLeave}>
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              placeholder="Cari nama atau email..."
                              value={participantSearch}
                              onChange={(e) => setParticipantSearch(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#488BBA]"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {loadingParticipants ? (
                            <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                          ) : participants.length > 0 ? (
                            participants
                              .filter((p) => !formData.selectedParticipants.find((sp) => sp.id === p.id))
                              .map((participant) => {
                                const fullName = participant.fullName;
                                const showTooltip = fullName && fullName.length > 25;
                                return (
                                  <button
                                    key={participant.id}
                                    onClick={() => handleParticipantSelect(participant, 0)}
                                    onMouseEnter={(e) => showTooltip && handleTooltipHover(e, fullName)}
                                    onMouseLeave={handleTooltipLeave}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-sm truncate">{truncateText(fullName, 25)}</div>
                                    <div className="text-xs text-gray-500 truncate">{truncateText(participant.email, 30)}</div>
                                  </button>
                                )
                              })
                          ) : (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              {participantSearch ? "Tidak ada hasil pencarian" : "Tidak ada partisipan ditemukan"}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Participant 2 Field (Optional) */}
                <div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        !loading && formData.selectedParticipants.length < 2 && handleDropdownToggle("participants2")
                      }
                      disabled={
                        loading || (formData.selectedParticipants.length >= 2 && !formData.selectedParticipants[1])
                      }
                      className={`relative w-full py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 ${
                        formData.selectedParticipants[1] ? "px-3 py-2" : "pl-6"
                      }`}
                      style={{ minHeight: "42px" }}
                    >
                      {!formData.selectedParticipants[1] ? (
                        <span className="text-gray-500">Email/nama Klien 2 (Opsional)</span>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <div className="px-2.5 py-1 bg-[#eeeeee] rounded-[5px] flex items-center gap-2 max-w-full">
                            <div className="text-[#535353] text-sm font-normal truncate">
                              {formData.selectedParticipants[1].fullName}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeParticipant(formData.selectedParticipants[1].id)
                              }}
                              disabled={loading}
                              className="w-4 h-4 flex items-center justify-center text-[#535353] hover:text-gray-700 shrink-0"
                            >
                              <span className="material-icons text-xs">close</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">
                        keyboard_arrow_down
                      </span>
                    </button>
                    {dropdowns.participants2 &&
                      !loading &&
                      (formData.selectedParticipants.length < 2 || !formData.selectedParticipants[1]) && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
                             onMouseLeave={handleTooltipLeave}>
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              placeholder="Cari nama atau email..."
                              value={participantSearch}
                              onChange={(e) => setParticipantSearch(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#488BBA]"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {loadingParticipants ? (
                            <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                          ) : participants.length > 0 ? (
                            participants
                              .filter((p) => !formData.selectedParticipants.find((sp) => sp.id === p.id))
                              .map((participant) => {
                                const fullName = participant.fullName;
                                const showTooltip = fullName && fullName.length > 25;
                                return (
                                  <button
                                    key={participant.id}
                                    onClick={() => handleParticipantSelect(participant, 1)}
                                    onMouseEnter={(e) => showTooltip && handleTooltipHover(e, fullName)}
                                    onMouseLeave={handleTooltipLeave}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-sm truncate">{truncateText(fullName, 25)}</div>
                                    <div className="text-xs text-gray-500 truncate">{truncateText(participant.email, 30)}</div>
                                  </button>
                                )
                              })
                          ) : (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              {participantSearch ? "Tidak ada hasil pencarian" : "Tidak ada partisipan ditemukan"}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location for Counseling */}
          <div className="flex gap-4 items-center">
            <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
            <select
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100"
            >
              <option value="">Pilih Lokasi</option>
              {getAvailableLocations().map((option) => (
                <option key={option.value} value={option.value} title={option.label}>
                  {truncateText(option.label, 30)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Custom Location - for non-counseling */}
      {!showParticipants && (
        <div className="flex gap-4 items-center">
          <span className="material-icons text-[#488BBA] text-[25px]">location_on</span>
          <textarea
            value={formData.customLocation}
            onChange={(e) => handleInputChange("customLocation", e.target.value)}
            placeholder="Masukkan lokasi"
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#488BBA] disabled:bg-gray-100 resize-none min-h-[42px]"
            rows="2"
          />
        </div>
      )}

      {/* Description & Attachments */}
      <div className="flex gap-4 items-start">
        <span className="material-icons text-[#488BBA] text-[25px] mt-1">description</span>
        <div className="flex-1">
          <div className="border border-gray-300 rounded-md min-h-[100px] p-3 relative">
            {(!formData.description || formData.description.trim() === "" || formData.description === "<br>") && (
              <div className="absolute top-3 left-3 text-gray-500 pointer-events-none">Masukkan deskripsi</div>
            )}
            <div
              ref={editorRef}
              contentEditable={!loading}
              onInput={() => {
                if (editorRef.current) {
                  const content = editorRef.current.innerHTML
                  const cleanContent = content === "<br>" || content === "<div><br></div>" ? "" : content

                  if (cleanContent.length <= 255) {
                    handleInputChange("description", cleanContent)
                  } else {
                    const truncated = cleanContent.substring(0, 255)
                    editorRef.current.innerHTML = truncated
                    handleInputChange("description", truncated)
                  }
                }
              }}
              onFocus={() => {
                if (
                  editorRef.current &&
                  (editorRef.current.innerHTML === "" || editorRef.current.innerHTML === "<br>")
                ) {
                  editorRef.current.innerHTML = ""
                }
              }}
              onBlur={() => {
                if (editorRef.current) {
                  const content = editorRef.current.innerHTML
                  if (content === "<br>" || content === "<div><br></div>" || content.trim() === "") {
                    editorRef.current.innerHTML = ""
                    handleInputChange("description", "")
                  }
                }
              }}
              className="outline-none resize-none min-h-[60px] focus:ring-2 focus:ring-[#488BBA] rounded p-1"
              style={{ wordBreak: "break-word" }}
              suppressContentEditableWarning={true}
            />

            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    <button
                      onClick={() => {
                        if (attachment.isExisting) {
                          // For existing attachments, handle preview/download
                          const attachmentUrl = attachment.downloadUrl.startsWith("http")
                            ? attachment.downloadUrl
                            : `${getUploadBaseUrl()}${attachment.downloadUrl}`
                          if (attachment.type === "image" && attachmentUrl) {
                            window.open(attachmentUrl, "_blank")
                          } else if (attachmentUrl) {
                            window.open(attachmentUrl, "_blank")
                          }
                        } else {
                          // For new attachments, show preview
                          openAttachmentPreview(attachment)
                        }
                      }}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors"
                      title={attachment.isExisting ? "Click to view/download" : "Click to preview"}
                    >
                      <span className="material-icons text-xs">
                        {attachment.type === "image" ? "image" : "description"}
                      </span>
                      <span className="max-w-20 truncate">{attachment.name}</span>
                      {attachment.isExisting && <span className="text-blue-600 text-[10px]">(existing)</span>}
                    </button>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                onChange={(e) => handleFileSelect(e, "document")}
                className="hidden"
                disabled={loading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center hover:text-[#488BBA] transition-colors"
                title="Upload Files"
              >
                <span className="material-icons text-gray-400" style={{ fontSize: "18px" }}>
                  attach_file
                </span>
              </button>

              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "image")}
                className="hidden"
                disabled={loading}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center hover:text-[#488BBA] transition-colors"
                title="Upload Photos"
              >
                <span className="material-icons text-gray-400" style={{ fontSize: "18px" }}>
                  add_photo_alternate
                </span>
              </button>

              {uploadingAttachments && <span className="text-xs text-blue-500">Uploading...</span>}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="text-xs text-gray-600">
              <span className="text-[#EE4266]">*</span> Wajib diisi
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <TruncateTooltip
        text={hoveredTooltip?.text}
        x={hoveredTooltip?.x}
        y={hoveredTooltip?.y}
        position={hoveredTooltip?.position}
        show={!!hoveredTooltip}
      />
    </>
  )
}

export default ScheduleFormFields