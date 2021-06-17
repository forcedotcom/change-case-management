/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { ChangeCommand } from '../changeCommand';
import { WorkItemCommand } from '../workItemCommand';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
// const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export default class UpdateScheduledBuild extends WorkItemCommand {
  public static description = 'updateScheduledBuild';

  public static examples = [];

  protected static flagsConfig = {
    workitemid: flags.string({
      description: 'enter workitem id',
      char: 'i',
      required: true,
      env: ChangeCommand.getEnvVarFullName('WORKITEM_ID'),
    }),
    scheduledbuild: flags.string({
      description: 'enter scheduledbuild',
      char: 'b',
      required: true,
      env: ChangeCommand.getEnvVarFullName('SCHEDULED_BUILD_NAME'),
    }),
    bypass: ChangeCommand.globalFlags.bypass,
    dryrun: ChangeCommand.globalFlags.dryrun,
  };

  public async run(): Promise<void> {
    const workItemId = this.flags.workitemid as string;
    const scheduledbuild = this.flags.scheduledbuild as string;

    await this.updateScheduledBuildOnWorkItem(scheduledbuild, workItemId);

    this.ux.log(`Work Item ${workItemId} updated with scheduled build ${scheduledbuild}`);
  }
}
