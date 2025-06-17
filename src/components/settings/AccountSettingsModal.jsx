// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { passwordSchema } from '../../schemas/validationSchema';
// /**
//  * Account Settings Modal for both School and Company users
//  * Handles password change with validation
//  * 
//  * @param {Object} props - Component props
//  * @param {string} props.type - Organization type ('school' or 'compan')
//  * @param {Object} props.initialData - Initial email data
//  * @param {Function} props.onClose - Function to close the modal
//  * @param {Function} props.onSubmit - Function to handle form submission
//  * @returns {JSX.Element}
//  */
// const AccountSettingsModal = ({ type = 'school', initialData = {}, onClose, onSubmit }) => {
//   const { register, handleSubmit, watch, formState: { errors, isDirty, isValid } } = useForm({
//     resolver: zodResolver(passwordSchema),
//     defaultValues: {
//       email: initialData.email || '',
//       oldPassword: '',
//       newPassword: '',
//       confirmPassword: '',
//     },
//     mode: 'onChange'
//   });

//   // Password visibility states
//   const [showOldPassword, setShowOldPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   // Password validation states for visual feedback
//   const [validations, setValidations] = useState({
//     minLength: false,
//     hasNumber: false,
//     hasUpperCase: false,
//     hasSpecialChar: false,
//   });

//   // Watch new password for validation
//   const newPassword = watch('newPassword');
  
//   // Update validation states when password changes
//   useEffect(() => {
//     if (newPassword) {
//       setValidations({
//         minLength: newPassword.length >= 8,
//         hasNumber: /\d/.test(newPassword),
//         hasUpperCase: /[A-Z]/.test(newPassword),
//         hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
//       });
//     }
//   }, [newPassword]);

//   // Check if form is valid and changed to enable/disable submit button
//   const isFormChanged = isDirty && isValid;

//   // Handle form submission
//   const submitHandler = (data) => {
//     onSubmit(data);
//   };

//   // Toggle password visibility
//   const togglePasswordVisibility = (field) => {
//     switch (field) {
//       case 'old':
//         setShowOldPassword(!showOldPassword);
//         break;
//       case 'new':
//         setShowNewPassword(!showNewPassword);
//         break;
//       case 'confirm':
//         setShowConfirmPassword(!showConfirmPassword);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
//       <div className="p-6 relative">
//         {/* Close button */}
//         <button 
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
//           aria-label="Close"
//         >
//           <span className="material-icons">cancel</span>
//         </button>

//         <h2 className="text-xl font-bold text-primary mb-6">
//           Edit Pengaturan Akun
//         </h2>

//         <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
//           {/* Email field */}
//           <div className="space-y-1">
//             <label htmlFor="email" className="block text-sm text-zinc-500">
//               Email
//             </label>
//             <input
//               type="email"
//               id="email"
//               {...register('email')}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//             />
//             {errors.email && (
//               <p className="text-[#EE4266] text-xs mt-1">{errors.email.message}</p>
//             )}
//           </div>

//           {/* Old Password field */}
//           <div className="space-y-1">
//             <label htmlFor="oldPassword" className="block text-sm text-zinc-500">
//               Password Lama
//             </label>
//             <div className="relative">``
//               <input
//                 type={showOldPassword ? "text" : "password"}
//                 id="oldPassword"
//                 {...register('oldPassword')}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//               />
//               <button
//                 type="button"
//                 onClick={() => togglePasswordVisibility('old')}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
//               >
//                 <span className="material-icons text-zinc-400">
//                   {showOldPassword ? 'visibility' : 'visibility_off'}
//                 </span>
//               </button>
//             </div>
//             {errors.oldPassword && (
//               <p className="text-[#EE4266] text-xs mt-1">{errors.oldPassword.message}</p>
//             )}
//           </div>

//           {/* New Password field */}
//           <div className="space-y-1">
//             <label htmlFor="newPassword" className="block text-sm text-zinc-500">
//               Password Baru
//             </label>
//             <div className="relative">
//               <input
//                 type={showNewPassword ? "text" : "password"}
//                 id="newPassword"
//                 {...register('newPassword')}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//               />
//               <button
//                 type="button"
//                 onClick={() => togglePasswordVisibility('new')}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
//               >
//                 <span className="material-icons text-zinc-400">
//                   {showNewPassword ? 'visibility' : 'visibility_off'}
//                 </span>
//               </button>
//             </div>
//             {errors.newPassword && (
//               <p className="text-[#EE4266] text-xs mt-1">{errors.newPassword.message}</p>
//             )}
//           </div>

//           {/* Password validation requirements */}
//           <div className="space-y-2">
//             <p className="text-xs text-zinc-500">Password harus terdiri dari :</p>
//             <div className="grid grid-cols-2 gap-2">
//               <div className="flex items-center gap-1">
//                 <span className="material-icons text-xs" style={{ color: validations.minLength ? '#9BCA61' : '#EE4266' }}>
//                   {validations.minLength ? 'check' : 'close'}
//                 </span>
//                 <span className="text-xs text-zinc-500">Minimal 8 karakter</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="material-icons text-xs" style={{ color: validations.hasNumber ? '#9BCA61' : '#EE4266' }}>
//                   {validations.hasNumber ? 'check' : 'close'}
//                 </span>
//                 <span className="text-xs text-zinc-500">Minimal 1 angka</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="material-icons text-xs" style={{ color: validations.hasUpperCase ? '#9BCA61' : '#EE4266' }}>
//                   {validations.hasUpperCase ? 'check' : 'close'}
//                 </span>
//                 <span className="text-xs text-zinc-500">Minimal 1 huruf kapital</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="material-icons text-xs" style={{ color: validations.hasSpecialChar ? '#9BCA61' : '#EE4266' }}>
//                   {validations.hasSpecialChar ? 'check' : 'close'}
//                 </span>
//                 <span className="text-xs text-zinc-500">Minimal 1 karakter khusus</span>
//               </div>
//             </div>
//           </div>

//           {/* Confirm Password field */}
//           <div className="space-y-1">
//             <label htmlFor="confirmPassword" className="block text-sm text-zinc-500">
//               Konfirmasi Password Baru
//             </label>
//             <div className="relative">
//               <input
//                 type={showConfirmPassword ? "text" : "password"}
//                 id="confirmPassword"
//                 {...register('confirmPassword')}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//               />
//               <button
//                 type="button"
//                 onClick={() => togglePasswordVisibility('confirm')}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
//               >
//                 <span className="material-icons text-zinc-400">
//                   {showConfirmPassword ? 'visibility' : 'visibility_off'}
//                 </span>
//               </button>
//             </div>
//             {errors.confirmPassword && (
//               <p className="text-[#EE4266] text-xs mt-1">{errors.confirmPassword.message}</p>
//             )}
//           </div>

//           {/* Action button */}
//           <div className="pt-2">
//             <button
//               type="submit"
//               disabled={!isFormChanged}
//               className={`w-full py-2 rounded-md text-white font-medium transition-colors ${
//                 isFormChanged ? 'bg-primary hover:bg-primary-variant1' : 'bg-[#D9D9D9] cursor-not-allowed'
//               }`}
//             >
//               Simpan
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AccountSettingsModal;