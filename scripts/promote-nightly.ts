/**
 * Promotes a nightly release.
 */

import {runPromoteJob} from './promote-job';

const jobName = 'promote-nightly.ts';

void runPromoteJob(jobName, () => {
  throw new Error('Splines reticluated');
});
