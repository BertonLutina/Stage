import { stageClient } from '@/api/stageClient';
import { isDeviceLocalUri, isPersistableMediaUrl } from '@/lib/mediaUrls';

export function fileFromUri(uri, fallbackName = 'photo.jpg') {
  const raw = String(uri || '');
  const clean = raw.split('?')[0];
  const leaf = clean.split('/').pop() || fallbackName;
  const ext = (leaf.split('.').pop() || '').toLowerCase();
  const type = ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
      : ext === 'gif' ? 'image/gif'
        : 'image/jpeg';
  const name = leaf.includes('.') ? leaf : fallbackName;
  return { uri: raw, name, type };
}

export function fileFromPickerAsset(asset, fallbackName = 'photo.jpg') {
  if (!asset) return fileFromUri('', fallbackName);
  if (typeof asset === 'string') return fileFromUri(asset, fallbackName);
  const uri = asset.uri || '';
  const base = fileFromUri(uri, fallbackName);
  return {
    uri,
    name: asset.fileName || base.name,
    type: asset.mimeType === 'image/jpg' ? 'image/jpeg' : (asset.mimeType || base.type),
  };
}

export async function uploadLocalMedia(uriOrAsset, {
  client = stageClient,
  fallbackName = 'photo.jpg',
} = {}) {
  const file = typeof uriOrAsset === 'string'
    ? fileFromUri(uriOrAsset, fallbackName)
    : fileFromPickerAsset(uriOrAsset, fallbackName);
  if (!file.uri) throw new Error('No image selected.');
  const uploaded = await client.integrations.Core.UploadFile({ file });
  const url = uploaded?.file_url || uploaded?.url;
  if (!isPersistableMediaUrl(url)) {
    throw new Error('Upload failed. Try a smaller JPEG or PNG.');
  }
  return url;
}

/** Keep hosted URLs; upload anything that only exists on this device. */
export async function hostedMediaUrl(uriOrAsset, {
  client = stageClient,
  fallbackName = 'photo.jpg',
} = {}) {
  if (!uriOrAsset) return null;
  const uri = typeof uriOrAsset === 'string' ? uriOrAsset : uriOrAsset.uri;
  if (!uri) return null;
  if (isDeviceLocalUri(uri) || !isPersistableMediaUrl(uri)) {
    return uploadLocalMedia(uriOrAsset, { client, fallbackName });
  }
  return uri;
}
