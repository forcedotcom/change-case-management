
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, SfdxCommand } from '@salesforce/command';
import { AuthInfo, Connection, Messages, Org, SfdxError, Logger } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { Case } from './case';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export abstract class ChangeCommand extends SfdxCommand {
  public static globalFlags = {
    changecaseid: (opts: object = {}) => flags.id(Object.assign({
      description: messages.getMessage('command.flags.changecaseid.description'),
      char: 'i',
      env: ChangeCommand.getEnvVarFullName('ID')
    }, opts)),
    release: (opts: object = {}) => flags.string(Object.assign({
      description: messages.getMessage('create.flags.release.description'),
      char: 'r',
      env: ChangeCommand.getEnvVarFullName('SCHEDULE_BUILD')
    }, opts)),
    location: (opts: object = {}) => flags.url(Object.assign({
      description: messages.getMessage('create.flags.location.description'),
      char: 'l',
      env: ChangeCommand.getEnvVarFullName('REPO')
    }, opts))
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

  // I have to redefine these to retain their types. Not sure why.
  protected org?: Org;
  protected logger: Logger;

  protected hasUserSpecifiedUsername() {
    return this.argv.find(arg => arg.startsWith('-u') || arg.startsWith('--targetusername'));
  }

  protected async retrieveCaseFromIdOrRelease(): Promise<Case> {
    const conn = this.org.getConnection();
    const CASE = conn.sobject<Case>('Case');

    if (this.flags.changecaseid) {
      this.logger.debug('Using change case ID.');
      return await CASE.retrieve(this.flags.changecaseid);
    } else {
      const release = this.flags.release;
      const location = this.flags.location;

      if (!release && !location) {
        throw new SfdxError('Either the change case ID OR the release and location need to be provided.');
      }
      this.logger.debug('No change case ID provided, using release and location instead.');

      const build = await conn.query<{Id}>(`SELECT Id FROM ADM_Release__c WHERE Name = '${release}'`);

      if (!build || build.totalSize === 0) {
        throw new SfdxError(`The release ${release} was not found.`);
      }

      const cases = (await conn.query<Case>(
        'SELECT Id, Status FROM Case WHERE ' +
        `SM_Release__c = '${build.records[0].Id}' AND ` +
        `SM_Source_Control_Location__c = '${location}'`
      )).records;

      if (cases.length === 0) {
        throw new SfdxError(`Could not find change case with ${release} and ${location}.`);
      }
      if (cases.length > 1) {
        throw new SfdxError(`Found more then one change case with ${release} and ${location}. Use the change case ID to remove ambiguity`);
      }
      return cases[0];
    }
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
