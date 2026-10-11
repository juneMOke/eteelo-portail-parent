import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import * as v from 'valibot';
import { Bootstrap, BootstrapSchema } from '../session/bootstrap.schema';
import { components } from './api-types';

type Schemas = components['schemas'];
export type ParentIdentity = Schemas['ParentPortalIdentityResponse'];

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

  requestMagicLink(body: Schemas['ParentMagicLinkRequest']): Observable<void> {
    return this.http.post<void>(`${PARENT_AUTH_API}/magic-link`, body);
  }

  openSession(body: Schemas['OpenParentSessionRequest']): Observable<ParentIdentity> {
    return this.http.post<ParentIdentity>(`${PARENT_AUTH_API}/session`, body);
  }

  closeSession(): Observable<void> {
    return this.http.delete<void>(`${PARENT_AUTH_API}/session`);
  }
}

/** Photo de l'enfant (JPEG 512 px, ETag). À n'appeler que si photoFingerprint est renseigné. */
export function childPhotoUrl(childId: string): string {
  return `${PARENT_CHILDREN_API}/${childId}/photo`;
}

/** Logo de l'école (PNG, ETag). À n'appeler que si logoFingerprint est renseigné. */
export const SCHOOL_LOGO_URL = `${PARENT_API}/school/logo`;
