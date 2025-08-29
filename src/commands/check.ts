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

import { Messages, SfError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { retrieveCaseFromIdOrRelease } from '../changeCaseApi.js';
import { changeCaseIdFlag, environmentAwareOrgFlag, locationFlag, releaseFlag } from '../flags.js';
import { getEnvVarFullName } from '../functions.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/change-case-management', 'check');

// ID for Standard Pre Approved
const CHANGE_TYPE_ID = env.getString(getEnvVarFullName('CHANGE_TYPE_ID'), 'a8hB00000004DIzIAM');

export type CheckResult = {
  id: string;
  status: string;
  type: string;
};
export default class Check extends SfCommand<CheckResult> {
  public static readonly deprecated = true;
  public static readonly hidden = true;
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = [];
  public static readonly flags = {
    'target-org': environmentAwareOrgFlag({ required: true }),
    'change-case-id': changeCaseIdFlag,
    release: releaseFlag,
    location: locationFlag,
  };

  public async run(): Promise<CheckResult> {
    const { flags } = await this.parse(Check);
    const conn = flags['target-org'].getConnection();
    const ux = new Ux({ jsonEnabled: this.jsonEnabled() });
    const changeCase = await retrieveCaseFromIdOrRelease({
      conn,
      ux,
      ...(flags['change-case-id']
        ? { changeCaseId: flags['change-case-id'] }
        : { release: flags.release as string, location: flags.location?.toString() as string }),
    });

    const id = changeCase.Id;
    const type = changeCase.SM_ChangeType__c;
    const status = changeCase.Status;

    if (type === CHANGE_TYPE_ID) {
      this.log(`Change case ${id} is standard pre-approved.`);
    } else {
      if (status !== 'Approved, Scheduled') {
        throw new SfError(`The change case ${id} is set to "${status} and not approved".`);
      }
      this.log(`Change case ${id} is approved.`);
    }
    return { id, status, type };
  }
}
