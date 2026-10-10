import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, stat, unlink, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { del as blobDelete, head as blobHead } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';

import { env } from '@/lib/env';

/**
 * File storage for notes and papers.
 *
 * Uploads go straight from the browser to storage with a short-lived signed
 * URL, so large PDFs never pass through a serverless function (Vercel caps
 * request bodies at 4.5 MB).
 *
 * - `local` (default, development): files land in LOCAL_UPLOAD_DIR and are
 *   served by /api/files. The signed URL is our own PUT route.
 * - `s3`: any S3-compatible bucket (Cloudflare R2 in the launch plan). Files
 *   are served from S3_PUBLIC_URL.
 * - `blob`: Vercel Blob. The browser uploads with a short-lived client token
 *   limited to one path, type and size; files are served from the store's
 *   public URL. Needs BLOB_READ_WRITE_TOKEN, which Vercel adds when a Blob
 *   store is connected to the project.
 */

export const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} as const;
export type AllowedType = keyof typeof ALLOWED_TYPES;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export interface UploadTarget {
  key: string;
  url: string;
  headers: Record<string, string>;
  /** Set for the `blob` driver: the browser uploads with this token instead of `url`. */
  blobToken?: string;
}

function blobToken(): string {
  if (!env.BLOB_READ_WRITE_TOKEN) throw new Error('STORAGE_DRIVER=blob needs BLOB_READ_WRITE_TOKEN');
  return env.BLOB_READ_WRITE_TOKEN;
}

/** Public base URL of the Blob store, from the store id inside the token. */
function blobBaseUrl(): string {
  const storeId = blobToken().split('_')[3] ?? '';
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}

let s3: S3Client | null = null;
function client(): S3Client {
  if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error('STORAGE_DRIVER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY');
  }
  s3 ??= new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
  return s3;
}

function localRoot(): string {
  return path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
}

/** Resolve a key inside the upload root, refusing anything that escapes it. */
function localPath(key: string): string {
  const root = localRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('Invalid storage key');
  return full;
}

/** HMAC over key + expiry, so only the URL we handed out can PUT to the local route. */
function sign(key: string, expires: number, contentType: string): string {
  return createHmac('sha256', env.AUTH_SECRET).update(`${key}:${expires}:${contentType}`).digest('base64url');
}

export function verifyLocalUpload(key: string, expires: number, contentType: string, signature: string): boolean {
  if (Date.now() > expires) return false;
  const expected = Buffer.from(sign(key, expires, contentType));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function newKey(userId: string, type: AllowedType): string {
  return `resources/${userId}/${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${ALLOWED_TYPES[type]}`;
}

/** A signed URL the browser PUTs the file to. Valid for ten minutes. */
export async function createUploadTarget(key: string, contentType: AllowedType, size: number): Promise<UploadTarget> {
  if (env.STORAGE_DRIVER === 'blob') {
    const token = await generateClientTokenFromReadWriteToken({
      token: blobToken(),
      pathname: key,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: Math.min(size, MAX_UPLOAD_BYTES),
      validUntil: Date.now() + 600_000,
      addRandomSuffix: false,
    });
    return { key, url: '', headers: {}, blobToken: token };
  }
  if (env.STORAGE_DRIVER === 's3') {
    const url = await getSignedUrl(
      client(),
      new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: contentType, ContentLength: size }),
      { expiresIn: 600 },
    );
    return { key, url, headers: { 'content-type': contentType } };
  }
  const expires = Date.now() + 600_000;
  const query = new URLSearchParams({ expires: String(expires), signature: sign(key, expires, contentType) });
  return { key, url: `/api/uploads/${key}?${query}`, headers: { 'content-type': contentType } };
}

/** Where a stored file can be opened. */
export function publicUrl(key: string): string {
  if (env.STORAGE_DRIVER === 'blob') return `${blobBaseUrl()}/${key}`;
  if (env.STORAGE_DRIVER === 's3') return `${(env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')}/${key}`;
  return `/api/files/${key}`;
}

/** Size in bytes of a stored file, or null if it is not there. */
export async function storedSize(key: string): Promise<number | null> {
  try {
    if (env.STORAGE_DRIVER === 'blob') return (await blobHead(key, { token: blobToken() })).size;
    if (env.STORAGE_DRIVER === 's3') {
      const head = await client().send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      return head.ContentLength ?? null;
    }
    return (await stat(localPath(key))).size;
  } catch {
    return null;
  }
}

export async function writeLocal(key: string, body: Buffer): Promise<void> {
  const full = localPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
}

export async function readLocal(key: string): Promise<Buffer | null> {
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteStored(key: string): Promise<void> {
  try {
    if (env.STORAGE_DRIVER === 'blob') await blobDelete(key, { token: blobToken() });
    else if (env.STORAGE_DRIVER === 's3') await client().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    else await unlink(localPath(key));
  } catch {
    // Already gone: nothing to do.
  }
}
