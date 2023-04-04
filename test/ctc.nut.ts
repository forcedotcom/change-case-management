/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, assert } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { AuthInfo, Connection } from '@salesforce/core';
import { ensureString } from '@salesforce/ts-types';
import { env } from '@salesforce/kit';
import { Case } from '../src/types';
import { CheckResult } from '../src/commands/check';
import { CreateResponse } from '../src/commands/create';
import { CloseResult } from '../src/commands/close';

const repoUrl = 'https://github.com/forcedotcom/change-case-management';

describe('e2e', () => {
  // Release wants to search by name, but the Case only has the ID.  The NUT's query can get the name via dot notation.
  let existingCaseFromQuery: Case & { SM_Release__r: { Name: string } };
  let session: TestSession;

  before(async () => {
    ensureString(env.getString('SF_CHANGE_CASE_SFDX_AUTH_URL'), 'missing: SF_CHANGE_CASE_SFDX_AUTH_URL');
    ensureString(env.getString('SF_CHANGE_CASE_TEMPLATE_ID'), 'missing: SF_CHANGE_CASE_TEMPLATE_ID');
    ensureString(env.getString('SF_CHANGE_CASE_CONFIGURATION_ITEM'), 'missing: SF_CHANGE_CASE_CONFIGURATION_ITEM');
    ensureString(env.getString('TESTKIT_AUTH_URL'), 'missing: TESTKIT_AUTH_URL');
    // the NUT uses both regular auth and CTC's special "auth-via-env" and they need to be the same org (GUS)
    expect(env.getString('SF_CHANGE_CASE_SFDX_AUTH_URL')).to.equal(env.getString('TESTKIT_AUTH_URL'));
    session = await TestSession.create({
      devhubAuthStrategy: 'AUTH_URL',
      project: {},
    });
    assert(session.hubOrg.username, 'session huborg has no username');
  });

  after(async () => {
    await session?.clean();
  });

  describe('check', () => {
    it('query for an existing change case to use as a target', async () => {
      const conn = await Connection.create({
        authInfo: await AuthInfo.create({
          username: session.hubOrg.username,
        }),
      });
      const query =
        "SELECT Id, SM_Source_Control_Location__c, SM_Business_Name__c, SM_Release__r.Name, Status, SM_ChangeType__c FROM Case WHERE SM_Business_Name__c = 'a6nB0000000CdW5IAK' LIMIT 1";
      existingCaseFromQuery = await conn.singleRecordQuery(query);
    });
    it('check gets expected results for id', () => {
      const result = execCmd<CheckResult>(
        `check --target-org ${session.hubOrg.username} --changecaseid ${existingCaseFromQuery.Id} --json`,
        {
          ensureExitCode: 0,
        }
      ).jsonOutput?.result;
      expect(result?.id).to.equal(existingCaseFromQuery.Id);
      expect(result?.status).to.equal(existingCaseFromQuery.Status);
      expect(result?.type).to.equal(existingCaseFromQuery.SM_ChangeType__c);
    });
    it('check gets expected results for location/release', () => {
      try {
        const result = execCmd<CheckResult>(
          `check --target-org ${session.hubOrg.username} --location ${existingCaseFromQuery.SM_Source_Control_Location__c} --release ${existingCaseFromQuery.SM_Release__r.Name} --json`,
          {
            ensureExitCode: 0,
          }
        ).jsonOutput?.result;
        expect(result?.id).to.equal(existingCaseFromQuery.Id);
        expect(result?.status).to.equal(existingCaseFromQuery.Status);
        expect(result?.type).to.equal(existingCaseFromQuery.SM_ChangeType__c);
      } catch (e) {
        // we expected it to throw since the case was closed
        if (existingCaseFromQuery.Status.includes('Closed')) {
          // do nothing
        } else {
          throw e;
        }
      }
    });
  });

  describe('dryrun', () => {
    it('create', () => {
      const result = execCmd<CreateResponse>(
        `create --target-org ${session.hubOrg.username} --location ${repoUrl} --release ctc-nut --dryrun --json`,
        { ensureExitCode: 0 }
      ).jsonOutput?.result;
      assert(result);
      expect(result?.id === 'NOT PRESENT BECAUSE DRY RUN');
    });
  });
  describe('real create with close', () => {
    let createResult: CreateResponse;
    it('create', () => {
      const result = execCmd<CreateResponse>(
        `create --target-org ${session.hubOrg.username} --location ${repoUrl} --release ctc-nut --json`,
        { ensureExitCode: 0 }
      ).jsonOutput?.result;
      assert(result);
      // I can't figure out why asserts aren't narrowing.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      createResult = result!;
      expect(result?.id !== 'NOT PRESENT BECAUSE DRY RUN');
      expect(result?.record.change.SM_Source_Control_Location__c).to.equal(repoUrl);
    });
    describe('close', () => {
      it('dryrun close by location/release (verifies works with only env)', () => {
        const result = execCmd<CloseResult>(`close --location ${repoUrl} --release ctc-nut --json --dryrun`, {
          ensureExitCode: 0,
        }).jsonOutput?.result;
        assert(result);
        expect(result?.case.Status === 'Closed');
        expect(result?.case.Id).to.equal(createResult.id);
      });
      it('real close by Id', () => {
        const result = execCmd<CloseResult>(
          `close --target-org ${session.hubOrg.username} --changecaseid ${createResult.id} --json`,
          { ensureExitCode: 0 }
        ).jsonOutput?.result;
        assert(result);
        expect(result?.case.Id).to.equal(createResult.id);
      });
    });
  });
});
