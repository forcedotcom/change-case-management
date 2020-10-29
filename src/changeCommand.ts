
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, SfdxCommand } from '@salesforce/command';
import { AuthInfo, Connection, Logger, Messages, Org, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { Case } from './case';
import Option = flags.Option;
import Url = flags.Url;
import { Implementation } from './implementation';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export abstract class ChangeCommand extends SfdxCommand {

  static get flags() {
    return Object.assign(super.flags, {
      bypass: flags.boolean({
        description: messages.getMessage('command.flags.bypass.description'),
        env: ChangeCommand.getEnvVarFullName('BYPASS')
      }),
      dryrun: flags.boolean({
        description: messages.getMessage('command.flags.dryrun.description'),
        env: ChangeCommand.getEnvVarFullName('DRYRUN')
      })
    });
  }
  public static globalFlags = {
    changecaseid: (opts: object = {}) => flags.id(Object.assign({
      description: messages.getMessage('command.flags.changecaseid.description'),
      char: 'i',
      env: ChangeCommand.getEnvVarFullName('ID')
    }, opts) as Option<string>),
    release: (opts: object = {}) => flags.string(Object.assign({
      description: messages.getMessage('create.flags.release.description'),
      char: 'r',
      env: ChangeCommand.getEnvVarFullName('SCHEDULE_BUILD')
    }, opts) as Option<string>),
    location: (opts: object = {}) => flags.url(Object.assign({
      description: messages.getMessage('create.flags.location.description'),
      char: 'l',
      env: ChangeCommand.getEnvVarFullName('REPO')
    }, opts) as Url)
  };

  public static getEnvVarFullName(name: string) {
    return `SF_CHANGE_CASE_${name.toUpperCase()}`;
  }

  protected static supportsUsername = true;

  // I have to redefine these to retain their types. Not sure why.
  protected org?: Org;
  protected logger: Logger;

  protected hasUserSpecifiedUsername() {
    return this.argv.find(arg => arg.startsWith('-u') || arg.startsWith('--targetusername'));
  }

  protected async retrieveOrCreateBuildId(release: string): Promise<string> {
    const conn = this.org.getConnection();

    const buildResults = await conn.query<{Id}>(`SELECT Id FROM ADM_Build__c WHERE Name = '${release}'`);
    const records = buildResults.records;

    if (records.length >= 1) {
      if (records.length > 1) {
        this.ux.warn(`More than one ${release} build found. Using the first one.`);
      }
      return records[0].Id;
    } else {
      const buildCreateResult = await conn.sobject('ADM_Build__c').create({ Name: release });
      if (buildCreateResult.success) {
        return buildCreateResult.id;
      }

      // Only this style of check resolves the createResult.errors check
      if (buildCreateResult.success === false) {
        throw new SfdxError(`Creating build failed with ${buildCreateResult.errors}`);
      }
    }
  }

  protected async retrieveOrCreateReleaseId(release: string): Promise<string> {
    const conn = this.org.getConnection();

    const releaseResults = await conn.query<{Id}>(`SELECT Id FROM ADM_Release__c WHERE Name = '${release}'`);
    const records = releaseResults.records;

    if (records.length >= 1) {
      if (records.length > 1) {
        this.ux.warn(`More than one ${release} release found. Using the first one.`);
      }
      return records[0].Id;
    } else {
      const releaseRecord = {
        Name: release,
        Build__c: await this.retrieveOrCreateBuildId(release)
      };

      const releaseCreateResult = await conn.sobject('ADM_Release__c').create(releaseRecord);
      if (releaseCreateResult.success) {
        return releaseCreateResult.id;
      }

      // Only this style of check resolves the createResult.errors check
      if (releaseCreateResult.success === false) {
        throw new SfdxError(`Creating release failed with ${releaseCreateResult.errors}`);
      }
    }
  }

  protected async retrieveCasesFromRelease(release: string, location: string) {
    const conn = this.org.getConnection();
    return (await conn.query<Case>(
      'SELECT Id, Status, SM_ChangeType__c, SM_Implementation_Plan__c FROM Case WHERE ' +
      `SM_Release__c = '${await this.retrieveOrCreateReleaseId(release)}' AND ` +
      `SM_Source_Control_Location__c = '${location}'`
    )).records;
  }

  protected async retrieveImplementationFromCase(caseId: string) {
    const conn = this.org.getConnection();
    return (await conn.query<Implementation>(
      `SELECT Id FROM SM_Change_Implementation__c WHERE Case__c = '${caseId}'`
    )).records;
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

      const cases = await this.retrieveCasesFromRelease(release, location);

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
    this.initializeEnvironmentVariableOptions();

    if (this.flags.bypass) {
      // Skip the run command
      throw new SfdxError('Bypass command', 'bypass');
    }

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

    if (this.flags.dryrun) {
      throw new SfdxError('Dryrun', 'dryrun');
    }
  }

  protected async dryrunInformation() {
    const conn = await this.org.getConnection();
    const result = await conn.query<Case>('SELECT Id FROM Case LIMIT 1');
    this.ux.log(`Random Case ID to prove connection: ${result.records[0].Id}`);
  }

  protected async catch(err) {
    if (err.name === 'bypass') {
      this.ux.log('Change case management command was skipped because SF_CHANGE_CASE_BYPASS was set.');
    } else if (err.name === 'dryrun') {
      this.ux.log('Command dryrun - skipping command execution.');
      this.ux.log(`Flags: ${Object.entries(this.flags).map(([key, flag]) => `${key}=${flag}`).join(' ')}`);
      await this.dryrunInformation();
    } else {
      await super.catch(err);
    }
  }

  protected parseErrors(body): string {
    let result: string = '';
    if (body.errors) {
      body.errors.forEach(error => {
        result += error.message;
      });
    } else {
      result += body[0].message;
    }

    return result;
  }

  // Oclif only supports the env option for flags of type "options".
  // Massage the results to get it for the other types too.
  private initializeEnvironmentVariableOptions() {
    for (const flagName of Object.keys(this.statics.flags)) {
      const flag = this.statics.flags[flagName];
      const envVarName = flag.env;

      if (envVarName && process.env[envVarName]) {
        switch (flag.type) {
          case 'option': { // handled by oclif
            break;
          }
          case 'boolean': {
            this.flags[flagName] = env.getBoolean(envVarName);
            break;
          }
          default: {
            this.flags[flagName] = env.getString(envVarName);
          }
        }
      }
    }
  }
}
