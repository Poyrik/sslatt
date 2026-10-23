import crypto from 'crypto';
import fs from 'fs';
import isEmpty from 'lodash/isEmpty';
import os from 'os';
import path from 'path';

import type { MediaDataType } from '@/components/types.generated';

import { getBackendHost } from '../utils/api.utils';

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024;

// Only image uploads are accepted here; the extension is derived from the
// validated MIME type, never from the client supplied file name.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

/**
 * Writes an uploaded file to a private temp directory under a random name.
 * The client supplied name is ignored entirely, so it can not be used for
 * path traversal (`../`) or to plant files with chosen names/extensions.
 */
export const saveFileToLocal = async (
  file: File | Blob,
): Promise<string | undefined> => {
  if (!file || typeof file === 'string') {
    return undefined;
  }

  const ext = ALLOWED_IMAGE_TYPES[(file.type || '').toLowerCase()];
  if (!ext) {
    throw new Error('Unsupported file type, please upload a PNG, JPG, GIF or WebP image');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File is too large');
  }

  const ab = await file.arrayBuffer();
  const bf = Buffer.from(ab);

  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upload-'));
  const filePath = path.join(dir, `${crypto.randomUUID()}${ext}`);
  await fs.promises.writeFile(filePath, bf, { mode: 0o600 });
  return filePath;
};

/** Best-effort removal of a temp upload and its private directory. */
export const removeLocalFile = async (filePath?: string) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
    await fs.promises.rmdir(path.dirname(filePath));
  } catch {
    // already gone
  }
};

interface UploadFilesApiRest {
  authorization: string;
  files: string[];
}

export const uploadFilesApiRest = async ({
  authorization,
  files = [],
}: UploadFilesApiRest): Promise<MediaDataType[]> => {
  const apiServer = `${getBackendHost()}/upload`;

  try {
    const form = new FormData();
    await Promise.all(
      files.map(async (filePath) => {
        const buffer = await fs.promises.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const type =
          Object.keys(ALLOWED_IMAGE_TYPES).find(
            (mime) => ALLOWED_IMAGE_TYPES[mime] === ext,
          ) || 'application/octet-stream';
        form.append(
          'files',
          new Blob([buffer], { type }),
          path.basename(filePath),
        );
      }),
    );

    // fetch sets the multipart boundary header itself
    const resp = await fetch(apiServer, {
      method: 'POST',
      headers: { authorization: `Bearer ${authorization}` },
      body: form,
    });

    const data: MediaDataType[] = await resp.json();
    if (isEmpty(data)) {
      throw new Error('error uploading image data, please try again later');
    }
    return data;
  } finally {
    // temp files are never kept once the upload has finished or failed
    await Promise.all(files.map((filePath) => removeLocalFile(filePath)));
  }
};
