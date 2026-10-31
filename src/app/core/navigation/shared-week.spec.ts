import { DefaultUrlSerializer } from '@angular/router';
import { sharedWeekParams } from './shared-week';

const parse = (url: string) => new DefaultUrlSerializer().parse(url);

describe('sharedWeekParams', () => {
  it('garde la semaine de Mes devoirs vers Mon emploi du temps', () => {
    expect(sharedWeekParams(parse('/c/42/homework?week=2026-09-28'), 'timetable')).toEqual({
      week: '2026-09-28',
    });
  });

  it('ramène le jour de Mon emploi du temps au lundi de sa semaine', () => {
    expect(sharedWeekParams(parse('/c/42/timetable?date=2026-09-24'), 'assessments')).toEqual({
      week: '2026-09-21',
    });
  });

  it('préfère la semaine au jour d’un lien venu d’ailleurs', () => {
    const url = parse('/c/42/assessments?date=2026-09-24&week=2026-10-05');

    expect(sharedWeekParams(url, 'homework')).toEqual({ week: '2026-10-05' });
  });

  it('ne dit rien sans semaine dans l’URL, ou avec une date illisible', () => {
    expect(sharedWeekParams(parse('/c/42/homework'), 'timetable')).toEqual({});
    expect(sharedWeekParams(parse('/c/42/homework?week=demain'), 'timetable')).toEqual({});
  });

  it('ne concerne que le passage d’une page de semaine à une autre', () => {
    const week = '?week=2026-09-28';

    expect(sharedWeekParams(parse(`/c/42/homework${week}`), 'homework')).toEqual({});
    expect(sharedWeekParams(parse(`/c/42/homework${week}`), 'messages')).toEqual({});
    expect(sharedWeekParams(parse(`/c/42/messages${week}`), 'timetable')).toEqual({});
    expect(sharedWeekParams(parse(`/login${week}`), 'timetable')).toEqual({});
  });
});
