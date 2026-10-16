import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { settle } from '../../../../testing/async';
import { GRACE, bootstrapFixture } from '../../../../testing/bootstrap.fixture';
import { stubDialog } from '../../../../testing/dialog';
import { plainText as text } from '../../../../testing/text';
import {
  FEE_ID,
  PAYMENT_ID,
  feesFixture,
  unpublishedFeesFixture,
} from '../../../../testing/finance.fixture';
import { ChildFees } from '../../../core/api/finance.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';
import FeesPage from './fees.page';

registerLocaleData(localeFr);

describe('FeesPage', () => {
  beforeAll(stubDialog);

  async function render(
    fees: () => ReturnType<ParentApi['fees']> = () => of(feesFixture()),
    fee?: string,
  ) {
    const api = { fees: vi.fn(fees), bootstrap: vi.fn(() => of(bootstrapFixture())) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ParentApi, useValue: api },
      ],
    });
    await TestBed.inject(SessionStore).ensureLoaded();
    const fixture = TestBed.createComponent(FeesPage);
    fixture.componentRef.setInput('childId', GRACE.childId);
    if (fee) fixture.componentRef.setInput('fee', fee);
    await settle();
    await fixture.whenStable();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  it('montre le retard en haut, le bilan par devise, puis chaque frais dans l’ordre du serveur', async () => {
    const { el, api } = await render();

    expect(api.fees).toHaveBeenCalledWith(GRACE.childId);
    expect(text(el.querySelector('app-overdue-banner .headline'))).toBe(
      'Frais scolaires · 1re tranche · 80 $ en retard depuis le 15/09',
    );
    expect(text(el.querySelector('app-balance-summary .band'))).toBe('Année 2026-2027');
    expect([...el.querySelectorAll('app-balance-summary .remaining')].map(text)).toEqual([
      '314 $ restant',
      '100 000 FC restant',
    ]);
    expect([...el.querySelectorAll('app-ledger-row .title')].map(text)).toEqual([
      'Frais scolaires · 1re tranche',
      'Transport scolaire · 1er trimestre',
      'Frais scolaires · 2e tranche',
      'Frais d’inscription',
    ]);
    expect(text(el.querySelector('app-ledger-row .detail'))).toBe(
      'En retard depuis le 15/09 · 80 $ restant · 180 $ déjà versés',
    );
  });

  it('n’affiche pas de bandeau quand rien n’est en retard', async () => {
    const calm: ChildFees = {
      ...feesFixture(),
      fees: feesFixture().fees.filter((fee) => fee.state !== 'OVERDUE'),
    };
    const { el } = await render(() => of(calm));

    expect(el.querySelector('app-overdue-banner')).toBeNull();
  });

  it('ouvre la fiche d’un frais par l’URL, avec le calcul en clair et ses versements', async () => {
    const { el } = await render(undefined, FEE_ID.secondInstalment);
    const sheet = el.querySelector('app-fee-sheet dialog')!;

    expect(sheet.hasAttribute('open')).toBe(true);
    expect([...sheet.querySelectorAll('.facts dt')].map(text)).toEqual([
      'Montant',
      'Réduction',
      'À payer',
      'Versé',
      'Reste',
    ]);
    expect(text(sheet.querySelector('.facts div:nth-child(2) dd'))).toBe('Réduction fratrie 10 %');
    expect(text(sheet.querySelector('.none'))).toBe('Aucun versement pour ce frais.');
  });

  it('mène d’un versement reçu à sa fiche dans Mes paiements', async () => {
    const { el } = await render(undefined, FEE_ID.firstInstalment);
    const links = el.querySelectorAll('app-fee-sheet app-ledger-row a');

    expect(links[0].getAttribute('href')).toBe(
      `/c/${GRACE.childId}/finance/payments?payment=${PAYMENT_ID.airtel}`,
    );
  });

  it('met la fiche choisie dans l’URL', async () => {
    const { el } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('app-ledger-row button')!.click();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { fee: FEE_ID.firstInstalment }, replaceUrl: true }),
    );
  });

  it('dit comment payer : le secrétariat, les autres moyens bientôt disponibles', async () => {
    const { el, fixture } = await render();

    el.querySelector<HTMLButtonElement>('app-overdue-banner button')!.click();
    await fixture.whenStable();
    const sheet = el.querySelector('app-how-to-pay-sheet dialog')!;

    expect(sheet.hasAttribute('open')).toBe(true);
    expect([...sheet.querySelectorAll('h3')].map(text)).toEqual([
      'Au secrétariat de l’école',
      'Mobile money',
      'Virement bancaire',
    ]);
    expect(sheet.querySelectorAll('ui-badge')).toHaveLength(2);
    expect(sheet.querySelector('a.call')?.getAttribute('href')).toBe('tel:+243998877665');
  });

  it('annonce des frais pas encore publiés, sans bilan', async () => {
    const { el } = await render(() => of(unpublishedFeesFixture()));

    expect(text(el.querySelector('ui-empty-period h2'))).toBe(
      'Les frais de l’année 2026-2027 seront publiés par l’école.',
    );
    expect(el.querySelector('app-balance-summary')).toBeNull();
  });

  it('propose de réessayer quand les frais ne viennent pas', async () => {
    const { el } = await render(() => throwError(() => new Error('réseau')));

    expect(text(el.querySelector('ui-load-error h2'))).toBe('Impossible d’afficher les frais');
  });
});
