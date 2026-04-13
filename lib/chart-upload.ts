export type ChartUploadErrorType =
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'CORRUPTED_FILE'
  | 'READ_ERROR'
  | 'EMPTY_IMAGE';

export interface ChartUploadError extends Error {
  type: ChartUploadErrorType;
}

export interface PreparedChartUpload {
  file: File;
  previewUrl: string;
  usedRecovery: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_CHART_UPLOAD_BYTES = 5 * 1024 * 1024;

const MIN_IMAGE_EDGE_PX = 40;
const MIN_VARIANCE_THRESHOLD = 8;

const createChartUploadError = (type: ChartUploadErrorType, message = getChartUploadErrorMessage(type)): ChartUploadError => {
  const error = new Error(message) as ChartUploadError;
  error.type = type;
  return error;
};

export const getChartUploadErrorMessage = (type: ChartUploadErrorType) => {
  switch (type) {
    case 'INVALID_TYPE':
      return 'That file type isn’t supported. Please upload a PNG or JPG screenshot.';
    case 'FILE_TOO_LARGE':
      return 'File is too large. Please upload an image under 5MB.';
    case 'CORRUPTED_FILE':
      return 'We couldn’t process that image. Try taking a fresh screenshot.';
    case 'READ_ERROR':
      return 'There was an issue reading the file. Please try again.';
    case 'EMPTY_IMAGE':
      return 'The image appears blank or unclear. Please upload a clearer chart.';
    default:
      return 'Please upload a clear chart screenshot (PNG or JPG under 5MB).';
  }
};

export const validateChartUploadFile = (file: File): ChartUploadErrorType | null => {
  if (!file.type.includes('image/') || !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return 'INVALID_TYPE';
  }

  if (file.size <= 0) {
    return 'EMPTY_IMAGE';
  }

  if (file.size > MAX_CHART_UPLOAD_BYTES) {
    return 'FILE_TOO_LARGE';
  }

  return null;
};

export const classifyChartUploadError = (error: unknown): ChartUploadErrorType => {
  if (error && typeof error === 'object' && 'type' in error) {
    const type = (error as { type?: unknown }).type;
    if (typeof type === 'string') {
      return type as ChartUploadErrorType;
    }
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();
  if (message.includes('type')) return 'INVALID_TYPE';
  if (message.includes('large') || message.includes('size')) return 'FILE_TOO_LARGE';
  if (message.includes('blank') || message.includes('empty') || message.includes('unclear')) return 'EMPTY_IMAGE';
  if (message.includes('corrupt')) return 'CORRUPTED_FILE';
  return 'READ_ERROR';
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(createChartUploadError('READ_ERROR'));
      };
      reader.onerror = () => reject(createChartUploadError('READ_ERROR'));
      reader.readAsDataURL(file);
    } catch {
      reject(createChartUploadError('READ_ERROR'));
    }
  });

const loadImageFromDataUrl = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(createChartUploadError('CORRUPTED_FILE'));
    image.src = dataUrl;
  });

const isImageBlankOrUnclear = (image: HTMLImageElement) => {
  if (image.naturalWidth < MIN_IMAGE_EDGE_PX || image.naturalHeight < MIN_IMAGE_EDGE_PX) {
    return true;
  }

  const sampleCanvas = document.createElement('canvas');
  const sampleWidth = Math.min(48, image.naturalWidth);
  const sampleHeight = Math.min(48, image.naturalHeight);
  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;

  const context = sampleCanvas.getContext('2d');
  if (!context) {
    return false;
  }

  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;

  let minLuma = 255;
  let maxLuma = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const luma = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
    minLuma = Math.min(minLuma, luma);
    maxLuma = Math.max(maxLuma, luma);
  }

  return maxLuma - minLuma < MIN_VARIANCE_THRESHOLD;
};

export const recoverChartUploadFile = async (file: File) => {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, image.naturalWidth);
  canvas.height = Math.max(1, image.naturalHeight);

  const context = canvas.getContext('2d');
  if (!context) {
    throw createChartUploadError('READ_ERROR');
  }

  context.drawImage(image, 0, 0);

  const recoveredBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });

  if (!recoveredBlob || recoveredBlob.size === 0) {
    throw createChartUploadError('CORRUPTED_FILE');
  }

  return new File([recoveredBlob], file.name.replace(/\.[^.]+$/, '') + '.png', {
    type: 'image/png',
    lastModified: Date.now(),
  });
};

const inspectPreparedFile = async (file: File, usedRecovery: boolean): Promise<PreparedChartUpload> => {
  const previewUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(previewUrl);

  if (isImageBlankOrUnclear(image)) {
    throw createChartUploadError('EMPTY_IMAGE');
  }

  return {
    file,
    previewUrl,
    usedRecovery,
  };
};

export const prepareChartUploadFile = async (file: File): Promise<PreparedChartUpload> => {
  const validationError = validateChartUploadFile(file);
  if (validationError) {
    throw createChartUploadError(validationError);
  }

  try {
    return await inspectPreparedFile(file, false);
  } catch (error) {
    const classified = classifyChartUploadError(error);
    if (classified === 'INVALID_TYPE' || classified === 'FILE_TOO_LARGE' || classified === 'EMPTY_IMAGE') {
      throw createChartUploadError(classified);
    }

    const recoveredFile = await recoverChartUploadFile(file);
    const recoveredValidationError = validateChartUploadFile(recoveredFile);
    if (recoveredValidationError) {
      throw createChartUploadError(recoveredValidationError);
    }

    return inspectPreparedFile(recoveredFile, true);
  }
};

export const fileToDataUrlWithFallback = async (file: File) => {
  const prepared = await prepareChartUploadFile(file);
  return {
    file: prepared.file,
    dataUrl: prepared.previewUrl,
    usedRecovery: prepared.usedRecovery,
  };
};