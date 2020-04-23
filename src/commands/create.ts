
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { env } from '@salesforce/kit';
import { AnyJson, Dictionary } from '@salesforce/ts-types';
import { Case } from '../case';
import { ChangeCommand } from '../changeCommand';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@salesforce/change-case-management', 'changecase');

const CHANGE_RECORD_TYPE_ID = env.getString(ChangeCommand.getEnvVarFullName('CHANGE_RECORD_TYPE_ID'), '012B000000009fBIAQ');
const CHANGE_TEMPLATE_RECORD_TYPE_ID = env.getString(ChangeCommand.getEnvVarFullName('CHANGE_TEMPLATE_RECORD_TYPE_ID'), '012B0000000EGnTIAW');

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
  'SM_Pipeline__c'
];

export default class Create extends ChangeCommand {

  public static description = messages.getMessage('create.description');

  public static examples = [];

  protected static flagsConfig = {
    templateid: flags.id({
      description: messages.getMessage('create.flags.templateid.description'),
      char: 'i',
      required: true,
      env: ChangeCommand.getEnvVarFullName('TEMPLATE_ID')
    }),
    release: ChangeCommand.globalFlags.release({
      required: true
    }),
    location: ChangeCommand.globalFlags.location()
  };

  public async run(): Promise<AnyJson> {
    const id = this.flags.templateid;

    const conn = this.org.getConnection();
    const CASE = conn.sobject<Case>('Case');

    const template = await CASE.retrieve(id);

    if (template.RecordTypeId !== CHANGE_TEMPLATE_RECORD_TYPE_ID) {
      throw new SfdxError(`A valid change case template must be supplied. Found ${template.RecordTypeId} but expecting ${CHANGE_TEMPLATE_RECORD_TYPE_ID} `);
    }

    const record: Dictionary = {};

    FIELD_TO_CLONE.forEach(field => {
      record[field] = template[field];
    });

    record.RecordTypeId = CHANGE_RECORD_TYPE_ID;
    record.SM_Source_Control_Location__c = this.flags.location || template.SM_Source_Control_Location__c;
    record.SM_Release__c = this.flags.release;

    const createResult = await CASE.create(record as Case);

    // Only this style of check resolves the createResult.errors check
    if (createResult.success === false) {
      throw new SfdxError(`Creating release failed with ${createResult.errors}`);
    }

    this.ux.log(`Release ${createResult.id} created.`);

    return { id: createResult.id, template };
  }
}
