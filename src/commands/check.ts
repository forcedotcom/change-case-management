
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { ChangeCommand } from '../changeCommand';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

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
    const status = changeCase.Status;

    if (status !== 'Approved') {
      throw new SfdxError(`The release ${id} is set to "${status}" and not approved.`);
    }
    this.ux.log(`Release ${id} is approved.`);

    return { status };
  }
}
