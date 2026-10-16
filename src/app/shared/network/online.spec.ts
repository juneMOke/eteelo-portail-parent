import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectOnline } from './online';

@Component({ template: '' })
class HostComponent {
  readonly online = injectOnline();
}

describe('injectOnline', () => {
  it('suit la perte et le retour du réseau', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const host = TestBed.createComponent(HostComponent).componentInstance;
    expect(host.online()).toBe(true);

    onLine.mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(host.online()).toBe(false);

    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    expect(host.online()).toBe(true);
  });
});
