import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SectionCardComponent } from './section-card.component';

@Component({
  imports: [SectionCardComponent],
  template: `
    <ui-section-card
      heading="Les frais de l’année"
      icon="banknote"
      [count]="count"
      [countAlert]="alert"
      [level]="level"
    >
      <p class="content">Contenu</p>
    </ui-section-card>
  `,
})
class HostComponent {
  count: string | null = '4 frais';
  alert: string | null = '1 en retard';
  level: 2 | 3 = 2;
}

describe('SectionCardComponent', () => {
  async function render(changes: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, changes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('titre la carte, la nomme par son titre et projette son contenu', async () => {
    const el = await render();
    const section = el.querySelector('section')!;

    expect(el.querySelector('h2')?.textContent).toBe('Les frais de l’année');
    expect(section.getAttribute('aria-labelledby')).toBe(el.querySelector('h2')?.id);
    expect(el.querySelector('.count')?.textContent).toBe('4 frais · 1 en retard');
    expect(el.querySelector('.count .alert')?.textContent).toBe('1 en retard');
    expect(el.querySelector('.body .content')?.textContent).toBe('Contenu');
  });

  it('prend le niveau de titre de la page, et se passe de pilule', async () => {
    const el = await render({ count: null, level: 3 });

    expect(el.querySelector('h3')).not.toBeNull();
    expect(el.querySelector('.count')).toBeNull();
  });
});
