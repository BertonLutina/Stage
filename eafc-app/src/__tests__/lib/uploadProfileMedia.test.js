import { isDeviceLocalUri, isPersistableMediaUrl } from '../../lib/mediaUrls';
import { fileFromUri, hostedMediaUrl, uploadLocalMedia } from '../../lib/uploadProfileMedia';

describe('profile media upload', () => {
  it('treats phone file URIs as local and hosted uploads as persistable', () => {
    expect(isDeviceLocalUri('file:///var/mobile/Containers/Data/photo.jpg')).toBe(true);
    expect(isDeviceLocalUri('ph://id')).toBe(true);
    expect(isPersistableMediaUrl('https://stageleagues.com/uploads/a.jpg')).toBe(true);
    expect(isPersistableMediaUrl('file:///tmp/a.jpg')).toBe(false);
  });

  it('builds a jpeg FormData file from a local uri', () => {
    expect(fileFromUri('file:///tmp/avatar.png')).toEqual({
      uri: 'file:///tmp/avatar.png',
      name: 'avatar.png',
      type: 'image/png',
    });
  });

  it('uploads local images and never returns the device path', async () => {
    const client = {
      integrations: {
        Core: {
          UploadFile: jest.fn(async () => ({ file_url: 'https://stageleagues.com/uploads/hosted.jpg' })),
        },
      },
    };
    const url = await uploadLocalMedia('file:///tmp/photo.jpg', { client, fallbackName: 'avatar.jpg' });
    expect(url).toBe('https://stageleagues.com/uploads/hosted.jpg');
    expect(client.integrations.Core.UploadFile).toHaveBeenCalled();
  });

  it('keeps already-hosted OAuth avatars without re-uploading', async () => {
    const client = {
      integrations: { Core: { UploadFile: jest.fn() } },
    };
    const google = 'https://lh3.googleusercontent.com/a/photo';
    await expect(hostedMediaUrl(google, { client })).resolves.toBe(google);
    expect(client.integrations.Core.UploadFile).not.toHaveBeenCalled();
  });
});
