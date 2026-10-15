import { TestBed } from '@angular/core/testing';
import { UploadProgressComponent } from './upload-progress.component';

describe('UploadProgressComponent', () => {
  it('montre la part envoyée en barre et en clair', async () => {
    const fixture = TestBed.createComponent(UploadProgressComponent);
    fixture.componentRef.setInput('progress', 0.42);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('progress')?.value).toBe(42);
    expect(el.textContent).toContain('Envoi en cours… 42 %');
  });
});
