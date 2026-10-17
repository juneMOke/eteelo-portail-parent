import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NavigationProgressComponent } from './navigation-progress.component';
import { NavigationProgress } from './navigation-progress';

@Component({ template: '' })
class PageComponent {}

describe('NavigationProgress', () => {
  it('suit la navigation du clic à l’affichage, puis montre la barre', async () => {
    let release!: () => void;
    const gate = new Promise<boolean>((resolve) => (release = () => resolve(true)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'c/:childId/timetable', canActivate: [() => gate], component: PageComponent },
        ]),
      ],
    });
    const progress = TestBed.inject(NavigationProgress);
    const fixture = TestBed.createComponent(NavigationProgressComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.bar')).toBeNull();

    const navigation = TestBed.inject(Router).navigateByUrl('/c/42/timetable?from=home');
    await Promise.resolve();
    fixture.detectChanges();

    expect(progress.pendingUrl()).toBe('/c/42/timetable?from=home');
    expect(progress.pendingPath()).toBe('/c/42/timetable');
    expect(fixture.nativeElement.querySelector('.bar')).not.toBeNull();

    release();
    await navigation;
    fixture.detectChanges();

    expect(progress.pendingUrl()).toBeNull();
    expect(fixture.nativeElement.querySelector('.bar')).toBeNull();
  });
});
