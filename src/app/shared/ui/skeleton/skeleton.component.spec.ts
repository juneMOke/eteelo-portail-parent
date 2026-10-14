import { TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  it('prend la taille demandée et reste muet pour les lecteurs d’écran', async () => {
    const fixture = TestBed.createComponent(SkeletonComponent);
    fixture.componentRef.setInput('width', '60%');
    fixture.componentRef.setInput('height', '72px');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.style.getPropertyValue('--skeleton-width')).toBe('60%');
    expect(el.style.getPropertyValue('--skeleton-height')).toBe('72px');
  });
});
