import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  async function render(count: number) {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.componentRef.setInput('count', count);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('ne montre rien à zéro', async () => {
    expect((await render(0)).textContent?.trim()).toBe('');
  });

  it('montre le compte et le dit avec son nom', async () => {
    const one = await render(1);
    expect(one.querySelector('.bubble')?.textContent).toBe('1');
    expect(one.querySelector('.visually-hidden')?.textContent).toBe(', 1 nouveau');

    const many = await render(12);
    expect(many.querySelector('.bubble')?.textContent).toBe('9+');
    expect(many.querySelector('.visually-hidden')?.textContent).toBe(', 12 nouveaux');
  });
});
