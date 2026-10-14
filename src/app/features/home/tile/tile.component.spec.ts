import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { navEntry } from '../../../core/navigation/nav';
import { TileComponent } from './tile.component';

describe('TileComponent', () => {
  it("mène à la page de l'enfant, avec son titre", async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TileComponent);
    fixture.componentRef.setInput('entry', navEntry('report-card'));
    fixture.componentRef.setInput('childId', 'abc');
    await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.getAttribute('href')).toBe('/c/abc/grades/report-card');
    expect(link.textContent?.trim()).toBe('Mon bulletin');
  });
});
