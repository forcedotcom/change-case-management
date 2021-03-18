/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { AuthInfo, Connection, Messages, Org, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { Case } from './case';
import { Implementation } from './implementation';
import { ChangeCaseApiResponse, CreateCaseResponse } from './types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export abstract class ChangeCommand extends SfdxCommand {
  public static globalFlags = {
    changecaseid: (opts: Record<string, unknown> = {}): flags.String =>
      flags.id({
        description: messages.getMessage('command.flags.changecaseid.description'),
        char: 'i',
        env: ChangeCommand.getEnvVarFullName('ID'),
        ...opts,
      }),
    release: (opts: Record<string, unknown> = {}): flags.String =>
      flags.string({
        description: messages.getMessage('create.flags.release.description'),
        char: 'r',
        env: ChangeCommand.getEnvVarFullName('SCHEDULE_BUILD'),
        ...opts,
      }),
    location: (opts: Record<string, unknown> = {}): flags.Url =>
      flags.url({
        description: messages.getMessage('create.flags.location.description'),
        char: 'l',
        env: ChangeCommand.getEnvVarFullName('REPO'),
        ...opts,
      }),
  };
  protected static supportsUsername = true;

  // I can't come up with a type that doesn't use `any` AND captures the flags.
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/explicit-module-boundary-types
  public static get flags() {
    return Object.assign(super.flags, {
      bypass: flags.boolean({
        description: messages.getMessage('command.flags.bypass.description'),
        env: ChangeCommand.getEnvVarFullName('BYPASS'),
      }),
      dryrun: flags.boolean({
        description: messages.getMessage('command.flags.dryrun.description'),
        env: ChangeCommand.getEnvVarFullName('DRYRUN'),
      }),
    });
  }

  public static getEnvVarFullName(name: string): string {
    return `SF_CHANGE_CASE_${name.toUpperCase()}`;
  }

  protected hasUserSpecifiedUsername(): boolean {
    return this.argv.find((arg) => arg.startsWith('-u') || arg.startsWith('--targetusername')).length > 0;
  }

  protected async retrieveOrCreateBuildId(release: string): Promise<string> {
    const conn = this.org.getConnection();

    const buildResults = await conn.query<{ Id: string }>(`SELECT Id FROM ADM_Build__c WHERE Name = '${release}'`);
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
        throw new SfdxError(`Creating build failed with ${buildCreateResult.errors.join(',')}`);
      }
    }
  }

  protected async retrieveOrCreateReleaseId(release: string): Promise<string> {
    const conn = this.org.getConnection();

    const releaseResults = await conn.query<{ Id: string }>(`SELECT Id FROM ADM_Release__c WHERE Name = '${release}'`);
    const records = releaseResults.records;

    if (records.length >= 1) {
      if (records.length > 1) {
        this.ux.warn(`More than one ${release} release found. Using the first one.`);
      }
      return records[0].Id;
    } else {
      const releaseRecord = {
        Name: release,
        Build__c: await this.retrieveOrCreateBuildId(release),
      };

      const releaseCreateResult = await conn.sobject('ADM_Release__c').create(releaseRecord);
      if (releaseCreateResult.success) {
        return releaseCreateResult.id;
      }

      // Only this style of check resolves the createResult.errors check
      if (releaseCreateResult.success === false) {
        throw new SfdxError(`Creating release failed with ${releaseCreateResult.errors.join(',')}`);
      }
    }
  }

  protected async retrieveCasesFromRelease(release: string, location: string): Promise<Case[]> {
    const conn = this.org.getConnection();
    return (
      await conn.query<Case>(
        'SELECT Id, Status, SM_ChangeType__c, SM_Implementation_Plan__c FROM Case WHERE ' +
          `SM_Release__c = '${await this.retrieveOrCreateReleaseId(release)}' AND ` +
          `SM_Source_Control_Location__c = '${location}'`
      )
    ).records;
  }

  protected async retrieveImplementationFromCase(caseId: string): Promise<Implementation[]> {
    const conn = this.org.getConnection();
    return (await conn.query<Implementation>(`SELECT Id FROM SM_Change_Implementation__c WHERE Case__c = '${caseId}'`))
      .records;
  }

  protected async retrieveCaseFromIdOrRelease(): Promise<Case> {
    const conn = this.org.getConnection();
    const CASE = conn.sobject<Case>('Case');

    if (this.flags.changecaseid) {
      this.logger.debug('Using change case ID.');
      return await CASE.retrieve(this.flags.changecaseid);
    } else {
      const release = this.flags.release as string;
      const location = this.flags.location as string;

      if (!release && !location) {
        throw new SfdxError('Either the change case ID OR the release and location need to be provided.');
      }
      this.logger.debug('No change case ID provided, using release and location instead.');

      const cases = await this.retrieveCasesFromRelease(release, location);

      if (cases.length === 0) {
        throw new SfdxError(`Could not find change case with ${release} and ${location}.`);
      }
      if (cases.length > 1) {
        throw new SfdxError(
          `Found more then one change case with ${release} and ${location}. Use the change case ID to remove ambiguity`
        );
      }
      return cases[0];
    }
  }

  protected async init(): Promise<void> {
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
      this.org = await Org.create({ connection });
    }

    if (this.flags.dryrun) {
      throw new SfdxError('Dryrun', 'dryrun');
    }
  }

  protected async dryrunInformation(): Promise<void> {
    const conn = this.org.getConnection();
    const result = await conn.query<Case>('SELECT Id FROM Case LIMIT 1');
    this.ux.log(`Random Case ID to prove connection: ${result.records[0].Id}`);
  }

  protected async catch(err: { name: string }): Promise<void> {
    if (err.name === 'bypass') {
      this.ux.log('Change case management command was skipped because SF_CHANGE_CASE_BYPASS was set.');
    } else if (err.name === 'dryrun') {
      this.ux.log('Command dryrun - skipping command execution.');
      this.ux.log(
        `Flags: ${Object.entries(this.flags)
          .map(([key, flag]) => `${key}=${flag as string}`)
          .join(' ')}`
      );
      await this.dryrunInformation();
    } else {
      await super.catch(err);
    }
  }

  protected parseErrors(body: ChangeCaseApiResponse | CreateCaseResponse): string {
    if (body.errors) {
      return body.errors.map((error) => error.message).join(',');
    }
    if (body.results) {
      return body.results[0]?.message;
    }
  }

  // Oclif only supports the env option for flags of type "options".
  // Massage the results to get it for the other types too.
  private initializeEnvironmentVariableOptions(): void {
    for (const flagName of Object.keys(this.statics.flags)) {
      const flag = this.statics.flags[flagName];
      const envVarName = flag.env;

      if (envVarName && process.env[envVarName]) {
        switch (flag.type) {
          case 'option': {
            // handled by oclif
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
