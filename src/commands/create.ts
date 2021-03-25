/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags } from '@salesforce/command';
import { Connection, Messages, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { AnyJson, JsonMap } from '@salesforce/ts-types';
import { Case } from '../case';
import { CaseWithImpl } from '../caseWithImpl';
import { ChangeCommand } from '../changeCommand';
import { Implementation } from '../implementation';
import { Step, ChangeCaseApiResponse, CreateCaseResponse } from '../types';

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
    configurationitem: flags.string({
      description: 'What change implementation to use',
      required: true,
      char: 'c',
      env: ChangeCommand.getEnvVarFullName('CONFIGURATION_ITEM'),
    }),
    bypass: ChangeCommand.globalFlags.bypass,
    dryrun: ChangeCommand.globalFlags.dryrun,
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
    await this.startImplementations(createRes, conn);

    return { id: createRes.id, record };
  }

  protected async dryrunInformation(): Promise<void> {
    const record = await this.prepareRecordToCreate();
    this.ux.styledHeader('Record to Create');
    this.ux.logJson(record);
  }

  private async startImplementations(createRes: CreateCaseResponse, conn: Connection): Promise<Step[]> {
    const implementationsToStart = this.generateImplementations(createRes.implementationSteps);

    // start the implementation steps
    const startResult = await conn.requestRaw({
      method: 'PATCH',
      url: conn.instanceUrl + '/services/apexrest/change-management/v1/implementation-steps/start',
      body: JSON.stringify(implementationsToStart),
    });

    const startRes = (JSON.parse(startResult.body as string) as unknown) as ChangeCaseApiResponse;
    this.ux.log(`implementation step id: ${startRes.results[0].id}`);

    if (startRes.results[0].success === false) {
      throw new SfdxError(`Starting release failed with ${this.parseErrors(startRes)}`);
    }

    return implementationsToStart.implementationSteps;
  }

  private async createCase(record: CaseWithImpl, conn: Connection): Promise<CreateCaseResponse> {
    // create the case with implementation steps
    const createResult = await conn.requestRaw({
      method: 'POST',
      url: conn.instanceUrl + '/services/apexrest/change-management/v1/change-cases',
      body: JSON.stringify(record),
    });

    const createRes = (JSON.parse(createResult.body as string) as unknown) as CreateCaseResponse;

    if (createRes.success === false) {
      throw new SfdxError(`Creating release failed with ${this.parseErrors(createRes)}`);
    } else {
      this.ux.log(
        `Release ${createRes.id} created. Check https://gus.lightning.force.com/lightning/r/Case/${createRes.id}/view`
      );
    }

    return createRes;
  }

  private async checkExistingCase(): Promise<Case | null> {
    const release = this.flags.release as string;
    const location = this.flags.location as string;
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

  private generateImplementations(steps: string[] = []): { implementationSteps: Step[] } {
    return {
      implementationSteps: steps.map((step) => ({
        Id: step,
      })),
    };
  }

  private async prepareRecordToCreate(): Promise<CaseWithImpl> {
    const id = this.flags.templateid as string;

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
      record[field] = template[field] as string;
    });

    record.RecordTypeId = CHANGE_RECORD_TYPE_ID;
    record.SM_Source_Control_Location__c = (this.flags.location as string) || template.SM_Source_Control_Location__c;
    record.SM_Release__c = await this.retrieveOrCreateReleaseId(this.flags.release);
    record.Status = 'Approved, Scheduled';
    record.SM_Risk_Level__c = 'Low';

    const startTime = new Date();
    // set the estimated end time 10 minutes in the future
    const endTime = new Date(startTime.getTime() + 10 * 60000);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const identity = await conn.identity();
    return {
      change: record as Case,
      implementationSteps: [
        {
          Description__c: 'releasing the salesforce CLI',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          OwnerId: identity.user_id,
          SM_Estimated_Start_Time__c: startTime.toISOString(),
          SM_Estimated_End_Time__c: endTime.toISOString(),
          SM_Implementation_Steps__c: 'N/A',
          Configuration_Item_Path_List__c: `Salesforce.SF_Off_Core.DeveloperTools.${
            this.flags.changeimplementation as string
          }`,
          SM_Infrastructure_Type__c: 'Off Core',
        } as Implementation,
      ],
    } as CaseWithImpl;
  }
}
