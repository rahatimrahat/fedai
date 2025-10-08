
import React, { useRef, useState } from 'react';
import { type ImageFile } from '@/types';
import { UploadIcon, CameraIcon, XCircleIcon, InformationCircleIcon, ChevronDownIcon } from '@/components/icons';
import { useLocalizationContext } from './LocalizationContext.tsx';
import PhotoGuidelines from './PhotoGuidelines.tsx'; // Import the new component
import {
    MAX_IMAGE_FILE_SIZE_BYTES,
    ALLOWED_IMAGE_MIME_TYPES,
    IMAGE_MAX_DIMENSION_PX,
    IMAGE_COMPRESSION_QUALITY,
    MAX_IMAGE_FILE_SIZE_MB
} from '@/constants';
import { useAnalysisContext } from './AnalysisContext.multi-provider';


async function compressImage(file: File): Promise<File> {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type) || file.size < 100 * 1024) { 
      return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > IMAGE_MAX_DIMENSION_PX || height > IMAGE_MAX_DIMENSION_PX) {
        if (width > height) {
          width = IMAGE_MAX_DIMENSION_PX;
          height = IMAGE_MAX_DIMENSION_PX / aspectRatio;
        } else {
          height = IMAGE_MAX_DIMENSION_PX;
          width = IMAGE_MAX_DIMENSION_PX * aspectRatio;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // console.error('Failed to get canvas context'); // Removed for less console noise
        return resolve(file); 
      }
      ctx.drawImage(img, 0, 0, width, height);

      const outputMimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: outputMimeType,
              lastModified: Date.now(),
            });
            // console.log(`Compressed ${file.name} from ${file.size} to ${compressedFile.size} bytes, type: ${outputMimeType}`); // Removed for less console noise
            resolve(compressedFile);
          } else {
            // console.error('Canvas toBlob failed, returning original file.'); // Removed for less console noise
            resolve(file); 
          }
        },
        outputMimeType,
        IMAGE_COMPRESSION_QUALITY
      );
      URL.revokeObjectURL(img.src); 
    };
    img.onerror = (error) => {
      console.error('Image loading error for compression:', error);
      URL.revokeObjectURL(img.src); 
      resolve(file); 
    };
  });
}


