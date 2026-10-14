import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

@Component({
  imports: [CardComponent],
  template: '<ui-card><p>Contenu</p></ui-card>',
})
class HostComponent {}

describe('CardComponent', () => {
  it('projette son contenu', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('ui-card p').textContent).toBe('Contenu');
  });
});
