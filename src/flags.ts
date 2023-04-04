/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { env } from '@salesforce/kit';
import { Flags } from '@salesforce/sf-plugins-core';
import { AuthInfo, Connection, Messages, Org } from '@salesforce/core';
import { getEnvVarFullName } from './functions';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

async function maybeGetOrg(input: string): Promise<Org>;
async function maybeGetOrg(input: undefined): Promise<undefined>;
async function maybeGetOrg(input?: string | undefined): Promise<Org | undefined>;
async function maybeGetOrg(input?: string | undefined): Promise<Org | undefined> {
  try {
    return await Org.create({ aliasOrUsername: input });
  } catch (e) {
    if (!input) {
      return undefined;
    } else {
      throw e;
    }
  }
}

const getOrgOrThrow = async (input?: string): Promise<Org> => {
  const org = await maybeGetOrg(input);
  if (org) return org;
  const gusAuthUrl = env.getString(getEnvVarFullName('SFDX_AUTH_URL'));
  if (!gusAuthUrl) {
    throw messages.createError('NoOrgError', [getEnvVarFullName('SFDX_AUTH_URL')]);
  }
  const authInfo = await AuthInfo.create({ oauth2Options: AuthInfo.parseSfdxAuthUrl(gusAuthUrl) });
  const connection = await Connection.create({ authInfo });
  return Org.create({ connection });
};

/** like the normal target-org, but could also derive the org from an SFDX_AUTH_URL in the env */
export const environmentAwareOrgFlag = Flags.custom({
  char: 'o',
  summary: `For testing, you can supply a username/alias.  It will also parse the org from the environment: ${getEnvVarFullName(
    'SFDX_AUTH_URL'
  )}`,
  parse: async (input: string | undefined) => getOrgOrThrow(input),
  default: async () => getOrgOrThrow(),
  defaultHelp: async () => (await getOrgOrThrow())?.getUsername(),
  aliases: ['targetusername', 'u'],
  deprecateAliases: true,
});

export const dryrunFlag = Flags.boolean({
  description: messages.getMessage('command.flags.dryrun.description'),
  env: getEnvVarFullName('DRYRUN'),
  default: false,
  aliases: ['dryrun'],
});

export const releaseFlag = Flags.string({
  description: messages.getMessage('create.flags.release.description'),
  char: 'r',
  env: getEnvVarFullName('SCHEDULE_BUILD'),
  dependsOn: ['location'],
});

export const locationFlag = Flags.url({
  description: messages.getMessage('create.flags.location.description'),
  char: 'l',
  env: getEnvVarFullName('REPO'),
  dependsOn: ['release'],
});

export const changeCaseIdFlag = Flags.salesforceId({
  description: messages.getMessage('command.flags.changecaseid.description'),
  char: 'i',
  startsWith: '500',
  env: getEnvVarFullName('ID'),
  aliases: ['changecaseid'],
  deprecateAliases: true,
});
