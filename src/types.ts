/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type Implementation = {
  Id?: string;
  Description__c: string;
  OwnerId: string;
  Configuration_Item_Path_List__c: string;
  SM_Implementation_Steps__c: string;
  SM_Infrastructure_Type__c: string;
  Planned_Start_Time__c: string;
  Planned_Duration_In_Hours__c: number;
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

type SuccessResult = {
  id: string;
  success: true;
};

type CloseFailureResult = {
  success: false;
  errors: [
    {
      message: string;
      errorCode: string;
    }
  ];
};

// https://confluence.internal.salesforce.com/display/PETOOLS/Change+API+V2
export type ChangeCaseCloseApiResponse =
  | { hasErrors: true; results: [CloseFailureResult | SuccessResult] }
  | { hasErrors: false; results: [SuccessResult] };

export type CreateCaseResponse = {
  id: string;
} & (
  | { success: true; implementationSteps: string[] }
  | { success: false; errors: [{ message: string; errorCode: string }] }
);

export type StartFailureResult = {
  success: false;
  id: string;
  errors?: [
    {
      message?: {
        message?: string;
        blockedLock: {
          configurationItem: {
            id: string;
            name: string;
            path: string;
          };
          title: string;
        };
        blockingLocks: [
          {
            blockingLock: {
              configurationItem: {
                id: string;
                path: string;
              };
              id: string;
              lockOwner: {
                email: string;
                id: string;
                name: string;
              };
              lockType: {
                id: string;
                name: string;
              };
            };
          }
        ];
        errorCode: string;
        fields?: string[];
      };
    }
  ];
};
export type StartApiResponse =
  | { hasErrors: false; results: SuccessResult[] }
  | {
      hasErrors: true;
      results: [StartFailureResult | SuccessResult];
    };

export const isFailure = (
  result: StartFailureResult | CloseFailureResult | SuccessResult
): result is StartFailureResult | CloseFailureResult => result.success === false;
