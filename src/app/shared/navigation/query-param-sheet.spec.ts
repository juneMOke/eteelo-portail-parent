import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Openable, injectQueryParamSheet } from './query-param-sheet';

@Component({ template: '' })
class HostComponent {
  readonly item = input<string>();
  readonly sheet = signal<Openable>({ open: vi.fn(), close: vi.fn() });
  readonly fiche = injectQueryParamSheet('item', { selected: this.item, sheet: this.sheet });
}

describe('injectQueryParamSheet', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance };
  }

  it('ouvre la fiche quand l’URL nomme un élément, la ferme sinon', async () => {
    const { fixture, host } = await render();
    const sheet = host.sheet();

    fixture.componentRef.setInput('item', 'f1');
    await fixture.whenStable();
    expect(sheet.open).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('item', undefined);
    await fixture.whenStable();
    expect(sheet.close).toHaveBeenCalled();
  });

  it('met l’élément dans l’URL à l’ouverture et l’en retire à la fermeture', async () => {
    const { host } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    host.fiche.show('f1');
    host.fiche.dismiss();

    expect(navigate).toHaveBeenNthCalledWith(
      1,
      [],
      expect.objectContaining({
        queryParams: { item: 'f1' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
    expect(navigate).toHaveBeenNthCalledWith(
      2,
      [],
      expect.objectContaining({
        queryParams: { item: null },
      }),
    );
  });
});
