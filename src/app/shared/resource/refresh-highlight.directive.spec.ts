import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RefreshHighlightDirective } from './refresh-highlight.directive';

@Component({
  imports: [RefreshHighlightDirective],
  template: `
    @for (item of items(); track item.id) {
      <p [id]="item.id" [uiRefreshHighlight]="item" [refreshed]="refreshed()">{{ item.label }}</p>
    }
  `,
})
class HostComponent {
  readonly items = signal([{ id: 'a', label: 'Devoir A' }]);
  readonly refreshed = signal(false);
}

describe('RefreshHighlightDirective', () => {
  const highlighted = (el: HTMLElement) =>
    [...el.querySelectorAll('.refresh-highlight')].map((node) => node.id);

  it('ne surligne rien à la première visite ni sur un geste du parent', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    fixture.componentInstance.items.set([
      { id: 'a', label: 'Devoir A' },
      { id: 'b', label: 'Devoir B' },
    ]);
    await fixture.whenStable();

    expect(highlighted(fixture.nativeElement)).toEqual([]);
  });

  it('surligne ce que le serveur ajoute ou change, pas le reste', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.items.set([
      { id: 'a', label: 'Devoir A' },
      { id: 'c', label: 'Devoir C' },
    ]);
    await fixture.whenStable();

    fixture.componentInstance.refreshed.set(true);
    fixture.componentInstance.items.set([
      { id: 'a', label: 'Devoir A' },
      { id: 'b', label: 'Devoir B' },
      { id: 'c', label: 'Devoir C · noté' },
    ]);
    await fixture.whenStable();

    expect(highlighted(fixture.nativeElement)).toEqual(['b', 'c']);
  });
});
