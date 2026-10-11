import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  async function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(AvatarComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return fixture;
  }

  it('affiche les initiales sans photo', async () => {
    const fixture = await render({ firstName: 'grâce', lastName: 'Mbala' });

    expect(fixture.nativeElement.textContent.trim()).toBe('GM');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('se contente du nom quand le prénom manque', async () => {
    const fixture = await render({ firstName: null, lastName: 'Mbala' });

    expect(fixture.nativeElement.textContent.trim()).toBe('M');
  });

  it('affiche la photo, puis les initiales si elle ne charge pas', async () => {
    const fixture = await render({ firstName: 'Grâce', lastName: 'Mbala', photoUrl: '/photo' });
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('/photo');
    expect(img.alt).toBe('');

    img.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('GM');
  });
});
