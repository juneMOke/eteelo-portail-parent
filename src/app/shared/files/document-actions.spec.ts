import { openInNewTab, shareOrDownload } from './document-actions';

describe('document-actions', () => {
  const file = new File(['%PDF'], 'RC-1042.pdf', { type: 'application/pdf' });
  const click = vi.fn();

  beforeEach(() => {
    click.mockClear();
    URL.createObjectURL = vi.fn(() => 'blob:document');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  function stubShare(share: () => Promise<void>): void {
    Object.assign(navigator, { canShare: () => true, share: vi.fn(share) });
  }

  it('partage le fichier quand le téléphone sait le faire', async () => {
    stubShare(async () => undefined);

    await expect(shareOrDownload(file)).resolves.toBe('shared');
    expect(navigator.share).toHaveBeenCalledWith({ files: [file], title: 'RC-1042.pdf' });
    expect(click).not.toHaveBeenCalled();
  });

  it('prend la fermeture de la feuille de partage pour un abandon, pas une erreur', async () => {
    stubShare(async () => {
      throw new DOMException('fermée', 'AbortError');
    });

    await expect(shareOrDownload(file)).resolves.toBe('cancelled');
  });

  it('télécharge le fichier quand le téléphone ne sait pas le partager', async () => {
    await expect(shareOrDownload(file)).resolves.toBe('downloaded');
    expect(click).toHaveBeenCalledOnce();
  });

  it('ouvre l’onglet au geste et y mène le document une fois chargé', async () => {
    const tab = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);

    await openInNewTab('Releve.pdf', async () => new Blob(['%PDF']));

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(tab.location.href).toBe('blob:document');
  });

  it('referme l’onglet si le document ne vient pas', async () => {
    const tab = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);

    await expect(
      openInNewTab('Releve.pdf', async () => {
        throw new Error('réseau');
      }),
    ).rejects.toThrow('réseau');
    expect(tab.close).toHaveBeenCalledOnce();
  });

  it('télécharge le document si le navigateur bloque l’onglet', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    await openInNewTab('Releve.pdf', async () => new Blob(['%PDF']));

    expect(click).toHaveBeenCalledOnce();
  });
});
