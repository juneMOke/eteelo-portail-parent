import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import * as v from 'valibot';
import { Bootstrap, BootstrapSchema } from '../session/bootstrap.schema';
import { ParentAnnouncementList, ParentAnnouncementReadResult } from './announcements.contract';
import { PushSubscriptionBody } from './push.contract';
import { components } from './api-types';
import {
  EvaluationDetail,
  EvaluationList,
  HomeworkDetail,
  HomeworkList,
} from './assignments.contract';
import {
  AbsenceJustification,
  AttendanceRange,
  ChildAttendance,
  ChildDiscipline,
  JustificationRequest,
} from './conduct.contract';
import { AcademicYear, ChildFees, Payment } from './finance.contract';
import { GradeCourses, GradePeriod, GradeQuery, GradeWeek, ReportCard } from './grades.contract';

type Schemas = components['schemas'];

/**
 * Adresse de retour portée par le lien magique (amendement A4 du contrat « Annonces », lot L3) :
 * à retirer des deux types ci-dessous dès qu'elle est dans l'OpenAPI de staging.
 */
export type ParentIdentity = Schemas['ParentPortalIdentityResponse'] & {
  /** Rendue par l'ouverture de session seulement ; toujours null sur GET /auth/me. */
  readonly returnPath?: string | null;
};
export type MagicLinkRequest = Schemas['ParentMagicLinkRequest'] & {
  /** Page du portail où mènera le lien ; hors forme, le serveur l'ignore. */
  readonly returnPath?: string;
};

/** Préfixe de toutes les routes du portail parent (contrôleurs déjà préfixés, aucune réécriture). */
export const PARENT_API = '/api/v1/parent';
export const PARENT_AUTH_API = `${PARENT_API}/auth`;
export const PARENT_CHILDREN_API = `${PARENT_API}/children`;

/**
 * Point d'accès unique à l'API du portail parent.
 * Appelé par les façades et les stores, jamais par un composant (invariant 1).
 */
@Injectable({ providedIn: 'root' })
export class ParentApi {
  private readonly http = inject(HttpClient);

  /** Réponse validée par Valibot avant d'être rendue. */
  bootstrap(): Observable<Bootstrap> {
    return this.http
      .get<unknown>(`${PARENT_API}/bootstrap`)
      .pipe(map((raw) => v.parse(BootstrapSchema, raw)));
  }

  /** Pose aussi le cookie __Host-XSRF-TOKEN, nécessaire avant le premier POST. */
  currentHolder(): Observable<ParentIdentity> {
    return this.http.get<ParentIdentity>(`${PARENT_AUTH_API}/me`);
  }

  requestMagicLink(body: MagicLinkRequest): Observable<void> {
    return this.http.post<void>(`${PARENT_AUTH_API}/magic-link`, body);
  }

  openSession(body: Schemas['OpenParentSessionRequest']): Observable<ParentIdentity> {
    return this.http.post<ParentIdentity>(`${PARENT_AUTH_API}/session`, body);
  }

  closeSession(): Observable<void> {
    return this.http.delete<void>(`${PARENT_AUTH_API}/session`);
  }

  /** Épreuves de la fenêtre par défaut : début de période à aujourd'hui + 28 jours. */
  evaluations(childId: string): Observable<EvaluationList> {
    return this.http.get<EvaluationList>(`${PARENT_CHILDREN_API}/${childId}/evaluations`);
  }

  evaluation(childId: string, evaluationId: string): Observable<EvaluationDetail> {
    return this.http.get<EvaluationDetail>(
      `${PARENT_CHILDREN_API}/${childId}/evaluations/${evaluationId}`,
    );
  }

  /** Devoirs de la fenêtre par défaut, triés par échéance puis matière. */
  homework(childId: string): Observable<HomeworkList> {
    return this.http.get<HomeworkList>(`${PARENT_CHILDREN_API}/${childId}/homework`);
  }

