import { TestBed } from '@angular/core/testing';
import { DAVID, GRACE } from '../../../../testing/bootstrap.fixture';
import { ChildPickerSheetComponent } from './child-picker-sheet.component';

describe('ChildPickerSheetComponent', () => {
  beforeAll(() => {
    // jsdom n'implémente pas showModal/close.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  async function render() {
    const fixture = TestBed.createComponent(ChildPickerSheetComponent);
    fixture.componentRef.setInput('children', [GRACE, DAVID]);
    fixture.componentRef.setInput('activeChildId', GRACE.childId);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, el, options: [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')] };
  }

  it("liste les enfants, l'actif coché et focalisé à l'ouverture", async () => {
    const { fixture, el, options } = await render();
    fixture.componentInstance.open();

    expect(el.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(options.map((o) => o.querySelector('.name')?.textContent)).toEqual(['Grâce', 'David']);
    expect(options[0].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(options[0]);
  });

  it('parcourt les enfants avec les flèches', async () => {
    const { fixture, options } = await render();
    fixture.componentInstance.open();

    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(document.activeElement).toBe(options[1]);
    options[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(document.activeElement).toBe(options[0]);
  });

  it('émet le choix d’un autre enfant et se ferme', async () => {
    const { fixture, el, options } = await render();
    const selected = vi.fn();
    fixture.componentInstance.childSelected.subscribe(selected);
    fixture.componentInstance.open();

    options[1].click();

    expect(selected).toHaveBeenCalledWith(DAVID.childId);
    expect(el.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });

  it("ne renavigue pas quand on choisit l'enfant déjà affiché", async () => {
    const { fixture, options } = await render();
    const selected = vi.fn();
    fixture.componentInstance.childSelected.subscribe(selected);
    fixture.componentInstance.open();

    options[0].click();

    expect(selected).not.toHaveBeenCalled();
  });
});
