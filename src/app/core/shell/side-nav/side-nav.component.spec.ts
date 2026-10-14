import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DAVID, GRACE } from '../../../../testing/bootstrap.fixture';
import { NAV_ENTRIES } from '../../navigation/nav';
import { SideNavComponent } from './side-nav.component';

describe('SideNavComponent', () => {
  async function render(children = [GRACE, DAVID]) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SideNavComponent);
    fixture.componentRef.setInput('children', children);
    fixture.componentRef.setInput('activeChildId', GRACE.childId);
    fixture.componentRef.setInput('entries', NAV_ENTRIES);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it("mène à chaque page de l'enfant affiché", async () => {
    const { el } = await render();
    const links = [...el.querySelectorAll('nav a')];

    expect(links).toHaveLength(NAV_ENTRIES.length);
    expect(links[0].getAttribute('href')).toBe(`/c/${GRACE.childId}`);
    expect(links.at(-1)?.getAttribute('href')).toBe(`/c/${GRACE.childId}/notifications`);
  });

  it('propose les autres enfants, l’actif coché', async () => {
    const { fixture, el } = await render();
    const selected = vi.fn();
    fixture.componentInstance.childSelected.subscribe(selected);
    const options = [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];

    expect(options[0].getAttribute('aria-checked')).toBe('true');
    options[0].click();
    expect(selected).not.toHaveBeenCalled();
    options[1].click();
    expect(selected).toHaveBeenCalledWith(DAVID.childId);
  });

  it('masque « Mes enfants » avec un seul enfant', async () => {
    const { el } = await render([GRACE]);

    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
  });
});
