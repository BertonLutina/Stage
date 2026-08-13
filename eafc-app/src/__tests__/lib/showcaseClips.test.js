import {
  MAX_SHOWCASE_BYTES,
  isShowcaseVideoTypeAllowed,
  validateShowcaseDuration,
  validateShowcaseFileSize,
} from '../../lib/showcaseClips';

describe('showcase clip rules', () => {
  test('accepts mp4 and mov files', () => {
    expect(isShowcaseVideoTypeAllowed({ fileName: 'clip.mp4' })).toBe(true);
    expect(isShowcaseVideoTypeAllowed({ fileName: 'clip.MOV' })).toBe(true);
    expect(isShowcaseVideoTypeAllowed({ mimeType: 'video/webm' })).toBe(true);
  });

  test('rejects non-video files', () => {
    expect(isShowcaseVideoTypeAllowed({ fileName: 'photo.jpg', mimeType: 'image/jpeg' })).toBe(false);
  });

  test('rejects clips longer than 60 seconds', () => {
    expect(validateShowcaseDuration(60.01)).toEqual({
      ok: false,
      error: 'Showcase clips must be 60 seconds or shorter.',
    });
  });

  test('accepts a 60 second clip', () => {
    expect(validateShowcaseDuration(60)).toEqual({ ok: true, duration: 60 });
  });

  test('rejects clips larger than 20 MB', () => {
    expect(validateShowcaseFileSize(MAX_SHOWCASE_BYTES + 1)).toEqual({
      ok: false,
      error: 'Showcase clips must be 20 MB or smaller.',
    });
  });

  test('accepts a 20 MB clip', () => {
    expect(validateShowcaseFileSize(MAX_SHOWCASE_BYTES)).toEqual({ ok: true });
  });
});
