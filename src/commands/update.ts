
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { Case } from '../case';
import { ChangeCommand } from '../changeCommand';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export default class Update extends ChangeCommand {

  public static description = messages.getMessage('update.description');

  public static examples = [];

  protected static flagsConfig = {
    changecaseid: ChangeCommand.globalFlags.changecaseid,
    status: flags.enum({
      description: 'ad',
      char: 's',
      default: 'Closed - Deploy Successful',
      options: [
        'Closed - Deploy Successful',
        'Closed - Not Executed'
      ],
      env: ChangeCommand.getEnvVarFullName('STATUS')
    })
  };

  public async run(): Promise<AnyJson> {
    const id = this.flags.changecaseid;

    const conn = this.org.getConnection();
    const CASE = conn.sobject<Case>('Case');

    const record = {
      Id: id,
      Status: this.flags.status
    };

    const updateResults = await CASE.update(record);

    // Only this style of check resolves the createResult.errors check
    if (updateResults.success === false) {
      throw new SfdxError(`Updating release failed with ${updateResults.errors}`);
    }

    this.ux.log(`Release ${updateResults.id} created.`);

    return { case: record };
  }
}
