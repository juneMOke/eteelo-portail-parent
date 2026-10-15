import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import {
  ENGLISH_DUE,
  GEOGRAPHY_DUE,
  HISTORY_AWAITING,
  MATHS_GRADED,
  PHYSICS_DUE,
  homeworkDetailFixture,
  submittedHomeworkFixture,
} from '../../../../testing/homework.fixture';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import HomeworkDetailPage from './homework-detail.page';

registerLocaleData(localeFr);

describe('HomeworkDetailPage', () => {
  const submitHomework = vi.fn((_: string, id: string, files: readonly File[]) =>
    of(
      new HttpResponse({
        status: 201,
        body: submittedHomeworkFixture(
          id,
          files.map((file) => ({ name: file.name, type: file.type, size: file.size })),
        ),
      }),
    ),
  );

  async function render(evaluationId: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        {
          provide: ParentApi,
          useValue: {
            bootstrap: () => of(bootstrapFixture()),
            homeworkDetail: (_: string, id: string) => {
              const detail = homeworkDetailFixture(id);
              return detail ? of(detail) : throwError(() => new HttpErrorResponse({ status: 404 }));
            },
            submitHomework,
          },
        },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(HomeworkDetailPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    fixture.componentRef.setInput('evaluationId', evaluationId);
    await settle();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const blocks = (el: HTMLElement) =>
    [...el.children].map((child) => child.tagName.toLowerCase()).filter((tag) => tag !== 'p');

  it('présente un devoir à rendre en ligne : grille, questions, dépôt, énoncé', async () => {
    const el = await render(PHYSICS_DUE.evaluationId);

    expect(el.querySelector('app-identity-banner h2')?.textContent).toBe(
      'Devoir de Physique — la vitesse',
    );
    expect(el.querySelector('.subtitle')?.textContent).toBe('Physique · Devoir');
    expect([...el.querySelectorAll('dd')].map((dd) => dd.textContent)).toEqual([
      '16/09/2026',
      'mercredi 23/09/2026',
      '18:00',
      'En ligne',
    ]);
    expect(blocks(el)).toEqual([
      'app-identity-banner',
      'app-instructions-block',
      'section',
      'app-document-row',
    ]);
    expect(el.querySelector('app-instructions-block h3')?.textContent).toBe('Questions du devoir');
    expect(el.querySelectorAll('app-instructions-block li')).toHaveLength(2);
    expect(el.querySelector('.upload h3')?.textContent).toBe('Déposer le devoir');
    expect(el.querySelector('.upload p')?.textContent).toBe(
      'Dépôt ouvert jusqu’au mercredi 23/09/2026, avant 18:00.',
    );
    expect(el.querySelector('ui-file-upload')?.textContent).toContain('Choisir un fichier');
    expect(el.querySelector('app-document-row')?.textContent).toContain('Énoncé du devoir');
    expect(el.querySelector('.no-document')).toBeNull();
    expect(el.querySelector('app-result-block')).toBeNull();
  });

  it('dit un devoir à remettre en classe, sans heure limite connue ni document', async () => {
    const el = await render(HISTORY_AWAITING.evaluationId);

    expect([...el.querySelectorAll('dd')].map((dd) => dd.textContent)).toContain('—');
    expect(el.querySelector('.delivery')?.textContent).toContain('À remettre en classe');
    expect(el.querySelector('.delivery .late')).toBeNull();
    expect(el.querySelector('ui-file-upload')).toBeNull();
    expect(el.querySelector('.no-document')?.textContent).toContain('Aucun document déposé');
  });

  it('met le résultat en tête une fois corrigé, puis le corrigé, les questions et l’énoncé', async () => {
    const el = await render(MATHS_GRADED.evaluationId);

    expect(blocks(el)).toEqual([
      'app-identity-banner',
      'app-result-block',
      'app-document-row',
      'app-instructions-block',
      'app-document-row',
    ]);
    expect(el.querySelector('app-result-block ui-grade')?.textContent).toContain('15/20');
    expect(el.querySelector('.context')?.textContent).toContain('moyenne de la classe 12,25/20');
    expect(el.querySelector('blockquote')?.textContent).toContain('Bon travail.');
    expect(el.querySelector('.delivery')).toBeNull();
  });

  it('montre une question sans barème sans inventer de points', async () => {
    const el = await render(ENGLISH_DUE.evaluationId);

    expect(el.querySelector('app-instructions-block li')?.textContent).toContain(
      'Write five sentences about yourself.',
    );
    expect(el.querySelector('app-instructions-block .points')).toBeNull();
  });

  it("dit quand l'enseignant n'a pas détaillé le devoir", async () => {
    const el = await render(GEOGRAPHY_DUE.evaluationId);

    expect(el.querySelector('app-instructions-block .empty')?.textContent).toContain(
      'pas détaillé ce devoir',
    );
  });

  it('dépose la copie, passe le devoir à « Rendu » et montre la copie en tête', async () => {
    const el = await render(PHYSICS_DUE.evaluationId);
    const copy = new File(['%PDF'], 'copie-physique.pdf', { type: 'application/pdf' });
    const input: HTMLInputElement = el.querySelector('ui-file-upload input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [copy], configurable: true });
    input.dispatchEvent(new Event('change'));
    await settle();
    const send = [...el.querySelectorAll('ui-file-upload button')].find(
      (button) => button.textContent?.trim() === 'Envoyer',
    ) as HTMLButtonElement;

    send.click();
    await settle();

    expect(submitHomework).toHaveBeenCalledWith(GRACE.childId, PHYSICS_DUE.evaluationId, [copy]);
    expect(el.querySelector('app-identity-banner')?.textContent).toContain('Rendu');
    expect(el.querySelector('.confirmation')?.textContent).toBe('Copie reçue par l’école.');
    expect(blocks(el).slice(0, 4)).toEqual([
      'app-identity-banner',
      'app-document-row',
      'section',
      'app-instructions-block',
    ]);
    expect(el.querySelector('app-document-row')?.textContent).toContain('Copie déposée');
    expect(el.querySelector('.upload h3')?.textContent).toBe('Remplacer la copie');
  });

  it('dit un devoir introuvable et ramène à la liste', async () => {
    const el = await render('inconnu');

    expect(el.querySelector('ui-empty-state h2')?.textContent).toBe('Devoir introuvable');
    expect(el.querySelector('ui-empty-state a')?.getAttribute('href')).toBe(
      `/c/${GRACE.childId}/homework`,
    );
  });
});