  homeworkDetail(childId: string, evaluationId: string): Observable<HomeworkDetail> {
    return this.http.get<HomeworkDetail>(
      `${PARENT_CHILDREN_API}/${childId}/homework/${evaluationId}`,
    );
  }

  /** Évaluations d'une semaine (Ma semaine) ; sans jour, la semaine en cours. */
  gradesWeek(childId: string, weekOf?: string): Observable<GradeWeek> {
    return this.http.get<GradeWeek>(`${PARENT_CHILDREN_API}/${childId}/grades/week`, {
      params: weekOf ? { weekOf } : {},
    });
  }

  /** Périodes scolaires de l'année de l'enfant, pour le choix trimestre · période. */
  gradePeriods(childId: string): Observable<GradePeriod[]> {
    return this.http.get<GradePeriod[]>(`${PARENT_CHILDREN_API}/${childId}/grades/periods`);
  }

  /** Moyennes et évaluations par cours (Mes cours) ; sans sélection, la période en cours. */
  gradeCourses(childId: string, query: GradeQuery = {}): Observable<GradeCourses> {
    return this.http.get<GradeCourses>(`${PARENT_CHILDREN_API}/${childId}/grades/courses`, {
      params: gradeParams(query),
    });
  }

  /** Mon bulletin ; sans sélection, le dernier bulletin publié, sinon la période en cours. */
  reportCard(childId: string, query: GradeQuery = {}): Observable<ReportCard> {
    return this.http.get<ReportCard>(`${PARENT_CHILDREN_API}/${childId}/grades/report-card`, {
      params: gradeParams(query),
    });
  }

  /**
   * Présence de toute l'année scolaire, jusqu'à aujourd'hui (Ma présence) ; avec une plage, les
   * jours et le résumé de cette plage seulement (la semaine affichée).
   */
  attendance(childId: string, range?: AttendanceRange): Observable<ChildAttendance> {
    return this.http.get<ChildAttendance>(`${PARENT_CHILDREN_API}/${childId}/attendance`, {
      params: range ? { from: range.from, to: range.to } : {},
    });
  }

  /** Faits consignés d'un trimestre (Ma discipline) ; sans trimestre, celui en cours. */
  discipline(childId: string, periodId?: string): Observable<ChildDiscipline> {
    return this.http.get<ChildDiscipline>(`${PARENT_CHILDREN_API}/${childId}/discipline`, {
      params: periodId ? { periodId } : {},
    });
  }

  /** Frais d'une année de l'enfant, avec leurs totaux par devise ; sans année, l'année courante. */
  fees(childId: string, academicYearId?: string): Observable<ChildFees> {
    return this.http.get<ChildFees>(`${PARENT_CHILDREN_API}/${childId}/fees`, {
      params: yearParams(academicYearId),
    });
  }

