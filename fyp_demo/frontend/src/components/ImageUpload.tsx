// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Image as ImageIcon, Upload, X } from 'lucide-react';

// interface ImageUploadProps {
//   label: string;
//   files: File[];
//   onFilesChange: (files: File[]) => void;
//   multiple?: boolean;
//   maxFiles?: number;
//   aspectRatio?: 'square' | 'cover' | 'portrait';
//   helperText?: string;
//   error?: string;
// }

// const ImageUpload: React.FC<ImageUploadProps> = ({
//   label,
//   files,
//   onFilesChange,
//   multiple = true,
//   maxFiles = 10,
//   helperText="Allowed upto 10 photos",
//   aspectRatio = 'square',
//   error,
// }) => {
//   const [previews, setPreviews] = useState<string[]>([]);

//   const aspectRatioClasses: Record<string, string> = {
//     square: 'aspect-square max-h-64',
//     cover: 'aspect-video max-h-64',
//     portrait: 'aspect-[3/4] max-h-64',
//   };

//   // Create/revoke object URLs for local file previews
//   useEffect(() => {
//     const urls = files.map((file) => URL.createObjectURL(file));
//     setPreviews(urls);

//     return () => {
//       urls.forEach((url) => URL.revokeObjectURL(url));
//     };
//   }, [files]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;

//     const incoming = Array.from(e.target.files);

//     let nextFiles = multiple ? [...files, ...incoming] : incoming.slice(0, 1);

//     if (maxFiles && nextFiles.length > maxFiles) {
//       nextFiles = nextFiles.slice(0, maxFiles);
//     }

//     onFilesChange(nextFiles);
//   };

//   const handleRemove = (index: number) => {
//     const nextFiles = files.filter((_, i) => i !== index);
//     onFilesChange(nextFiles);
//   };

//   const hasFiles = files.length > 0;

//   return (
//     <div className="space-y-3">
//       <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
//         <ImageIcon className="w-4 h-4" />
//         {label}
//       </label>

//       {/* Image Previews */}
//       {hasFiles && (
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//           {files.map((file, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               className="relative group"
//             >
//               <div
//                 className={`${aspectRatioClasses[aspectRatio]} rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 w-full`}
//               >
//                 {previews[index] && (
//                   <img
//                     src={previews[index]}
//                     alt={file.name}
//                     className="w-full h-full object-cover"
//                   />
//                 )}
//                 <button
//                   type="button"
//                   onClick={() => handleRemove(index)}
//                   className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//               <p className="mt-1 text-xs text-gray-600 line-clamp-1">{file.name}</p>
//             </motion.div>
//           ))}
//         </div>
//       )}

//       {/* File Input */}
//       <div className="space-y-2">
//         <label className="inline-flex items-center gap-2 text-sm text-pink-600 font-medium cursor-pointer">
//           <Upload className="w-4 h-4" />
//           <span>{multiple ? 'Select images from your device' : 'Select an image from your device'}</span>
//           <input
//             type="file"
//             accept="image/*"
//             multiple={multiple}
//             onChange={handleFileChange}
//             className="hidden"
//           />
//         </label>

//         {error && <p className="text-sm text-red-600">{error}</p>}
//         {helperText && !error && (
//           <p className="text-sm text-gray-500">{helperText}</p>
//         )}

//         {maxFiles && (
//           <p className="text-xs text-gray-400">
//             {files.length}/{maxFiles} selected
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ImageUpload;


//enhanced
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingUrls?: string[];    //converting to string if url exist for safety 
  onUrlRemove?: (url: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  aspectRatio?: 'square' | 'cover' | 'portrait';
  helperText?: string;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  files,
  onFilesChange,
  existingUrls = [],
  onUrlRemove,
  multiple = true,
  maxFiles = 10,
  helperText = "Allowed up to 10 photos",
  aspectRatio = 'square',
  error,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);

  const aspectRatioClasses: Record<string, string> = {
    square: 'aspect-square max-h-64',
    cover: 'aspect-video max-h-64',
    portrait: 'aspect-[3/4] max-h-64',
  };

  // Create/revoke object URLs for local file previews
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const incoming = Array.from(e.target.files);
    const totalCount = existingUrls.length + files.length + incoming.length;

    if (maxFiles && totalCount > maxFiles) {
      const available = maxFiles - existingUrls.length - files.length;
      if (available <= 0) {
        return; // No space left
      }
      incoming.splice(available);
    }

    let nextFiles = multiple ? [...files, ...incoming] : incoming.slice(0, 1);

    onFilesChange(nextFiles);
  };

  const handleRemoveFile = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    onFilesChange(nextFiles);
  };

  const handleRemoveUrl = (url: string) => {
    if (onUrlRemove) {
      onUrlRemove(url);
    }
  };

  const totalCount = existingUrls.length + files.length;
  const hasContent = totalCount > 0;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {label}
      </label>

      {/* Image Previews - Existing URLs + New Files */}
      {hasContent && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Existing URLs */}
          {existingUrls.map((url, index) => (
            <motion.div
              key={`url-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div
                className={`${aspectRatioClasses[aspectRatio]} rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 w-full`}
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  title="Remove this photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* New Files */}
          {files.map((file, index) => (
            <motion.div
              key={`file-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div
                className={`${aspectRatioClasses[aspectRatio]} rounded-xl overflow-hidden border-2 border-green-200 bg-gray-100 w-full`}
              >
                {previews[index] && (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  title="Remove this photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  NEW
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-600 line-clamp-1">{file.name}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* File Input */}
      <div className="space-y-2">
        <label className="inline-flex items-center gap-2 text-sm text-pink-600 font-medium cursor-pointer hover:text-pink-700 transition-colors">
          <Upload className="w-4 h-4" />
          <span>
            {multiple
              ? `${totalCount >= maxFiles ? 'Maximum reached' : 'Select images from your device'}`
              : 'Select an image from your device'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            disabled={maxFiles ? totalCount >= maxFiles : false}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}

        {maxFiles && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              {totalCount}/{maxFiles} photos
            </p>
            {totalCount >= maxFiles && (
              <p className="text-xs text-amber-600 font-medium">
                (Remove photos to add new ones)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;