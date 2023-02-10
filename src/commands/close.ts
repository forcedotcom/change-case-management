/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { Connection, Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { parseErrors, retrieveCaseFromIdOrRelease, retrieveImplementationFromCase } from '../changeCaseApi';
import { Implementation, ChangeCaseApiResponse, StartApiResponse } from '../types';
import { getEnvVarFullName } from '../functions';
import { changeCaseIdFlag, dryrunFlag, environmentAwareOrgFlag, locationFlag, releaseFlag } from '../flags';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export type CloseResult = {
  case: {
    Id: string;
    Status: string;
  };
};
export default class Close extends SfCommand<AnyJson> {
  public static readonly summary = messages.getMessage('close.description');
  public static readonly description = messages.getMessage('close.description');

  public static readonly examples = [];

  public static readonly flags = {
    'target-org': environmentAwareOrgFlag({ required: true }),
    'change-case-id': changeCaseIdFlag,
    release: releaseFlag,
    location: locationFlag,
    status: Flags.string({
      summary: messages.getMessage('close.flags.status.summary'),
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

    const implementationSteps = await retrieveImplementationFromCase(conn, changeCaseId);

    if (!flags['dry-run']) {
      await this.stopImplementation(flags.status, implementationSteps, conn);
      await this.closeCase(flags.status, changeCaseId, conn);
    } else {
      this.log('Case will not be closed because of the dryrun flag.');
    }

    // delete the config file, until the next release

    return { case: { Id: changeCaseId, Status: flags.status } };
  }

  private async closeCase(status: string, changecaseid: string, conn: Connection): Promise<void> {
    // close the case
    const closeBody = {
      cases: [{ Id: changecaseid }],
    };

    const closeResult = await conn.request<ChangeCaseApiResponse>(
      {
        method: 'PATCH',
        url: '/services/apexrest/change-management/v1/change-cases/close',
        body: JSON.stringify(closeBody),
      },
      { responseType: 'application/json' }
    );

    if (closeResult.results && closeResult.results[0].success === false) {
      throw new SfdxError(`Stoping the implementation steps failed with ${parseErrors(closeResult)}`);
    }

    this.log(`Release ${closeResult.results[0].id} set to ${status}.`);
  }

  private async stopImplementation(status: string, steps: Implementation[], conn: Connection): Promise<void> {
    // stop the implementation steps
    // add the status to the implementation steps
    const implementationsToStop = {
      implementationSteps: steps.map((step) => ({ Id: step.Id, Status__c: status })),
    };

    const stopResult = await conn.request<StartApiResponse>(
      {
        method: 'PATCH',
        url: '/services/apexrest/change-management/v1/implementation-steps/stop',
        body: JSON.stringify(implementationsToStop),
      },
      { responseType: 'application/json' }
    );

    if (stopResult.results && stopResult.results[0].success === false) {
      throw new SfdxError(`Stoping the implementation steps failed with ${parseErrors(stopResult)}`);
    }

    this.log(`Successfully stopped implementation steps ${steps[0].Id}`);
  }
}
