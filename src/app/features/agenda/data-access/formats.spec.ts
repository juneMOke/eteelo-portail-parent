import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { countLabel, durationLabel, fileSizeLabel, fileTypeLabel, middleEllipsis } from './formats';

registerLocaleData(localeFr);

describe('formats', () => {
  it('écrit une durée en heures et minutes', () => {
    expect(durationLabel(45)).toBe('45 min');
    expect(durationLabel(120)).toBe('2 h');
    expect(durationLabel(90)).toBe('1 h 30');
    expect(durationLabel(65)).toBe('1 h 05');
    expect(durationLabel(null)).toBeNull();
    expect(durationLabel(0)).toBeNull();
  });

  it('écrit le poids en Mo ou en Ko, à la française', () => {
    expect(fileSizeLabel(1_258_291, 'fr')).toBe('1,3 Mo');
    expect(fileSizeLabel(2_000_000, 'fr')).toBe('2 Mo');
    expect(fileSizeLabel(850_400, 'fr')).toBe('850 Ko');
    expect(fileSizeLabel(120, 'fr')).toBe('1 Ko');
  });

  it('nomme le type de fichier', () => {
    expect(fileTypeLabel('application/pdf')).toBe('PDF');
    expect(fileTypeLabel('image/jpeg')).toBe('Photo');
    expect(fileTypeLabel('application/octet-stream')).toBe('Fichier');
  });

  it("coupe un nom long au milieu et garde l'extension", () => {
    const name = 'Corrige-Interrogation-de-Chimie-les-acides-et-les-bases-2026.pdf';
    const short = middleEllipsis(name);

    expect(short).toHaveLength(40);
    expect(short.endsWith('-2026.pdf')).toBe(true);
    expect(short).toContain('…');
    expect(middleEllipsis('CE-Chimie.pdf')).toBe('CE-Chimie.pdf');
  });

  it('accorde le nombre', () => {
    expect(countLabel(0, 'épreuve', 'épreuves', 'Aucune épreuve')).toBe('Aucune épreuve');
    expect(countLabel(1, 'épreuve', 'épreuves', 'Aucune épreuve')).toBe('1 épreuve');
    expect(countLabel(3, 'épreuve', 'épreuves', 'Aucune épreuve')).toBe('3 épreuves');
  });
});
