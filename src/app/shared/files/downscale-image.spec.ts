import { downscaleImage } from './downscale-image';

describe('downscaleImage', () => {
  it('laisse partir un PDF tel quel', async () => {
    const pdf = new File([new Uint8Array(2_000_000)], 'certificat.pdf', {
      type: 'application/pdf',
    });

    expect(await downscaleImage(pdf)).toBe(pdf);
  });

  it('laisse partir une photo déjà légère', async () => {
    const photo = new File([new Uint8Array(1_000)], 'photo.jpg', { type: 'image/jpeg' });

    expect(await downscaleImage(photo)).toBe(photo);
  });

  it('garde la photo quand le navigateur ne sait pas la décoder', async () => {
    const photo = new File([new Uint8Array(2_000_000)], 'photo.jpg', { type: 'image/jpeg' });
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('décodage impossible');
      }),
    );

    expect(await downscaleImage(photo)).toBe(photo);
    vi.unstubAllGlobals();
  });
});
