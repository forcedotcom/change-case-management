
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, SfdxCommand } from '@salesforce/command';
import { AuthInfo, Connection, Messages, Org, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';

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

  protected static supportsUsername = true;

  static get flags() {
    return Object.assign(super.flags, {
      bypass: flags.boolean({
        description: messages.getMessage('command.flags.bypass.description'),
        env: ChangeCommand.getEnvVarFullName('BYPASS')
      })
    });
  }

  protected hasUserSpecifiedUsername() {
    return process.argv.find(arg => arg.startsWith('-u') || arg.startsWith('--username'));
  }

  protected async init() {
    await super.init();

    // If the user didn't specify one (testing mode), use the environment variables (CI).
    if (!this.hasUserSpecifiedUsername()) {
      const gusAuthUrlEnvName = ChangeCommand.getEnvVarFullName('SFDX_AUTH_URL');
      const gusAuthUrl = env.getString(gusAuthUrlEnvName);
      if (!gusAuthUrl) {
        throw new SfdxError(`Required environment variable ${gusAuthUrlEnvName} not specified.`);
      }

      const authInfo = await AuthInfo.create({ oauth2Options: AuthInfo.parseSfdxAuthUrl(gusAuthUrl) });
      const connection = await Connection.create({ authInfo });
      this.org = await Org.create({ connection });
    }

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
