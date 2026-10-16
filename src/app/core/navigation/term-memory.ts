import { Injectable } from '@angular/core';

/** Une période scolaire choisie (`term` dans l'URL), et sa partie quand la page en a une. */
export interface RememberedTerm {
  readonly periodId: string;
  readonly part?: string;
}

/**
 * Le trimestre choisi suit le parent d'une page à l'autre pendant la session : Mes cours, Mon
 * bulletin et Ma discipline partagent le même choix (spec 05 ③, spec 06 ⑥). Mémoire vive
 * seulement, rien sur le téléphone (invariant 5) ; l'URL reste la source de chaque page.
 */
@Injectable({ providedIn: 'root' })
export class TermMemory {
  private readonly terms = new Map<string, RememberedTerm>();

  remember(childId: string, term: RememberedTerm): void {
    this.terms.set(childId, term);
  }

  /** Une page sans partie garde celle déjà choisie sur la même période, sinon prend tout. */
  rememberPeriod(childId: string, periodId: string): void {
    const known = this.terms.get(childId);
    if (known?.periodId !== periodId) this.terms.set(childId, { periodId, part: 'ALL' });
  }

  /** Le dernier choix fait pour cet enfant pendant la session. */
  recall(childId: string): RememberedTerm | undefined {
    return this.terms.get(childId);
  }
}
