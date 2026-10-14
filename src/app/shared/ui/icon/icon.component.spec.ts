import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  it('dessine les tracés de l’icône, masquée aux lecteurs d’écran', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'swap');
    fixture.componentRef.setInput('size', 16);
    await fixture.whenStable();

    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.querySelectorAll('path')).toHaveLength(4);
  });
});
