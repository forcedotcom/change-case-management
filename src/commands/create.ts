/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { Connection, Messages, SfError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { JsonMap } from '@salesforce/ts-types';
import { Interfaces } from '@oclif/core';
import { Step, StartApiResponse, CreateCaseResponse, Implementation, CaseWithImpl, Case } from '../types.js';
import { getEnvVarFullName } from '../functions.js';
import { dryrunFlag, environmentAwareOrgFlag, locationFlag, releaseFlag } from '../flags.js';
import { retrieveOrCreateReleaseId } from '../changeCaseApi.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/change-case-management', 'create');

const CHANGE_RECORD_TYPE_ID = env.getString(getEnvVarFullName('CHANGE_RECORD_TYPE_ID'), '012B000000009fBIAQ');
const CHANGE_TEMPLATE_RECORD_TYPE_ID = env.getString(
  getEnvVarFullName('CHANGE_TEMPLATE_RECORD_TYPE_ID'),
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

export type CreateResponse = {
  id: string;
  record: CaseWithImpl;
};
export default class Create extends SfCommand<CreateResponse> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly examples = [];

  public static readonly flags = {
    'target-org': environmentAwareOrgFlag({ required: true }),
    'template-id': Flags.salesforceId({
      length: 'both',
      summary: messages.getMessage('flags.template-id.summary'),
      char: 'i',
      required: true,
      startsWith: '500',
      env: getEnvVarFullName('TEMPLATE_ID'),
      aliases: ['templateid'],
      deprecateAliases: true,
    }),
    release: releaseFlag,
    location: locationFlag,
    'configuration-item': Flags.string({
      summary: messages.getMessage('flags.configuration-item.summary'),
      required: true,
      char: 'c',
      env: getEnvVarFullName('CONFIGURATION_ITEM'),
      aliases: ['configurationitem'],
      deprecateAliases: true,
    }),
    'dry-run': dryrunFlag,
  };

  private flags!: Interfaces.InferredFlags<typeof Create.flags>;

  public async run(): Promise<CreateResponse> {
    const { flags } = await this.parse(Create);
    this.flags = flags;

    const conn = flags['target-org'].getConnection();
    const record = await this.prepareRecordToCreate(conn);

    if (flags['dry-run']) {
      this.log('This case would be created if you had not used the --dryrun flag:');
      this.styledJSON(record);
      return { id: 'NOT PRESENT BECAUSE DRY RUN', record };
    } else {
      const createRes = await this.createCase(record, conn);
      await this.startImplementations(createRes, conn);
      return { id: createRes.id, record };
    }
  }

  private async startImplementations(createRes: CreateCaseResponse, conn: Connection): Promise<Step[]> {
    if (createRes.success === false) {
      throw new SfError(`Creating release failed with ${JSON.stringify(createRes)}`);
    }
    const implementationsToStart = generateImplementations(createRes.implementationSteps);

    // start the implementation steps
    const startResult = await conn.request<StartApiResponse>(
      {
        method: 'PATCH',
        url: '/services/apexrest/change-management/v2/implementation-steps/start',
        body: JSON.stringify(implementationsToStart),
      },
      { responseType: 'application/json' }
    );

    if (startResult.hasErrors === false) {
      startResult.results.forEach((result, index) => {
        this.log(`implementation step ${index} ... id: ${result.id}`);
      });
      return implementationsToStart.implementationSteps;
    }
    this.styledJSON(startResult);

    throw new SfError(`Starting release failed with ${JSON.stringify(startResult.results)}}`);
  }

  private async createCase(record: CaseWithImpl, conn: Connection): Promise<CreateCaseResponse> {
    // create the case with implementation steps
    try {
      const createResult = await conn.request<CreateCaseResponse>(
        {
          method: 'POST',
          url: '/services/apexrest/change-management/v2/change-cases',
          body: JSON.stringify(record),
        },
        { responseType: 'application/json' }
      );

      if (createResult.success) {
        this.log(
          `Release ${createResult.id} created. Check https://gus.lightning.force.com/lightning/r/Case/${createResult.id}/view`
        );
        return createResult;
      }

      throw new SfError(`Creating release failed with ${JSON.stringify(createResult.errors)}`);
    } catch (e) {
      const err = e as Error;
      const error = JSON.parse(err.message) as CreateCaseResponse;
      throw new SfError(`Creating release failed with ${JSON.stringify(error)}`);
    }
  }

  private async prepareRecordToCreate(conn: Connection): Promise<CaseWithImpl> {
    const id = this.flags['template-id'];

    const CASE = conn.sobject<'Case'>('Case');

    const template = await CASE.retrieve(id);

    if (typeof template.RecordTypeId === 'string' && template.RecordTypeId !== CHANGE_TEMPLATE_RECORD_TYPE_ID) {
      throw new SfError(
        `A valid change case template must be supplied. Found ${template.RecordTypeId} but expecting ${CHANGE_TEMPLATE_RECORD_TYPE_ID} `
      );
    }

    const record: JsonMap = {};

    FIELD_TO_CLONE.forEach((field) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore index access on object
      record[field] = template[field] as string;
    });

    record.RecordTypeId = CHANGE_RECORD_TYPE_ID;
    record.SM_Source_Control_Location__c =
      this.flags.location?.toString() ?? (template.SM_Source_Control_Location__c as string);
    record.SM_Release__c = await retrieveOrCreateReleaseId(
      conn,
      new Ux({ jsonEnabled: this.jsonEnabled() }),
      this.flags.release as string
    );
    record.Status = 'Approved, Scheduled';
    record.SM_Risk_Level__c = 'Low';

    const identity = await conn.identity();
    return {
      change: record as Case,
      implementationSteps: [
        {
          Description__c: 'releasing the salesforce CLI',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          OwnerId: identity.user_id,
          Planned_Start_Time__c: new Date().toISOString(),
          Planned_Duration_In_Hours__c: 0.25,
          SM_Implementation_Steps__c: 'N/A',
          Configuration_Item_Path_List__c: this.flags['configuration-item'],
          SM_Infrastructure_Type__c: 'Off Core',
        } satisfies Implementation,
      ],
    } as CaseWithImpl;
  }
}

const generateImplementations = (steps: string[] = []): { implementationSteps: Step[] } => ({
  implementationSteps: steps.map((step) => ({
    Id: step,
  })),
});
