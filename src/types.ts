/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type Implementation = {
  Id?: string;
  Description__c: string;
  OwnerId: string;
  SM_Estimated_Start_Time__c: string;
  SM_Estimated_End_Time__c: string;
  Configuration_Item_Path_List__c: string;
  SM_Implementation_Steps__c: string;
  SM_Change_Implementation_ID__c: string;
  SM_Infrastructure_Type__c: string;
};

export type CaseWithImpl = {
  change: Case;
  implementationSteps: [Implementation];
};

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

export type Step = {
  Id: string;
};

export type ChangeCaseApiResponse = {
  results: [
    {
      id: string;
      success: boolean;
      message?: string;
    }
  ];
  errors?: [{ message: string }];
};

export type CreateCaseResponse = {
  id: string;
  implementationSteps: string[];
  success: boolean;
  errors?: [{ message: string }];
  results?: [{ message: string }];
};

export type StartApiResponse = {
  hasErrors: boolean;
  results: [
    {
      success: boolean;
      id: string;
      errors?: [
        {
          message?: {
            blockedLock: {
              configurationItem: {
                id: string;
                name: string;
                path: string;
              };
              title: string;
            };
            message?: string;
          };
          errorCode: string;
        }
      ];
    }
  ];
};
