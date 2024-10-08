/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { strict as assert } from 'node:assert';
import { expect } from 'chai';
import Check from '../src/commands/check.js';

describe('flag validation', () => {
  it('should throw an error without an org', async () => {
    try {
      await Check.run(['--json']);
      assert.fail('Should have thrown an error');
    } catch (e) {
      assert(e instanceof Error);
      // NOTE: This test will fail if you have a GUS auth url set your env (SF_CHANGE_CASE_SFDX_AUTH_URL)
      expect(e.name).to.equal('NoOrgError');
    }
  });
});
