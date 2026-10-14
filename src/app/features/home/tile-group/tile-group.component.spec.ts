import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NAV_GROUPS } from '../../../core/navigation/nav';
import { TileGroupComponent } from './tile-group.component';

describe('TileGroupComponent', () => {
  it('est une section nommée par son titre, avec une tuile par page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TileGroupComponent);
    fixture.componentRef.setInput('group', NAV_GROUPS[0]);
    fixture.componentRef.setInput('childId', 'abc');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h2');

    expect(heading?.textContent).toBe('Préparer ma semaine');
    expect(el.querySelector('section')?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(el.querySelectorAll('li app-tile')).toHaveLength(3);
  });
});
