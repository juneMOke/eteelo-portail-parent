import { TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  async function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(BadgeComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('prend les couleurs de son ton', async () => {
    const el = await render({ tone: 'success' });

    expect(el.style.getPropertyValue('--badge-bg')).toBe('var(--color-tone-success-soft)');
    expect(el.style.getPropertyValue('--badge-fg')).toBe('var(--color-tone-success)');
    expect(el.classList.contains('solid')).toBe(false);
  });

  it('passe sur fond crème quand elle est posée sur un aplat', async () => {
    const el = await render({ tone: 'alert', onTone: true });

    expect(el.classList.contains('solid')).toBe(true);
  });
});
