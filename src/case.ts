
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type Case = {
  Id: string;
  Type: string;
  RecordTypeId: string;
  Status: string;
  Subject: string;
  BusinessHoursId: string;
  Description: string;
  Priority: string;
  OwnerId: string;

  SM_Backout_Plan__c: string;
  SM_Risk_Summary__c: string;
  SM_RMA_Verified_As__c: string;
  SM_Roll_back_Plan__c: string;
  SM_Business_Name__c: string;
  SM_Verification_Plan__c: string;
  SM_Infrastructure_Type__c: string;
  SM_Source_Control_Location__c: string;
  SM_Source_Control_Tool__c: string;
  SM_Business_Reason__c: string;
  Test_Environment__c: string;
  RMA_Email__c: string;
  Testing_Method__c: string;
  Was_Rollback_or_rap__c: string;
  SM_ChangeType__c: string;
  SM_Change_Category__c: string;
  What_is_the_stagger_plan__c: string;
  How_was_the_rollback_plan_tested__c: string;
  If_Manual_how_was_this_tested__c: string;
  SM_Pipeline__c: string;
  SM_Release__c: string;
  SM_Risk_Level__c: string;
};
