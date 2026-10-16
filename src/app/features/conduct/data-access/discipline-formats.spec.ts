import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  REPEATED_LATENESS,
  TALKING,
  UNJUSTIFIED_ABSENCE,
  disciplineFixture,
} from '../../../../testing/discipline.fixture';
import { TERM } from '../../../../testing/grades-terms.fixture';
import {
  caseMeta,
  disciplineSummary,
  followUpLabel,
  linkedAttendanceLabel,
  revisedLabel,
  sanctionLabel,
  severityView,
  spokenCase,
} from './discipline-formats';

registerLocaleData(localeFr);

describe('discipline-formats', () => {
  it('nomme la gravité saisie par l’école, et reste neutre sur une inconnue', () => {
    expect(severityView('MINOR')).toMatchObject({ label: 'Mineur', tone: 'info' });
    expect(severityView('MAJOR')).toMatchObject({ label: 'Majeur', tone: 'pending' });
    expect(severityView('SERIOUS')).toMatchObject({ label: 'Grave', tone: 'alert' });
    expect(severityView('NOUVELLE')).toBeNull();
  });

  it('écrit le bilan du trimestre avec les comptes du serveur', () => {
    expect(disciplineSummary(disciplineFixture())).toBe(
      '2 faits mineurs · 1 fait majeur · aucun fait grave',
    );
    expect(disciplineSummary(disciplineFixture(TERM.second))).toBe(
      'aucun fait mineur · aucun fait majeur · aucun fait grave',
    );
  });

  it('dit la suite donnée, sans faire de la convocation une sanction', () => {
    expect(sanctionLabel('WRITTEN_WARNING')).toBe('Avertissement écrit');
    expect(sanctionLabel('PARENTS_SUMMONED')).toBeNull();
    expect(sanctionLabel('UNKNOWN')).toBeNull();
    expect(sanctionLabel(null)).toBeNull();
  });

  it('nomme la suite d’un jour d’absence', () => {
    const linked = (sanction: string) => ({ id: 'c1', sanction, periodId: null });

    expect(followUpLabel(linked('WRITTEN_WARNING'))).toBe('Suite : avertissement écrit');
    expect(followUpLabel(linked('PARENTS_SUMMONED'))).toBe('Suite : entretien demandé');
    expect(followUpLabel(linked('UNKNOWN'))).toBe('Suite : fait consigné');
  });

  it('date le fait et dit qui l’a consigné', () => {
    expect(caseMeta(UNJUSTIFIED_ABSENCE, 'fr')).toBe('Mercredi 16/09 · consigné par Paul Kalala');
    expect(caseMeta({ ...TALKING, recordedBy: null }, 'fr')).toBe('Vendredi 11/09');
    expect(revisedLabel(UNJUSTIFIED_ABSENCE, 'fr')).toBe('Mis à jour le 22/09');
    expect(revisedLabel(TALKING, 'fr')).toBeNull();
  });

  it('mène à l’absence, au retard ou au mois lié', () => {
    expect(linkedAttendanceLabel(UNJUSTIFIED_ABSENCE, 'fr')).toBe('Voir l’absence du 16 septembre');
    expect(linkedAttendanceLabel(REPEATED_LATENESS, 'fr')).toBe('Voir les retards de septembre');
    expect(
      linkedAttendanceLabel(
        {
          ...TALKING,
          category: 'LATENESS',
          linkedAttendance: { kind: 'DAY', date: '2026-09-18' },
        },
        'fr',
      ),
    ).toBe('Voir le retard du 18 septembre');
    expect(linkedAttendanceLabel(TALKING, 'fr')).toBeNull();
  });

  it('nomme la carte pour un lecteur d’écran', () => {
    expect(spokenCase(UNJUSTIFIED_ABSENCE, 'fr')).toBe(
      'Majeur, mercredi 16 septembre : Absence non justifiée. Suite donnée : avertissement écrit.',
    );
  });
});
