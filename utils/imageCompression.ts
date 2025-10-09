// Image compression utility using Web Worker for non-blocking compression
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_MAX_DIMENSION_PX,
  IMAGE_COMPRESSION_QUALITY,
} from '@/constants';

interface CompressionResult {
  success: boolean;
  compressedFile?: File;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: string;
  error?: string;
}

/**
 * Compress image using Web Worker to prevent UI blocking
 * Falls back to main thread compression if Web Worker is not available
 */
export async function compressImageAsync(file: File): Promise<File> {
  // Skip compression for small files or unsupported types
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type) || file.size < 100 * 1024) {
    return file;
  }

  // Try Web Worker compression first (non-blocking)
  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    try {
      return await compressWithWorker(file);
    } catch (error) {
      console.warn('Web Worker compression failed, falling back to main thread:', error);
      // Fall through to main thread compression
    }
  }

  // Fallback to main thread compression
  return compressOnMainThread(file);
}

/**
 * Compress image using Web Worker (non-blocking, preferred method)
 */
async function compressWithWorker(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./workers/imageCompressor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Compression timeout'));
    }, 30000); // 30 second timeout

    worker.onmessage = (e: MessageEvent<CompressionResult>) => {
      clearTimeout(timeout);
      worker.terminate();

      if (e.data.success && e.data.compressedFile) {
        console.log(
          `[ImageCompression] Compressed ${file.name}: ${e.data.originalSize} → ${e.data.compressedSize} bytes (${e.data.compressionRatio}% reduction)`
        );
        resolve(e.data.compressedFile);
      } else {
        reject(new Error(e.data.error || 'Compression failed'));
      }
    };

    worker.onerror = (error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(error);
    };

    worker.postMessage({
      file,
      quality: IMAGE_COMPRESSION_QUALITY,
      maxWidth: IMAGE_MAX_DIMENSION_PX,
      maxHeight: IMAGE_MAX_DIMENSION_PX,
    });
  });
}

/**
 * Compress image on main thread (blocking, fallback method)
 * This is the original implementation, kept as fallback
 */
async function compressOnMainThread(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      try {
        let { width, height } = img;
        const aspectRatio = width / height;

        // Calculate new dimensions
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
          URL.revokeObjectURL(img.src);
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputMimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);

            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: outputMimeType,
                lastModified: Date.now(),
              });
              console.log(
                `[ImageCompression] Main thread: ${file.size} → ${compressedFile.size} bytes`
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          outputMimeType,
          IMAGE_COMPRESSION_QUALITY
        );
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(error);
      }
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      console.error('Image loading error for compression:', error);
      resolve(file);
    };
  });
}

/**
 * Get compression progress for UI feedback
 * Note: Web Worker doesn't support progress updates yet, but this interface
 * is here for future enhancement
 */
export interface CompressionProgress {
  percent: number;
  stage: 'loading' | 'resizing' | 'compressing' | 'complete';
}

// Export legacy function name for backward compatibility
export const compressImage = compressImageAsync;
