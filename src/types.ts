/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export interface Step {
  Id: string;
}

export interface ChangeCaseApiResponse {
  results: [
    {
      id: string;
      success: boolean;
      message?: string;
    }
  ];
  errors?: [{ message: string }];
}

export interface CreateCaseResponse {
  id: string;
  implementationSteps: string[];
  success: boolean;
  errors?: [{ message: string }];
  results?: [{ message: string }];
}

export interface StartApiResponse {
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
}
