import { TestBed } from '@angular/core/testing';
import { SwipePagerComponent } from './swipe-pager.component';

describe('SwipePagerComponent', () => {
  async function render(position: string) {
    const fixture = TestBed.createComponent(SwipePagerComponent);
    fixture.componentRef.setInput('position', position);
    fixture.componentRef.setInput('label', 'Évaluations de la semaine');
    const swipes: number[] = [];
    fixture.componentInstance.swipe.subscribe((direction) => swipes.push(direction));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, swipes, section: el.querySelector('section')! };
  }

  function touch(target: Element, type: string, x: number, y: number): void {
    const event = new Event(type) as TouchEvent;
    Object.defineProperty(event, 'changedTouches', { value: [{ clientX: x, clientY: y }] });
    target.dispatchEvent(event);
  }

  it('nomme sa région', async () => {
    const { section } = await render('2026-09-21');

    expect(section.getAttribute('aria-label')).toBe('Évaluations de la semaine');
  });

  it('glisse dans le sens du changement de position', async () => {
    const { fixture, el } = await render('2026-09-21');
    const content = () => el.querySelector<HTMLElement>('.content')!.style.animationName;

    fixture.componentRef.setInput('position', '2026-09-28');
    await fixture.whenStable();
    expect(content()).toMatch(/^slide-in-forward-/);

    fixture.componentRef.setInput('position', '2026-09-14');
    await fixture.whenStable();
    expect(content()).toMatch(/^slide-in-backward-/);
  });

  it('émet le sens d’un balayage horizontal, pas d’un défilement', async () => {
    const { section, swipes } = await render('2026-09-21');

    touch(section, 'touchstart', 200, 100);
    touch(section, 'touchend', 100, 110);
    touch(section, 'touchstart', 100, 100);
    touch(section, 'touchend', 200, 100);
    touch(section, 'touchstart', 100, 100);
    touch(section, 'touchend', 180, 200);

    expect(swipes).toEqual([1, -1]);
  });
});
