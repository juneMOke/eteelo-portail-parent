import { TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('affiche le titre et le message', async () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('heading', 'Bientôt disponible');
    fixture.componentRef.setInput('message', 'Cette page arrive.');
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toBe('Bientôt disponible');
    expect(el.querySelector('p')?.textContent).toBe('Cette page arrive.');
  });

  it('omet le message absent', async () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('heading', 'Rien ici');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });
});
