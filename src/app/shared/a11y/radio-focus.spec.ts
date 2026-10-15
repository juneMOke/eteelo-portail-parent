import { moveRadioFocus } from './radio-focus';

describe('moveRadioFocus', () => {
  function options(disabled: number[] = []) {
    const buttons = [0, 1, 2].map((index) => {
      const button = document.createElement('button');
      if (disabled.includes(index)) button.setAttribute('aria-disabled', 'true');
      document.body.appendChild(button);
      return button;
    });
    return buttons;
  }

  it('passe à l’option voisine, en boucle', () => {
    const buttons = options();

    moveRadioFocus(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 2, buttons);
    expect(document.activeElement).toBe(buttons[0]);
    moveRadioFocus(new KeyboardEvent('keydown', { key: 'ArrowUp' }), 0, buttons);
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('saute les options inactives', () => {
    const buttons = options([1]);

    moveRadioFocus(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0, buttons);
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('laisse les autres touches', () => {
    const buttons = options();
    buttons[0].focus();
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

    moveRadioFocus(event, 0, buttons);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(buttons[0]);
  });
});
