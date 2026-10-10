import { put } from '@vercel/blob/client';

/** What `startUpload` hands the browser; mirrors UploadTarget in lib/storage. */
export interface BrowserUploadTarget {
  key: string;
  url: string;
  headers: Record<string, string>;
  blobToken?: string;
}

/**
 * Send a file straight from the browser to storage, never through our
 * functions. Vercel Blob targets go through the Blob SDK with the one-path
 * token; every other driver is a plain signed PUT.
 */
export async function uploadFile(
  target: BrowserUploadTarget,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (target.blobToken) {
    await put(target.key, file, {
      access: 'public',
      token: target.blobToken,
      contentType: file.type,
      onUploadProgress: (event) => onProgress?.(event.percentage),
    });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', target.url);
    Object.entries(target.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress?.((event.loaded / event.total) * 100);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}
