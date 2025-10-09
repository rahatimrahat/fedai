// Image compression worker to prevent UI blocking
// Runs compression in a separate thread for better performance

interface CompressionMessage {
  file: File;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

self.onmessage = async (e: MessageEvent<CompressionMessage>) => {
  try {
    const { file, quality, maxWidth = 1920, maxHeight = 1920 } = e.data;

    // Create bitmap from file
    const bitmap = await createImageBitmap(file);

    // Calculate new dimensions while maintaining aspect ratio
    let width = bitmap.width;
    let height = bitmap.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    // Create offscreen canvas for compression
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw image to canvas
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Convert to blob with compression
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality,
    });

    // Create compressed file
    const compressedFile = new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // Send result back to main thread
    self.postMessage({
      success: true,
      compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1),
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compression error',
    });
  }
};
