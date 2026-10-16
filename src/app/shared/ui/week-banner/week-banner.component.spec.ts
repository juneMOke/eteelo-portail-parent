import { TestBed } from '@angular/core/testing';
import { WeekBannerComponent } from './week-banner.component';

describe('WeekBannerComponent', () => {
  async function render(inputs: { wide?: boolean; isCurrent?: boolean; view?: boolean } = {}) {
    const fixture = TestBed.createComponent(WeekBannerComponent);
    const set = (name: string, value: unknown) => fixture.componentRef.setInput(name, value);
    set('label', 'Semaine du 28 septembre au 2 octobre 2026');
    set('shortLabel', '28 sept. – 2 oct.');
    set('relative', { long: 'semaine prochaine', short: 'sem. prochaine' });
    set('hasPrevious', true);
    set('hasNext', false);
    set('isCurrent', inputs.isCurrent ?? false);
    set('wide', inputs.wide ?? false);
    set('view', inputs.view === false ? null : 'grid');
    const events: unknown[] = [];
    fixture.componentInstance.step.subscribe((d) => events.push(d));
    fixture.componentInstance.current.subscribe(() => events.push('current'));
    fixture.componentInstance.viewChange.subscribe((v) => events.push(v));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, events };
  }

  it('tient sur une ligne au téléphone : intitulé et position abrégés, sans bascule', async () => {
    const { el } = await render();

    expect(el.querySelector('.title')?.textContent).toBe('28 sept. – 2 oct.');
    expect(el.querySelector('.relative')?.textContent).toBe('sem. prochaine');
    expect(el.querySelector('.current')?.textContent?.trim()).toBe('Revenir');
    expect(el.querySelector('.views')).toBeNull();
  });

  it('laisse la flèche de la borne visible mais inactive', async () => {
    const { el, events } = await render();
    const next = el.querySelector<HTMLButtonElement>('[aria-label="Semaine suivante"]')!;

    next.click();
    el.querySelector<HTMLButtonElement>('[aria-label="Semaine précédente"]')!.click();
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(events).toEqual([-1]);
  });

  it('ramène à cette semaine et rend le focus à l’intitulé', async () => {
    const { fixture, el, events } = await render({ wide: true });

    el.querySelector<HTMLButtonElement>('.current')!.click();
    fixture.componentRef.setInput('isCurrent', true);
    await fixture.whenStable();

    expect(events).toEqual(['current']);
    expect(document.activeElement).toBe(el.querySelector('.title'));
  });

  it('propose la bascule Liste / Grille au grand écran', async () => {
    const { el, events } = await render({ wide: true });
    const [list, grid] = el.querySelectorAll<HTMLButtonElement>('.view');

    expect(el.querySelector('.title')?.textContent).toBe(
      'Semaine du 28 septembre au 2 octobre 2026',
    );
    expect(grid.getAttribute('aria-checked')).toBe('true');
    list.click();
    expect(events).toEqual(['list']);
  });

  it('se passe de bascule quand la page n’a qu’une vue, et nomme sa pilule de retour', async () => {
    const { fixture, el } = await render({ wide: true, view: false });
    fixture.componentRef.setInput('currentLabel', 'Revenir à aujourd’hui');
    await fixture.whenStable();

    expect(el.querySelector('.views')).toBeNull();
    expect(el.querySelector('.current')?.textContent?.trim()).toBe('Revenir à aujourd’hui');
  });

  it('nomme ses flèches au pas choisi par la page', async () => {
    const { fixture, el } = await render();
    fixture.componentRef.setInput('previousLabel', 'Mois précédent');
    fixture.componentRef.setInput('nextLabel', 'Mois suivant');
    await fixture.whenStable();

    expect(el.querySelector('[aria-label="Mois précédent"]')).not.toBeNull();
    expect(el.querySelector('[aria-label="Mois suivant"]')).not.toBeNull();
  });
});
