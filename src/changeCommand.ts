
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export abstract class ChangeCommand extends SfdxCommand {
  public static globalFlags = {
    changecaseid: flags.id({
      description: messages.getMessage('command.flags.changecaseid.description'),
      char: 'i',
      required: true,
      env: ChangeCommand.getEnvVarFullName('ID')
    })
  };

  public static getEnvVarFullName(name: string) {
    return `SF_CHANGE_CASE_${name.toUpperCase()}`;
  }

  static get flags() {
    return Object.assign(super.flags, {
      bypass: flags.boolean({
        description: messages.getMessage('command.flags.bypass.description'),
        env: ChangeCommand.getEnvVarFullName('BYPASS')
      })
    });
  }

  protected async init() {
    await super.init();

    if (this.flags.bypass) {
      // Skip the run command
      throw new SfdxError('Bypass command', 'bypass');
    }
  }

  protected async catch(err) {
    if (err.name === 'bypass') {
      this.ux.log('Command bypassed');
    } else {
      await super.catch(err);
    }
  }
}
