/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { Connection, Messages, SfError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { retrieveCaseFromIdOrRelease } from '../changeCaseApi.js';
import { ChangeCaseCloseApiResponse } from '../types.js';
import { getEnvVarFullName } from '../functions.js';
import { changeCaseIdFlag, dryrunFlag, environmentAwareOrgFlag, locationFlag, releaseFlag } from '../flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/change-case-management', 'close');

export type CloseResult = {
  case: {
    Id: string;
    Status: string;
  };
};
export default class Close extends SfCommand<AnyJson> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly examples = [];

  public static readonly flags = {
    'target-org': environmentAwareOrgFlag({ required: true }),
    'change-case-id': changeCaseIdFlag,
    release: releaseFlag,
    location: locationFlag,
    status: Flags.string({
      // eslint-disable-next-line sf-plugin/no-hardcoded-messages-flags
      summary: messages.getMessage('flags.status.summary'),
      char: 's',
      default: 'Implemented - per plan',
      options: ['Implemented - per plan', 'Not Implemented', 'Rolled back - with no impact'],
      env: getEnvVarFullName('STATUS'),
    }),
    'dry-run': dryrunFlag,
  };

  public async run(): Promise<AnyJson> {
    const { flags } = await this.parse(Close);
    // get the Case Id from the file, or the release
    const conn = flags['target-org'].getConnection();
    const changeCaseId = flags['change-case-id']
      ? flags['change-case-id']
      : (
          await retrieveCaseFromIdOrRelease({
            conn,
            ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
            release: flags.release as string,
            location: flags.location?.toString() as string,
          })
        ).Id;

    if (!flags['dry-run']) {
      (await closeCase(flags.status, changeCaseId, conn)).map((msg) => this.log(msg));
    } else {
      this.log('Case will not be closed because of the dryrun flag.');
    }

    return { case: { Id: changeCaseId, Status: flags.status } };
  }
}

const closeCase = async (status: string, changecaseid: string, conn: Connection): Promise<string[]> => {
  // close the case
  const closeBody = { cases: [{ Id: changecaseid }] };

  const closeResult = await conn.request<ChangeCaseCloseApiResponse>(
    {
      method: 'PATCH',
      url: '/services/apexrest/change-management/v2/change-cases/close',
      body: JSON.stringify(closeBody),
    },
    { responseType: 'application/json' }
  );

  if (closeResult.hasErrors) {
    throw new SfError(`Stoping the implementation steps failed with ${JSON.stringify(closeResult)}`);
  }

  return closeResult.results.map((r) => `Release ${r.id} set to ${status}.`);
};
