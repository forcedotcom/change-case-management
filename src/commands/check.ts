
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { AnyJson } from '@salesforce/ts-types';
import { ChangeCommand } from '../changeCommand';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

const CHANGE_TYPE_ID = env.getString(ChangeCommand.getEnvVarFullName('CHANGE_TYPE_ID'), 'a8hB00000004DIzIAM');

export default class Check extends ChangeCommand {

  public static description = messages.getMessage('check.description');

  public static examples = [];

  protected static flagsConfig = {
    changecaseid: ChangeCommand.globalFlags.changecaseid(),
    release: ChangeCommand.globalFlags.release({
      dependsOn: ['location']
    }),
    location: ChangeCommand.globalFlags.location({
      dependsOn: ['release']
    })
  };

  public async run(): Promise<AnyJson> {
    const changeCase = await this.retrieveCaseFromIdOrRelease();

    const id = changeCase.Id;
    const type = changeCase.SM_ChangeType__c;
    const status = changeCase.Status;

    if (type === CHANGE_TYPE_ID) {
      this.ux.log(`Release ${id} is standard pre-approved.`);
    } else {
      if (status !== 'Approved') {
        throw new SfdxError(`The release ${id} is set to "${status}" and not approved.`);
      }
      this.ux.log(`Release ${id} is approved.`);
    }
    return { id, status, type };
  }

  protected async dryrunInformation() {
    const changeCase = await this.retrieveCaseFromIdOrRelease();

    const id = changeCase.Id;
    this.log(`The status of ${id} is ${changeCase.Status}.`);
  }
}
