import { asFormDataFile, expoFetchAcceptsFormDataPart } from '../../lib/formDataFile';

describe('asFormDataFile', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('keeps Blob/File parts that Expo fetch already accepts', async () => {
    const blob = new Blob(['avatar-bytes'], { type: 'image/jpeg' });
    await expect(asFormDataFile(blob)).resolves.toBe(blob);
    expect(expoFetchAcceptsFormDataPart(blob)).toBe(true);
  });

  it('converts React Native {uri,name,type} parts into a Blob Expo fetch can upload', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    global.fetch = jest.fn(async () => ({
      ok: true,
      blob: async () => new Blob([bytes], { type: 'image/png' }),
    }));

    const rnPart = {
      uri: 'file:///tmp/avatar.png',
      name: 'avatar.png',
      type: 'image/png',
    };
    expect(expoFetchAcceptsFormDataPart(rnPart)).toBe(false);

    const file = await asFormDataFile(rnPart);

    expect(global.fetch).toHaveBeenCalledWith('file:///tmp/avatar.png');
    expect(file).toBeInstanceOf(Blob);
    expect(file.name).toBe('avatar.png');
    expect(file.type).toBe('image/png');
    expect(expoFetchAcceptsFormDataPart(file)).toBe(true);
  });

  it('falls back to expo-file-system File when fetch cannot read a local uri', async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    });
    jest.resetModules();
    jest.doMock('expo-file-system', () => {
      class File {
        constructor(uri) {
          this.uri = uri;
          this.name = 'banner.jpg';
          this.type = 'image/jpeg';
        }
        bytes() {
          return Uint8Array.from([1, 2, 3]);
        }
      }
      return { File };
    });
    const { asFormDataFile: reloadAsFormDataFile, expoFetchAcceptsFormDataPart: accepts } = require('../../lib/formDataFile');
    const file = await reloadAsFormDataFile({
      uri: 'file:///tmp/banner.jpg',
      name: 'banner.jpg',
      type: 'image/jpeg',
    });
    expect(file.name).toBe('banner.jpg');
    expect(accepts(file)).toBe(true);
  });

  it('rejects empty file input before upload', async () => {
    await expect(asFormDataFile(null)).rejects.toThrow(/No file selected/);
  });
});
