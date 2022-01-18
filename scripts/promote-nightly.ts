/**
 * Promotes a nightly release.
 */

import minimist from 'minimist';
import {Args} from './promote-args';
import {createVersionsUpdatePullRequest, runPromoteJob} from './promote-job';

const jobName = 'promote-nightly.ts';
const {amp_version: AMP_VERSION} = minimist<Args>(process.argv.slice(2));

void runPromoteJob(jobName, async () => {
  if (!AMP_VERSION) {
    throw new Error(`${jobName} must be called with --amp_version`);
  }

  await createVersionsUpdatePullRequest(() => ({
    versionsChanges: {nightly: `04${AMP_VERSION}`},
    title: `⏫🌙 Promoting release ${AMP_VERSION} to Nightly channel`,
    body: `Promoting release ${AMP_VERSION} to Nightly channel`,
    branch: `nightly-${AMP_VERSION}`,
  }));
});
