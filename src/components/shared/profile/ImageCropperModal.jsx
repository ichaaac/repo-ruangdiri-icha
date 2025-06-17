// // src/components/shared/profile/ImageCropperModal.jsx
// import React, { useState, useCallback } from "react";
// import Cropper from "react-easy-crop";

// const ImageCropperModal = ({ imageSrc, onClose, onSave, isSaving }) => {
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

//   const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
//     setCroppedAreaPixels(croppedAreaPixels);
//   }, []);

//   // DIUBAH: Sekarang onSave cuma ngirim data kordinat
//   const handleSave = () => {
//     if (isSaving || !croppedAreaPixels) return;
//     onSave(croppedAreaPixels);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
//       <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-800">Paskan Foto Profil</h3>
//           <button
//             onClick={onClose}
//             disabled={isSaving}
//             className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
//           >
//             <span className="material-icons">close</span>
//           </button>
//         </div>

//         {/* Cropper */}
//         <div className="relative w-full h-80 bg-gray-900">
//           <Cropper
//             image={imageSrc}
//             crop={crop}
//             zoom={zoom}
//             aspect={1}
//             onCropChange={setCrop}
//             onZoomChange={setZoom}
//             onCropComplete={onCropComplete}
//             cropShape="round"
//             showGrid={false}
//           />
//         </div>

//         {/* Controls */}
//         <div className="p-4 space-y-4">
//           <div className="flex items-center gap-4">
//             <span className="material-icons text-gray-600">zoom_out</span>
//             <input
//               type="range"
//               value={zoom}
//               min={1}
//               max={3}
//               step={0.1}
//               aria-labelledby="Zoom"
//               onChange={(e) => setZoom(Number(e.target.value))}
//               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
//             />
//             <span className="material-icons text-gray-600">zoom_in</span>
//           </div>
//           <button
//             onClick={handleSave}
//             disabled={isSaving}
//             className="w-full h-11 px-6 bg-primary text-white font-bold rounded-full hover:bg-primary-variant1 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
//           >
//             {isSaving ? (
//               <>
//                 <span className="material-icons animate-spin text-xl mr-2">refresh</span>
//                 Menerapkan...
//               </>
//             ) : (
//               "Terapkan"
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ImageCropperModal;