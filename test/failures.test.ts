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
