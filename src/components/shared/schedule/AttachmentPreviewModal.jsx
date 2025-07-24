// src/components/shared/schedule/components/AttachmentPreviewModal.jsx - Attachment Preview

import React from "react";

const AttachmentPreviewModal = ({ attachment, isOpen, onClose }) => {
  if (!isOpen || !attachment) return null;

  const isImage = attachment.type === 'image' || attachment.file?.type?.startsWith('image/');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[10000]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 z-10"
        >
          <span className="material-icons text-[24px]">close</span>
        </button>
        
        <div className="bg-white rounded-lg p-4 max-w-full max-h-full overflow-auto">
          <div className="flex items-center gap-3 mb-4 border-b pb-3">
            <span className="material-icons text-[#488BBA] text-[20px]">
              {isImage ? 'image' : 'description'}
            </span>
            <div>
              <div className="font-medium text-gray-900">{attachment.name}</div>
              <div className="text-sm text-gray-500">
                {(attachment.file?.size ? (attachment.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size')}
              </div>
            </div>
          </div>
          
          {isImage ? (
            <img 
              src={attachment.preview} 
              alt={attachment.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
              style={{ minHeight: '200px' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
              <span className="material-icons text-[64px] text-gray-400 mb-4">description</span>
              <div className="text-lg font-medium text-gray-700 mb-2">{attachment.name}</div>
              <div className="text-gray-500 mb-4">
                File will be uploaded when you submit the form
              </div>
              <div className="text-sm text-gray-400">
                Preview not available for this file type
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreviewModal;