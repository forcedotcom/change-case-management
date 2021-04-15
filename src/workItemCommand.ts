/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { AuthInfo, Connection, Messages, Org, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { ChangeCaseApiResponse, CreateCaseResponse } from './types';
import { WorkItem } from './workItem';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'workitem');

export abstract class WorkItemCommand extends SfdxCommand {
  public static globalFlags = {
    workitemid: (opts: Record<string, unknown> = {}): flags.String =>
      flags.id({
        description: messages.getMessage('command.flags.changecaseid.description'),
        char: 'i',
        env: WorkItemCommand.getEnvVarFullName('ID'),
        ...opts,
      }),
  };
  protected static supportsUsername = true;

  public static getEnvVarFullName(name: string): string {
    return `SF_CHANGE_CASE_${name.toUpperCase()}`;
  }

  protected hasUserSpecifiedUsername(): boolean {
    return this.argv.filter((arg) => arg.startsWith('-u') || arg.startsWith('--targetusername')).length > 0;
  }

  protected async updateScheduledBuildOnWorkItem(buildName: string, workIdName: string): Promise<void> {
    const conn = this.org.getConnection();
    const buildResults = await conn.query<{ Id: string }>(`SELECT Id FROM ADM_Build__c WHERE Name = '${buildName}'`);
    const buildRecords = buildResults.records;
    let buildRecordId: string;
    if (buildRecords.length >= 1) {
      if (buildRecords.length > 1) {
        this.ux.warn(`More than one ${buildName} build found. Using the first one.`);
      }
      buildRecordId = buildRecords[0].Id;
    } else {
      throw new SfdxError(`Invalid build name ${buildName}`);
    }
    const workItems = await conn.query<WorkItem>(
      `SELECT Id, Scheduled_Build__c FROM ADM_Work__c WHERE Name = '${workIdName}'`
    );
    if (workItems.records.length === 0) {
      throw new SfdxError(`No workitem found for name ${workIdName}`);
    } else if (workItems.records.length > 1) {
      throw new SfdxError(`More than one workitem found for name ${workIdName}`);
    } else {
      const workItemToUpdate = workItems.records[0];
      workItemToUpdate.Scheduled_Build__c = buildRecordId;
      await conn.sobject('ADM_Work__c').update(workItemToUpdate);
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
      const gusAuthUrlEnvName = WorkItemCommand.getEnvVarFullName('SFDX_AUTH_URL');
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
    const result = await conn.query<WorkItem>('SELECT Id FROM ADM_Work__c LIMIT 1');
    this.ux.log(`Random WI ID to prove connection: ${result.records[0].Id}`);
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
