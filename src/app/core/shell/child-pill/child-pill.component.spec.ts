import { TestBed } from '@angular/core/testing';
import { GRACE } from '../../../../testing/bootstrap.fixture';
import { ChildPillComponent } from './child-pill.component';

describe('ChildPillComponent', () => {
  async function render(interactive: boolean) {
    const fixture = TestBed.createComponent(ChildPillComponent);
    fixture.componentRef.setInput('child', GRACE);
    fixture.componentRef.setInput('interactive', interactive);
    await fixture.whenStable();
    return fixture;
  }

  it('est un bouton qui annonce l’enfant et ouvre le choix', async () => {
    const fixture = await render(true);
    const activate = vi.fn();
    fixture.componentInstance.activate.subscribe(activate);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-label')).toBe(
      'Enfant affiché : Grâce, 5e B. Changer d’enfant.',
    );
    expect(fixture.nativeElement.textContent).toContain('Grâce · 5e B');
    button.click();
    expect(activate).toHaveBeenCalledOnce();
  });

  it("n'est plus un bouton avec un seul enfant", async () => {
    const fixture = await render(false);

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.swap')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="img"]').getAttribute('aria-label')).toBe(
      'Enfant affiché : Grâce, 5e B.',
    );
  });
});
