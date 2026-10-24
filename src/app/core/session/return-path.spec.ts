import { GRACE } from '../../../testing/bootstrap.fixture';
import { returnPathOf } from './return-path';

describe('returnPathOf', () => {
  const child = `/c/${GRACE.childId}`;

  it('garde une page d’enfant, avec ses paramètres', () => {
    expect(returnPathOf(child)).toBe(child);
    expect(
      returnPathOf(`${child}/messages?announcement=9e3f1c22-7a5b-4d1e-8f60-3b2a1c0d9e84`),
    ).toBe(`${child}/messages?announcement=9e3f1c22-7a5b-4d1e-8f60-3b2a1c0d9e84`);
    expect(returnPathOf(`${child}/grades/report-card?view=week&date=2026-10-24`)).toBe(
      `${child}/grades/report-card?view=week&date=2026-10-24`,
    );
  });

  it('écarte tout ce qui pourrait sortir du portail ou ne pas être une page d’enfant', () => {
    for (const url of [
      undefined,
      null,
      '',
      '/',
      '/login',
      '/c/inconnu/messages',
      '//evil.example/c/x',
      'https://evil.example/',
      `${child}//evil.example`,
      `${child}/%2F%2Fevil`,
      `${child}/\\evil`,
      `${child}/messages#top`,
      `${child}/Messages`,
      `${child}/messages?a=${'x'.repeat(520)}`,
    ]) {
      expect(returnPathOf(url)).toBeNull();
    }
  });
});
