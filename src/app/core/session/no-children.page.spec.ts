import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { failingWith } from '../../../testing/async';
import { PushStore } from '../push/push.store';
import NoChildrenPage from './no-children.page';
import { SessionStore } from './session.store';

describe('NoChildrenPage', () => {
  it('explique la situation et permet de se déconnecter, même hors ligne', async () => {
    const logout = vi.fn(failingWith(new Error('réseau')));
    const forget = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionStore, useValue: { logout } },
        { provide: PushStore, useValue: { forget } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(NoChildrenPage);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('h2')?.textContent).toBe('Aucun élève n’est rattaché à ce compte');
    el.querySelector('button')?.click();
    await fixture.whenStable();

    expect(forget).toHaveBeenCalledOnce();
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
