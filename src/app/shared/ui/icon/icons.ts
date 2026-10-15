/**
 * Tracés des icônes (grille 24 × 24, trait), repris de la maquette. Embarqués dans le bundle
 * plutôt que servis en sprite : aucun aller-retour réseau supplémentaire en 3G.
 */
export const ICONS = {
  home: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22v-10h6v10'],
  clock: ['M12 7v5l3.5 2', 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z'],
  'clipboard-check': [
    'M9 11l2.5 2.5L16 9',
    'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  ],
  'file-text': ['M9 13h6M9 17h4', 'M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z'],
  book: [
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
    'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  ],
  calendar: [
    'M8 2v4M16 2v4M3 10h18',
    'M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  ],
  award: ['M12 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z', 'm8.5 14-1.5 7 5-3 5 3-1.5-7'],
  shield: ['M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z', 'm9 12 2 2 4-4'],
  wallet: [
    'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
    'M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  ],
  dollar: ['M12 2v20', 'M17 6.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  mail: ['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'm3 8 9 6 9-6'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
  swap: ['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'alert-circle': ['M12 8v5M12 16.5v.01', 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z'],
  'arrow-left': ['m12 19-7-7 7-7', 'M19 12H5'],
  info: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 16v-4', 'M12 8h.01'],
  'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  image: [
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M8.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
    'm21 15-5-5L5 21',
  ],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;
