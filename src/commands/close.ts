/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags } from '@salesforce/command';
import { Connection, Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { ChangeCommand } from '../changeCommand';
import ChangeConfig from '../changeConfig';
import { Implementation } from '../implementation';
import { ChangeCaseApiResponse } from '../types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

export default class Close extends ChangeCommand {
  public static description = messages.getMessage('close.description');

  public static examples = [];

  protected static flagsConfig = {
    changecaseid: ChangeCommand.globalFlags.changecaseid(),
    release: ChangeCommand.globalFlags.release({
      dependsOn: ['location'],
    }),
    location: ChangeCommand.globalFlags.location({
      dependsOn: ['release'],
    }),
    status: flags.enum({
      description: 'What the status of the implementation steps should be set to',
      char: 's',
      default: 'Implemented - per plan',
      options: ['Implemented - per plan', 'Not Implemented', 'Rolled back - with no impact'],
      env: ChangeCommand.getEnvVarFullName('STATUS'),
    }),
  };

  public async run(): Promise<AnyJson> {
    // get the Case Id from the file, or the release
    const file = await ChangeConfig.create(ChangeConfig.getDefaultOptions() as Record<string, unknown>);
    const config = await file.read();

    let changecaseid = (this.flags.changecaseid as string) || (config.change as string);

    if (!changecaseid) {
      changecaseid = (await this.retrieveCaseFromIdOrRelease()).Id;
    }

    const implementationSteps =
      (config.implementationSteps as Implementation[]) ?? (await this.retrieveImplementationFromCase(changecaseid));

    const conn = this.org.getConnection();

    await this.stopImplementation(implementationSteps, conn);
    await this.closeCase(changecaseid, conn);

    // delete the config file, until the next release
    await file.unlink();

    return { case: { Id: changecaseid, Status: this.flags.status as string } };
  }

  protected async dryrunInformation(): Promise<void> {
    let id = this.flags.changecaseid as string;

    if (!id) {
      id = (await this.retrieveCaseFromIdOrRelease()).Id;
    }
    this.log(`Updating ${id} with status ${this.flags.status as string}.`);
  }

  private async closeCase(changecaseid: string, conn: Connection): Promise<void> {
    // close the case
    const closeBody = {
      cases: [{ Id: changecaseid }],
    };

    const closeResult = await conn.requestRaw({
      method: 'PATCH',
      url: conn.instanceUrl + '/services/apexrest/change-management/v1/change-cases/close',
      body: JSON.stringify(closeBody),
    });

    const closeRes = JSON.parse(closeResult.body as string) as ChangeCaseApiResponse;

    if (closeRes.results && closeRes.results[0].success === false) {
      throw new SfdxError(`Stoping the implementation steps failed with ${this.parseErrors(closeRes)}`);
    }

    this.ux.log(`Release ${closeRes.results[0].id} set to ${this.flags.status as string}.`);
  }

  private async stopImplementation(steps: Implementation[], conn: Connection): Promise<void> {
    // stop the implementation steps
    // add the status to the implementation steps
    const implementationsToStop = {
      implementationSteps: steps.map((step) => ({ Id: step.Id, Status__c: this.flags.status as string })),
    };

    const stopResult = await conn.requestRaw({
      method: 'PATCH',
      url: conn.instanceUrl + '/services/apexrest/change-management/v1/implementation-steps/stop',
      body: JSON.stringify(implementationsToStop),
    });

    const stopRes = JSON.parse(stopResult.body as string) as ChangeCaseApiResponse;

    if (stopRes.results && stopRes.results[0].success === false) {
      throw new SfdxError(`Stoping the implementation steps failed with ${this.parseErrors(stopRes)}`);
    }

    this.ux.log(`Successfully stopped implementation steps ${steps[0].Id}`);
  }
}