  /** Versements d'une année, du plus récent au plus ancien ; sans année, l'année courante. */
  payments(childId: string, academicYearId?: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${PARENT_CHILDREN_API}/${childId}/payments`, {
      params: yearParams(academicYearId),
    });
  }

  /** Années où l'enfant a été inscrit, la plus récente en tête (choix d'année de Mes reçus). */
  academicYears(childId: string): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(`${PARENT_CHILDREN_API}/${childId}/academic-years`);
  }

  /** Le PDF scellé du reçu d'un versement, pour le partager. */
  receipt(childId: string, paymentId: string): Observable<Blob> {
    return this.http.get(receiptUrl(childId, paymentId), { responseType: 'blob' });
  }

  /**
   * Relevé de l'année (PDF), généré à chaque appel : chaque génération prend un numéro de pièce
   * de l'école. D'où un POST, sous CSRF et sous le plafond d'écriture du portail (429).
   */
  statement(childId: string, academicYearId?: string): Observable<Blob> {
    return this.http.post(`${PARENT_CHILDREN_API}/${childId}/statement`, null, {
      params: yearParams(academicYearId),
      responseType: 'blob',
    });
  }

  /** Les annonces de l'enfant pour l'année en cours, la plus récente d'abord. */
  announcements(childId: string): Observable<ParentAnnouncementList> {
    return this.http.get<ParentAnnouncementList>(`${PARENT_CHILDREN_API}/${childId}/announcements`);
  }

  /** Marque une annonce lue ; idempotent, la première lecture est gardée. */
  markAnnouncementRead(
    childId: string,
    announcementId: string,
  ): Observable<ParentAnnouncementReadResult> {
    return this.http.post<ParentAnnouncementReadResult>(
      `${PARENT_CHILDREN_API}/${childId}/announcements/${announcementId}/read`,
      null,
    );
  }

  /** Enregistre l'abonnement de ce téléphone ; idempotent sur `endpoint`. */
  savePushSubscription(body: PushSubscriptionBody): Observable<void> {
    return this.http.put<void>(`${PARENT_API}/push-subscriptions`, body);
  }

  /** Retire l'abonnement de ce téléphone ; 204 même s'il est déjà absent. */
  deletePushSubscription(endpoint: string): Observable<void> {
    return this.http.delete<void>(`${PARENT_API}/push-subscriptions`, { body: { endpoint } });
  }

  /**
   * Justifie l'absence d'un jour : une demande que l'école valide. Rend les événements pour
   * suivre l'envoi de la pièce jointe ; un renvoi du même `id` est sans effet.
   */
  justifyAbsence(
    childId: string,
    date: string,
    request: JustificationRequest,
  ): Observable<HttpEvent<AbsenceJustification>> {
    const body = new FormData();
    body.append('id', request.id);
    body.append('reason', request.reason);
    if (request.note) body.append('note', request.note);
    if (request.file) body.append('file', request.file, request.file.name);
    return this.http.post<AbsenceJustification>(
      `${PARENT_CHILDREN_API}/${childId}/attendance/${date}/justification`,
      body,
      { observe: 'events', reportProgress: true },
    );
  }

  /**
   * Dépose (ou remplace) la copie d'un devoir : une partie `files` par page, dans l'ordre. Rend
   * les événements pour suivre la progression de l'envoi ; la réponse porte la fiche relue.
   */
  submitHomework(
    childId: string,
    evaluationId: string,
    files: readonly File[],
  ): Observable<HttpEvent<HomeworkDetail>> {
    const body = new FormData();
    for (const file of files) body.append('files', file, file.name);
    return this.http.post<HomeworkDetail>(
      `${PARENT_CHILDREN_API}/${childId}/homework/${evaluationId}/submission`,
      body,
      { observe: 'events', reportProgress: true },
    );
  }
}

/** Une portion sans sa période ne veut rien dire : le serveur l'appliquerait à la période en cours. */
function gradeParams({ periodId, part }: GradeQuery): Record<string, string> {
  return periodId ? { periodId, ...(part ? { part } : {}) } : {};
}

function yearParams(academicYearId: string | undefined): Record<string, string> {
  return academicYearId ? { academicYearId } : {};
}

/** Reçu scellé d'un versement (PDF inline), ouvrable tel quel dans un nouvel onglet. */
export function receiptUrl(childId: string, paymentId: string): string {
  return `${PARENT_CHILDREN_API}/${childId}/payments/${paymentId}/receipt`;
}

/**
 * Photo de l'enfant (JPEG 512 px, ETag). À n'appeler que si photoFingerprint est renseigné.
 * L'empreinte dans l'URL change avec la photo : le navigateur peut garder l'image en cache
 * sans la revalider à chaque chargement.
 */
export function childPhotoUrl(childId: string, fingerprint: string): string {
  return `${PARENT_CHILDREN_API}/${childId}/photo?v=${encodeURIComponent(fingerprint)}`;
}

/** Logo de l'école (PNG, ETag), versionné par son empreinte comme la photo d'un enfant. */
export function schoolLogoUrl(fingerprint: string): string {
  return `${PARENT_API}/school/logo?v=${encodeURIComponent(fingerprint)}`;
}
