/**
 * Promotes a Stable release.
 */

import yargs from 'yargs/yargs';
import {
  createVersionsUpdatePullRequest,
  ensureForwardPromote,
  runPromoteJob,
} from './promote-job';

const jobName = 'promote-stable.ts';
const {amp_version: AMP_VERSION} = yargs(process.argv.slice(2))
  .options({amp_version: {type: 'string', default: ''}})
  .parseSync();

void runPromoteJob(jobName, () => {
  return createVersionsUpdatePullRequest((currentVersions) => {
    // We assume that the AMP version number is the same for beta-traffic and experimental-traffic, and only differ in their RTV prefix.
    const ampVersion = AMP_VERSION || currentVersions['beta-traffic'].slice(2);

    // for scheduled promotions, check that the new version is a forward promote
    if (!AMP_VERSION) {
      ensureForwardPromote(ampVersion, [
        currentVersions.stable,
        currentVersions.lts,
      ]);
    }

    return {
      ampVersion,
      versionsChanges: {
        stable: `01${ampVersion}`,
        control: `02${ampVersion}`,
        'nightly-control': `05${ampVersion}`,
      },
      title: `⏫ Promoting release ${ampVersion} to Stable channel`,
      body: `Promoting release ${ampVersion} from Beta/Experimental Traffic channel to Stable channel`,
      branch: `stable-${ampVersion}`,
      qaRequire: true,
    };
  });
});
