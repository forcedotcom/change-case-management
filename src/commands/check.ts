/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
