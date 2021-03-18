/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Case } from './case';
import { Implementation } from './implementation';

export type CaseWithImpl = {
  change: Case;
  implementationSteps: [Implementation];
};
