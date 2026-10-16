import { TestBed } from '@angular/core/testing';
import { FilterMenuComponent, FilterOption } from './filter-menu.component';

const OPTIONS: FilterOption[] = [
  { id: null, label: 'Tous', count: 3, tone: null },
  { id: 'DUE', label: 'À rendre', count: 2, tone: 'pending' },
  { id: 'GRADED', label: 'Corrigés', count: 1, tone: 'success' },
];

describe('FilterMenuComponent', () => {
  async function render(open = false) {
    const fixture = TestBed.createComponent(FilterMenuComponent);
    fixture.componentRef.setInput('caption', 'Filtrer par statut');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('checked', 'DUE');
    fixture.componentRef.setInput('open', open);
    const picks: (string | null)[] = [];
    const opens: boolean[] = [];
    fixture.componentInstance.pick.subscribe((id) => picks.push(id));
    fixture.componentInstance.openChange.subscribe((value) => opens.push(value));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, picks, opens };
  }

  it('montre la valeur active et son compteur dans le déclencheur', async () => {
    const { el } = await render();
    const trigger = el.querySelector('.trigger')!;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.querySelector('.value-label')?.textContent).toBe('À rendre');
    expect(trigger.querySelector('.value-count')?.textContent).toBe('· 2');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('demande à s’ouvrir, puis coche l’option active', async () => {
    const { fixture, el, opens } = await render();

    el.querySelector<HTMLButtonElement>('.trigger')!.click();
    expect(opens).toEqual([true]);
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    const selected = el.querySelector('[aria-selected="true"]');
    expect(selected?.textContent).toContain('À rendre');
    expect(selected?.querySelector('.check')).not.toBeNull();
  });

  it('se parcourt au clavier et choisit à Entrée', async () => {
    const { el, picks, opens } = await render(true);
    const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
    const key = (k: string) => listbox.dispatchEvent(new KeyboardEvent('keydown', { key: k }));

    key('ArrowDown');
    key('Enter');
    expect(picks).toEqual(['GRADED']);
    expect(opens).toEqual([false]);
    expect(document.activeElement).toBe(el.querySelector('.trigger'));
  });

  it('se ferme à Échap sans rien choisir', async () => {
    const { el, picks, opens } = await render(true);

    el.querySelector('[role="listbox"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    expect(picks).toEqual([]);
    expect(opens).toEqual([false]);
  });

  it('ajoute l’unité au compteur, et s’en passe quand il n’y en a pas', async () => {
    const { fixture, el } = await render();
    fixture.componentRef.setInput('options', [
      { id: 'T1', label: '1er trimestre', count: 12, unit: 'éval.', tone: null },
      { id: 'T2', label: '2e trimestre', count: null, tone: null },
    ]);
    fixture.componentRef.setInput('checked', 'T1');
    await fixture.whenStable();
    expect(el.querySelector('.value-count')?.textContent).toBe('· 12 éval.');

    fixture.componentRef.setInput('checked', 'T2');
    await fixture.whenStable();
    expect(el.querySelector('.value-count')).toBeNull();
  });
});
