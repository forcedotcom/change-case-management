/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags } from '@salesforce/command';
import { Connection, Messages, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { AnyJson, JsonMap } from '@salesforce/ts-types';
import { Case } from '../case';
import { CaseWithImpl } from '../caseWithImpl';
import { ChangeCommand } from '../changeCommand';
import ChangeConfig from '../changeConfig';
import { Implementation } from '../implementation';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

const CHANGE_RECORD_TYPE_ID = env.getString(
  ChangeCommand.getEnvVarFullName('CHANGE_RECORD_TYPE_ID'),
  '012B000000009fBIAQ'
);
const CHANGE_TEMPLATE_RECORD_TYPE_ID = env.getString(
  ChangeCommand.getEnvVarFullName('CHANGE_TEMPLATE_RECORD_TYPE_ID'),
  '012B0000000EGnTIAW'
);

const FIELD_TO_CLONE = [
  'BusinessHoursId',
  'Subject',
  'Priority',
  'Description',
  'SM_Backout_Plan__c',
  'SM_Risk_Summary__c',
  'SM_Verification_Plan__c',
  'SM_RMA_Verified_As__c',
  'SM_Business_Name__c',
  'SM_Infrastructure_Type__c',
  'SM_Business_Reason__c',
  'SM_Source_Control_Location__c',
  'SM_Source_Control_Tool__c',
  'RMA_Email__c',
  'SM_ChangeType__c',
  'SM_Change_Category__c',
  'How_was_the_rollback_plan_tested__c',
  'If_Manual_how_was_this_tested__c',
  'Test_Environment__c',
  'Testing_Method__c',
  'Was_Rollback_or_rap__c',
  'What_is_the_stagger_plan__c',
  'SM_Pipeline__c',
  'SM_Risk_Level__c',
  'Why_is_the_rollback_plan_not_tested__c',
  'If_Not_Tested_please_explain__c',
];

export default class Create extends ChangeCommand {
  public static description = messages.getMessage('create.description');

  public static examples = [];

  protected static flagsConfig = {
    templateid: flags.id({
      description: messages.getMessage('create.flags.templateid.description'),
      char: 'i',
      required: true,
      env: ChangeCommand.getEnvVarFullName('TEMPLATE_ID'),
    }),
    release: ChangeCommand.globalFlags.release({
      required: true,
    }),
    location: ChangeCommand.globalFlags.location(),
    changeimplementation: flags.enum({
      description: 'What change implementation to use',
      char: 'c',
      default: 'NPM',
      options: ['VSCode', 'NPM', 's3-cli-artifacts', 'CodeBuilder'],
      env: ChangeCommand.getEnvVarFullName('STATUS'),
    }),
  };

  public async run(): Promise<AnyJson> {
    // check for existing case, warn and exit if one already exists
    const existingCase = await this.checkExistingCase();

    if (existingCase) {
      this.ux.log(`Existing release ${existingCase.Id} found. Skipping create.`);
      return { id: existingCase.Id, record: existingCase };
    }

    const conn = this.org.getConnection();
    const record = await this.prepareRecordToCreate();

    const createRes = await this.createCase(record, conn);
    const implementationsToStart = await this.startImplementations(createRes, conn);

    const config = {
      change: createRes.id,
      implementationSteps: implementationsToStart,
    };

    const file = await ChangeConfig.create(ChangeConfig.getDefaultOptions());
    file.setContentsFromObject(config);
    await file.write();

    return { id: createRes.id, record };
  }

  protected async dryrunInformation() {
    const record = await this.prepareRecordToCreate();
    this.ux.styledHeader('Record to Create');
    this.ux.logJson(record);
  }

  private async startImplementations(createRes, conn: Connection): Promise<object> {
    const implementationsToStart = this.generateImplementations(createRes.implementationSteps);

    // start the implementation steps
    const startResult = await conn.requestRaw({
      method: 'PATCH',
      url: conn.instanceUrl + '/services/apexrest/change-management/v1/implementation-steps/start',
      body: JSON.stringify(implementationsToStart),
    });

    const startRes = JSON.parse(startResult.body as string);
    this.ux.log(`implementation step id: ${startRes.results[0].id}`);

    if (startRes.results[0].success === false) {
      throw new SfdxError(`Starting release failed with ${this.parseErrors(startRes)}`);
    }

    return implementationsToStart.implementationSteps;
  }

  private async createCase(record: CaseWithImpl, conn: Connection): Promise<{ id: string; implementationSteps: [] }> {
    // create the case with implementation steps
    const createResult = await conn.requestRaw({
      method: 'POST',
      url: conn.instanceUrl + '/services/apexrest/change-management/v1/change-cases',
      body: JSON.stringify(record),
    });

    const createRes = JSON.parse(createResult.body as string);
    this.ux.log(
      `Release ${createRes.id} created. Check https://gus.lightning.force.com/lightning/r/Case/${createRes.id}/view`
    );

    if (createRes.success === false) {
      throw new SfdxError(`Creating release failed with ${this.parseErrors(createRes)}`);
    }

    return createRes;
  }

  private async checkExistingCase(): Promise<Case | null> {
    const release = this.flags.release;
    const location = this.flags.location;
    const cases = await this.retrieveCasesFromRelease(release, location);

    if (cases.length > 1) {
      // There could be a "Closed - Duplicate" but no need to build in that check until needed.
      throw new SfdxError(`There is more than one release associated with ${release} for ${location}`);
    } else if (cases.length === 1) {
      const existingCase = cases[0];

      if (existingCase.Status.includes('Closed')) {
        throw new SfdxError(
          `The associated case ${existingCase.Id} is already closed. Are you sure you have the right release?`
        );
      }
      return existingCase;
    }
    return null;
  }

  private generateImplementations(steps: string[] = []) {
    return {
      implementationSteps: steps.map((step) => ({
        Id: step,
      })),
    };
  }

  private async prepareRecordToCreate(): Promise<CaseWithImpl> {
    const id = this.flags.templateid;

    const conn = this.org.getConnection();
    const CASE = conn.sobject<Case>('Case');

    const template = await CASE.retrieve(id);

    if (template.RecordTypeId !== CHANGE_TEMPLATE_RECORD_TYPE_ID) {
      throw new SfdxError(
        `A valid change case template must be supplied. Found ${template.RecordTypeId} but expecting ${CHANGE_TEMPLATE_RECORD_TYPE_ID} `
      );
    }

    const record: JsonMap = {};

    FIELD_TO_CLONE.forEach((field) => {
      record[field] = template[field];
    });

    record.RecordTypeId = CHANGE_RECORD_TYPE_ID;
    record.SM_Source_Control_Location__c = this.flags.location || template.SM_Source_Control_Location__c;
    record.SM_Release__c = await this.retrieveOrCreateReleaseId(this.flags.release);
    record.Status = 'Approved, Scheduled';
    record.SM_Risk_Level__c = 'Low';

    const startTime = new Date();
    // set the estimated end time 10 minutes in the future
    const endTime = new Date(startTime.getTime() + 10 * 60000);
    // @ts-ignore this method is defined
    const identity = await conn.identity();
    return {
      change: record as Case,
      implementationSteps: [
        {
          Description__c: 'releasing the salesforce CLI',
          OwnerId: identity.user_id,
          SM_Estimated_Start_Time__c: startTime.toISOString(),
          SM_Estimated_End_Time__c: endTime.toISOString(),
          SM_Implementation_Steps__c: 'N/A',
          Configuration_Item_Path_List__c: `Salesforce.SF_Off_Core.DeveloperTools.${this.flags.changeimplementation}`,
          SM_Infrastructure_Type__c: 'Off Core',
        } as Implementation,
      ],
    } as CaseWithImpl;
  }
}
