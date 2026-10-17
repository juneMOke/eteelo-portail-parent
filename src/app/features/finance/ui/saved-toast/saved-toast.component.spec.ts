import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { plainText as text } from '../../../../../testing/text';
import { SavedToastComponent } from './saved-toast.component';

@Component({
  imports: [SavedToastComponent],
  template: `<app-saved-toast />`,
})
class HostComponent {
  readonly toast = viewChild.required(SavedToastComponent);
}

describe('SavedToastComponent', () => {
  it('confirme quatre secondes, dans une région annoncée', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-saved-toast')?.getAttribute('role')).toBe('status');
    expect(el.querySelector('.saved')).toBeNull();

    fixture.componentInstance.toast().show('Reçu n° 1078 enregistré');
    fixture.detectChanges();
    expect(text(el.querySelector('.saved'))).toBe('Reçu n° 1078 enregistré');

    vi.advanceTimersByTime(4_000);
    fixture.detectChanges();
    expect(el.querySelector('.saved')).toBeNull();
    vi.useRealTimers();
  });
});
