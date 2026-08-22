/**
 * Expo SDK 52+ `fetch` (winter) cannot serialize React Native FormData parts
 * of the shape `{ uri, name, type }`. It throws:
 *   "Unsupported FormDataPart implementation"
 *
 * That check is in expo/src/winter/fetch/convertFormData.ts — only strings,
 * Blob/File, or objects with `.bytes()` are accepted.
 */

function isBlobLike(value) {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

/** Mirrors Expo convertFormDataAsync's accepted FormData part types. */
export function expoFetchAcceptsFormDataPart(part) {
  if (typeof part === 'string') return true;
  if (isBlobLike(part)) return true;
  return Boolean(part && typeof part === 'object' && typeof part.bytes === 'function');
}

function wrapNamedBlob(blob, name, type) {
  const mime = type || blob.type || 'application/octet-stream';
  const typed = blob.type === mime
    ? blob
    : (typeof blob.slice === 'function' ? blob.slice(0, blob.size, mime) : blob);
  try {
    if (typed && typeof typed === 'object') typed.name = name;
  } catch {
    /* ignore read-only name */
  }
  return typed;
}

/**
 * Turn a picker asset / RN `{ uri, name, type }` part into a Blob/File that
 * Expo fetch can put on multipart/form-data.
 */
export async function asFormDataFile(file) {
  if (!file) throw new Error('No file selected.');
  if (typeof file === 'string') {
    return asFormDataFile({ uri: file, name: 'upload.bin' });
  }
  if (isBlobLike(file)) return file;

  const uri = file.uri;
  if (!uri) throw new Error('No file selected.');

  const name = file.name || file.fileName || 'upload.bin';
  const type = file.type || file.mimeType || '';

  try {
    const res = await fetch(uri);
    if (res.ok || res.status === 0) {
      const blob = await res.blob();
      if (blob) return wrapNamedBlob(blob, name, type || blob.type);
    }
  } catch {
    /* Expo fetch is HTTP-oriented; file:// / content:// may need the File API. */
  }

  try {
    const { File } = require('expo-file-system');
    const expoFile = new File(uri);
    if (expoFile && (typeof expoFile.bytes === 'function' || isBlobLike(expoFile))) {
      return expoFile;
    }
  } catch {
    /* Native FS is unavailable in some tests / runtimes. */
  }

  throw new Error('Could not read this file.');
}
