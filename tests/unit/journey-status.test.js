import { describe, expect, it } from 'vitest';
import { newWorkspace } from '../../src/core/schema.js';
import { reduce } from '../../src/core/reducers.js';
import { stepStatuses } from '../../src/components/journey.js';

function firstThreeDone() {
  let s = reduce(newWorkspace(), { type: 'addJob', id: 'job' });
  s = reduce(s, { type: 'addRequirement', id: 'req' });
  s.profile.experience = 'Recorded fictional planning work.';
  s.jobs[0].body = 'Fictional advert';
  s.cv.reviewed = true;
  return s;
}
describe('Next steps progress depends on the reviewed journey', () => {
  it('does not count blank or whitespace answers as work', () => {
    const s = firstThreeDone();
    s.interview.answers = { one: '', two: '   ' };
    s.plan.nextAction = '   ';
    expect(stepStatuses(s)).toEqual(['Done', 'Done', 'Done', 'Not started']);
  });
  for (const kind of ['answer', 'plan', 'application']) {
    it(`${kind} completes step 4 only when every earlier step is done`, () => {
      const s = firstThreeDone();
      if (kind === 'answer') s.interview.answers.one = 'Recorded answer';
      if (kind === 'plan') s.plan.nextAction = 'Practise one answer';
      if (kind === 'application') s.applications.push({ id: 'application' });
      expect(stepStatuses(s)[3]).toBe('Done');
      for (const previous of [0, 1, 2]) {
        const incomplete = structuredClone(s);
        if (previous === 0) incomplete.profile = newWorkspace().profile;
        if (previous === 1) incomplete.jobs[0].requirements = [];
        if (previous === 2) incomplete.cv.reviewed = false;
        expect(stepStatuses(incomplete)[3]).toBe('In progress');
      }
    });
  }
  it('starts empty, and does not mark step 4 done just for earlier progress', () => {
    expect(stepStatuses(newWorkspace())).toEqual(Array(4).fill('Not started'));
    expect(stepStatuses(firstThreeDone())[3]).toBe('Not started');
  });
});
