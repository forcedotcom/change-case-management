/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { env } from '@salesforce/kit';
import { Flags } from '@salesforce/sf-plugins-core';
import { AuthInfo, Connection, Messages, Org } from '@salesforce/core';
import { getEnvVarFullName } from './functions.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

async function maybeGetOrg(input: string): Promise<Org>;
async function maybeGetOrg(input: undefined): Promise<undefined>;
async function maybeGetOrg(input?: string): Promise<Org | undefined>;
async function maybeGetOrg(input?: string): Promise<Org | undefined> {
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
export const environmentAwareOrgFlag = Flags.custom<Org>({
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
  description: messages.getMessage('flags.dry-run.summary'),
  env: getEnvVarFullName('DRYRUN'),
  default: false,
  aliases: ['dryrun'],
});

export const releaseFlag = Flags.string({
  description: messages.getMessage('flags.release.summary'),
  char: 'r',
  env: getEnvVarFullName('SCHEDULE_BUILD'),
  dependsOn: ['location'],
});

export const locationFlag = Flags.url({
  description: messages.getMessage('flags.location.summary'),
  char: 'l',
  env: getEnvVarFullName('REPO'),
  dependsOn: ['release'],
});

export const changeCaseIdFlag = Flags.salesforceId({
  description: messages.getMessage('flags.changecaseid.summary'),
  char: 'i',
  startsWith: '500',
  env: getEnvVarFullName('ID'),
  aliases: ['changecaseid'],
  deprecateAliases: true,
});