const ImageInput: React.FC = () => {
  const { uiStrings } = useLocalizationContext();
  const { imageFile, handleImageSelected, handleImageCleared } = useAnalysisContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file = event.target.files?.[0];
    if (file) {
      const compressedFile = await compressImage(file);
      processFile(compressedFile); 
    }
    event.target.value = ''; // Reset file input
  };
  
  const handleDragEvent = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragging(true);
    } else if (e.type === 'dragleave' || e.type === 'drop') {
        setIsDragging(false);
        if (e.type === 'drop') {
            const files = e.dataTransfer.files;
            if (files && files[0]) {
                const mockEvent = { target: { files: files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileChange(mockEvent);
            }
        }
    }
  };


  const processFile = (file: File) => {
    setError(null);
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      setError(uiStrings.maxFileSizeError(MAX_IMAGE_FILE_SIZE_MB.toString()));
      return;
    }

    const isAllowedType = ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
    const isJfifSpecialCase = file.type === 'image/jpeg' && file.name.toLowerCase().endsWith('.jfif');

    if (!isAllowedType && !isJfifSpecialCase) {
        setError(uiStrings.fileTypeNotAllowedError(ALLOWED_IMAGE_MIME_TYPES.join(', ')));
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; 
      
      handleImageSelected({ // Call context action
        base64: base64Data,
        mimeType: file.type, 
        name: file.name,
        previewUrl: URL.createObjectURL(file), 
      });
    };
    reader.onerror = () => {
      setError(uiStrings.apiError); // Generic error
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerCameraCapture = () => cameraInputRef.current?.click();

  const onClearImageInternal = () => {
    setError(null);
    handleImageCleared(); // Call context action
  };

  const toggleGuidelines = () => setShowGuidelines(prev => !prev);

  const buttonBaseStyle = "flex flex-col items-center justify-center w-full px-4 py-8 text-base font-medium border-2 border-dashed rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-98 min-h-[160px] sm:min-h-[180px]";
  const buttonTextStyle = "text-[var(--primary-500)] group-hover:text-[var(--primary-900)]";


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between -mb-2">
        {/* This is where the "Upload Image" title is in App.tsx, so the button goes here conceptually */}
        <button
            type="button"
            onClick={toggleGuidelines}
            className="flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-teal)] p-1 rounded-md hover:bg-[var(--glass-bg-secondary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
            aria-expanded={showGuidelines}
            aria-controls="photo-guidelines-content"
        >
            <InformationCircleIcon className="w-5 h-5" aria-hidden="true" />
            <span className="ml-1.5 text-xs font-medium">{showGuidelines ? uiStrings.hidePhotoGuidelines : uiStrings.showPhotoGuidelines}</span>
            <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform duration-200 ${showGuidelines ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <PhotoGuidelines isVisible={showGuidelines} />

      <div 
        className={`p-1 rounded-xl transition-all duration-300 ease-out
                    border-2 border-dashed 
                    ${isDragging ? 'border-[var(--primary-500)] bg-glass' : 'border-transparent hover:border-[var(--primary-100)]'}`}
        onDragEnter={handleDragEvent}
        onDragLeave={handleDragEvent}
        onDragOver={handleDragEvent}
        onDrop={handleDragEvent}
      >
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg 
                        ${isDragging ? '' : 'bg-[var(--glass-bg-secondary)] border border-[var(--glass-border)] shadow-sm'}`}>
          <button
            type="button"
            onClick={triggerFileUpload}
            className={`${buttonBaseStyle} ${isDragging ? 'border-transparent' : 'border-[var(--primary-100)] hover:border-[var(--primary-500)]'} group bg-transparent`}
            aria-label={uiStrings.uploadImage}
          >
            <UploadIcon className={`w-10 h-10 my-2 ${buttonTextStyle} opacity-70`} />
            <span className={buttonTextStyle}>{uiStrings.uploadImage}</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_IMAGE_MIME_TYPES.join(',') + ',.jfif'} className="hidden" />

          <button
            type="button"
            onClick={triggerCameraCapture}
            className={`${buttonBaseStyle} ${isDragging ? 'border-transparent' : 'border-[var(--primary-100)] hover:border-[var(--primary-500)]'} group bg-transparent`}
            aria-label={uiStrings.captureImage}
          >
            <CameraIcon className={`w-10 h-10 my-2 ${buttonTextStyle} opacity-70`} />
            <span className={buttonTextStyle}>{uiStrings.captureImage}</span>
          </button>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
        </div>
      </div>


      {error && <p className="text-sm text-[var(--status-red-text)] font-medium p-2 bg-[var(--status-red-bg)] rounded-md">{error}</p>}

      {imageFile?.previewUrl && (
        <div className="mt-6 p-4 bg-glass rounded-lg">
          <h3 className="text-base font-semibold text-[var(--text-secondary)] mb-3">{uiStrings.imagePreview}</h3>
          <div className="relative group">
            <img 
              src={imageFile.previewUrl} 
              alt={uiStrings.imagePreview} 
              className="w-full max-h-96 object-contain rounded-md border border-[var(--glass-border)]"
              loading="lazy" 
            />
            <button
              type="button"
              onClick={onClearImageInternal}
              className="absolute top-2.5 right-2.5 p-1.5 bg-[var(--primary-900)] bg-opacity-60 text-white rounded-full hover:bg-[var(--status-red)] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent focus:ring-[var(--status-red)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title={uiStrings.clearImage}
              aria-label={uiStrings.clearImage}
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageInput;
