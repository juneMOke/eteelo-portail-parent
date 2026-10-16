import { TestBed } from '@angular/core/testing';
import { CopyButtonComponent } from './copy-button.component';

describe('CopyButtonComponent', () => {
  it('copie le texte et dit « Copié » deux secondes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const fixture = TestBed.createComponent(CopyButtonComponent);
    fixture.componentRef.setInput('text', 'MP260922.1105.A41');
    fixture.componentRef.setInput('label', 'Copier la référence');
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;

    expect(button.getAttribute('aria-label')).toBe('Copier la référence');
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('MP260922.1105.A41');
    expect(button.textContent?.trim()).toBe('Copié');

    await vi.advanceTimersByTimeAsync(2000);
    await fixture.whenStable();
    expect(button.textContent?.trim()).toBe('Copier');
    vi.useRealTimers();
  });
});
