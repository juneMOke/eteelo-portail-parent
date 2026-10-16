import { fileRefusal, fileTypeOf, isPdf } from './file-type';

describe('file-type', () => {
  it('lit le type donné par le téléphone', () => {
    expect(fileTypeOf(new File([''], 'x', { type: 'IMAGE/PNG' }))).toBe('image/png');
  });

  it('le déduit de l’extension quand il manque', () => {
    expect(fileTypeOf(new File([''], 'certificat.JPG'))).toBe('image/jpeg');
    expect(isPdf(new File([''], 'copie.pdf'))).toBe(true);
    expect(fileTypeOf(new File([''], 'notes.txt'))).toBe('');
  });

  it('refuse une sélection hors format, trop nombreuse ou trop lourde', () => {
    const rules = { accept: ['application/pdf'], maxTotalBytes: 10, maxFiles: 2 };
    const pdf = (size: number) => new File([new Uint8Array(size)], 'a.pdf');

    expect(fileRefusal([pdf(4)], rules)).toBeNull();
    expect(fileRefusal([new File([''], 'a.png')], rules)).toBe('format');
    expect(fileRefusal([pdf(1), pdf(1), pdf(1)], rules)).toBe('count');
    expect(fileRefusal([pdf(6), pdf(6)], rules)).toBe('size');
  });
});
