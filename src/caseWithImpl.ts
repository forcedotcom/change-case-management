import {Case} from './case';
import {Implementation} from './implementation';

export type CaseWithImpl = {
  change: Case
  implementationSteps: [Implementation]
};
