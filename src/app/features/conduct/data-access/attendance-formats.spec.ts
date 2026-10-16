import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { attendanceDay } from '../../../../testing/attendance.fixture';
import {
  deadlineLabel,
  justificationLabel,
  momentLabel,
  monthSummary,
  presenceDaysLabel,
  rateLabel,
  reasonLabel,
  recordedLabel,
} from './attendance-formats';

registerLocaleData(localeFr);

describe('attendance-formats', () => {
  const summary = {
    schoolDays: 61,
    presentDays: 58,
    lateDays: 7,
    justifiedAbsenceDays: 1,
    unjustifiedAbsenceDays: 2,
    presenceRate: 58 / 61,
  };

  it('écrit le taux une fois, et les jours qui le font', () => {
    expect(rateLabel(summary.presenceRate, 'fr')).toBe('95 %');
    expect(presenceDaysLabel(summary)).toBe('58 jours sur 61');
  });

  it('résume un mois', () => {
    expect(monthSummary({ month: '2026-09', calledDays: 21, absences: 1, lates: 2 })).toBe(
      '21 jours d’école · 1 absence · 2 retards',
    );
    expect(monthSummary({ month: '2026-09', calledDays: 1, absences: 0, lates: 0 })).toBe(
      '1 jour d’école · aucune absence · aucun retard',
    );
    expect(monthSummary(undefined)).toBe('Aucun jour d’école enregistré');
  });

  it('écrit le moment du jour', () => {
    expect(momentLabel(attendanceDay('2026-09-18', { status: 'LATE', arrivalTime: '07:52' }))).toBe(
      'Arrivé à 7 h 52',
    );
    expect(momentLabel(attendanceDay('2026-09-16', { status: 'ABSENT' }))).toBe('Journée');
  });

  it('dit qui a fait l’appel', () => {
    const day = attendanceDay('2026-09-16', { recordedAt: '2026-09-16T06:40:00Z' });

    expect(recordedLabel(day, 'fr')).toMatch(/^Enregistré par Jean Ilunga à \d+ h 40$/);
    expect(recordedLabel({ ...day, recordedBy: null, recordedAt: null }, 'fr')).toBeNull();
  });

  it('écrit le motif retenu par l’école, sans motif inventé', () => {
    expect(reasonLabel('SICKNESS', 'Certificat reçu le 10/09')).toBe(
      'Maladie — Certificat reçu le 10/09',
    );
    expect(reasonLabel('UNJUSTIFIED', null)).toBeNull();
    expect(reasonLabel(null, 'Prévenu par téléphone')).toBe('Prévenu par téléphone');
  });

  it('dit le délai et l’état de la justification', () => {
    const justification = {
      status: 'PENDING',
      reason: 'SICKNESS',
      submittedAt: '2026-09-23T09:00:00Z',
      decidedAt: null,
      decisionNote: null,
    };

    expect(deadlineLabel('2026-09-30', 'fr')).toBe('À justifier jusqu’au 30/09');
    expect(justificationLabel(justification, 'fr')).toBe(
      'Justification envoyée le 23/09 · en attente de l’école',
    );
    expect(
      justificationLabel(
        { ...justification, status: 'REJECTED', decidedAt: '2026-09-25T09:00:00Z' },
        'fr',
      ),
    ).toBe('Justification non retenue le 25/09');
  });
});
