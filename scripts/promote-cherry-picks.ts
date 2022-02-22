/**
 * Promotes cherry-picked release in related channels.
 */

import yargs from 'yargs/yargs';
import {Prefixes, Versions} from '../configs/schemas/versions';
import {
  createVersionsUpdatePullRequest,
  octokit,
  runPromoteJob,
} from './promote-job';

interface Args {
  amp_version: string;
}
const {amp_version: ampVersion}: Args = yargs(process.argv.slice(2))
  .options({
    amp_version: {type: 'string', demandOption: true},
  })
  .parseSync();

const jobName = 'promote-cherry-pick.ts';
const ampVersionWithoutCherryPicksCounter = ampVersion.slice(0, 10);
const cherryPicksCount = ampVersion.slice(-3);

function defined<T>(value: T): value is NonNullable<T> {
  return value !== undefined;
}

function getAmpVersionToCherrypick(
  ampVersion: string,
  currentVersions: Versions
): string {
  const ampVersionToCherrypick = Object.values(currentVersions).find(
    (version) =>
      version?.slice(2, 12) == ampVersionWithoutCherryPicksCounter &&
      version?.slice(0, 2) < cherryPicksCount
  );
  if (!ampVersionToCherrypick) {
    throw Error(
      `Could not find a live AMP version to be cherry-picked with ${ampVersion}`
    );
  }
  return ampVersionToCherrypick.slice(-13);
}

function getChannels(ampVersion: string, currentVersions: Versions): string[] {
  const channels = [];
  for (const [channel, version] of Object.entries(currentVersions)) {
    if (version && version.slice(-13) == ampVersion) {
      channels.push(channel);
    }
  }
  return channels;
}

async function getCherryPickedPRs(
  ampVersion: string,
  numberOfCherryPickedCommits: number
): Promise<string[]> {
  try {
    const {data} = await octokit.rest.repos.listCommits({
      owner: 'ampproject',
      repo: 'amphtml',
      sha: ampVersion,
      per_page: numberOfCherryPickedCommits,
    });
    return data
      .map(({commit}) => {
        const [firstLine] = commit.message.split('\n');
        const matches = firstLine?.match(/\(#(?<pullNumber>\d+)\)$/);
        return matches?.groups?.pullNumber;
      })
      .filter(defined);
  } catch (err) {
    console.warn('Could not fetch the list of cherry picked PRs, skipping...');
    console.warn('Exception thrown:', err);
    return [];
  }
}

function generateBody(
  ampVersion: string,
  channels: string[],
  cherryPickedPRs: string[]
): string {
  let body = `Promoting release ${ampVersion} to channels: `;
  body += channels.join(', ');
  if (cherryPickedPRs.length) {
    body += '\n\nPRs included in this cherry pick:';
    body += cherryPickedPRs
      .map(
        (pullNumber) =>
          `\n* https:// github.com /ampproject/amphtml/pull/${pullNumber}`
      )
      .join(', ');
  }
  return body;
}

void runPromoteJob(jobName, async () => {
  await createVersionsUpdatePullRequest(async (currentVersions) => {
    const currentAmpVersion = getAmpVersionToCherrypick(
      ampVersion,
      currentVersions
    );
    const currentCherryPicksCount = currentAmpVersion.slice(-3);
    const channels = getChannels(currentAmpVersion, currentVersions);
    const versionsChanges: {[channel: string]: string} = {};
    for (const channel of channels) {
      versionsChanges[channel] = `${Prefixes[channel]}${ampVersion}`;
    }

    const cherryPickedPRs = await getCherryPickedPRs(
      ampVersion,
      Number(cherryPicksCount) - Number(currentCherryPicksCount)
    );

    return {
      versionsChanges,
      title: `🌸 Promoting all ${ampVersionWithoutCherryPicksCounter}[${currentCherryPicksCount}→${cherryPicksCount}] channels`,
      body: generateBody(ampVersion, channels, cherryPickedPRs),
      branch: `cherry-pick-${currentAmpVersion}-to-${ampVersion}`,
    };
  });
});
