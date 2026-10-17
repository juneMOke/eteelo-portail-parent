import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { stubDialog } from '../../../../testing/dialog';
import { SheetComponent } from './sheet.component';

@Component({
  imports: [SheetComponent],
  template: `<ui-sheet
    heading="Choisir la période"
    [dismissible]="dismissible"
    [backLabel]="backLabel"
    [label]="label"
    (closed)="closed = closed + 1"
    (back)="back = back + 1"
    ><span sheetLead class="lead">En retard</span><span sheetSub class="sub">Sous-titre</span>
    <p>Contenu</p></ui-sheet
  >`,
})
class HostComponent {
  readonly sheet = viewChild.required(SheetComponent);
  dismissible = false;
  backLabel: string | null = null;
  label: string | null = null;
  closed = 0;
  back = 0;
}

describe('SheetComponent', () => {
  beforeAll(stubDialog);

  async function render(changes: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, changes);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { host: fixture.componentInstance, dialog: el.querySelector('dialog')!, el };
  }

  it('nomme la feuille par son titre et projette son contenu', async () => {
    const { dialog, el } = await render();
    const heading = el.querySelector('h2')!;

    expect(heading.textContent).toBe('Choisir la période');
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(el.querySelector('p')?.textContent).toBe('Contenu');
  });

  it('prend un nom lu distinct quand le titre affiché est un montant', async () => {
    const { dialog } = await render({ label: 'Mardi 22/09 · Mobile money' });

    expect(dialog.getAttribute('aria-label')).toBe('Mardi 22/09 · Mobile money');
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('s’ouvre, puis se ferme sur le voile mais pas sur le contenu', async () => {
    const { host, dialog, el } = await render();

    host.sheet().open();
    expect(dialog.hasAttribute('open')).toBe(true);
    el.querySelector('p')!.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    dialog.click();
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('signale sa fermeture, par Échap comme par le voile', async () => {
    const { host, dialog } = await render();

    dialog.dispatchEvent(new Event('close'));

    expect(host.closed).toBe(1);
  });

  it('place la pastille au-dessus du titre et le sous-titre dessous, sans ✕ ni retour par défaut', async () => {
    const { el } = await render();
    const titles = el.querySelector('.titles')!;

    expect([...titles.children].map((child) => child.tagName.toLowerCase())).toEqual([
      'span',
      'h2',
      'span',
    ]);
    expect(el.querySelector('button')).toBeNull();
  });

  it('se ferme par son ✕ et signale le retour par sa flèche', async () => {
    const { host, dialog, el } = await render({ dismissible: true, backLabel: 'Retour au frais' });

    host.sheet().open();
    el.querySelector<HTMLButtonElement>('.back')!.click();
    expect(host.back).toBe(1);
    expect(el.querySelector('.back')?.getAttribute('aria-label')).toBe('Retour au frais');

    el.querySelector<HTMLButtonElement>('button[aria-label="Fermer"]')!.click();
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});
