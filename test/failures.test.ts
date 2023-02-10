/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { strict as assert } from 'assert';
import { Config } from '@oclif/core';
import { expect } from 'chai';
import Check from '../src/commands/check';

describe('flag validation', () => {
  it('should throw an error without an org', async () => {
    try {
      const cmd = new Check(['--json'], {} as Config);
      await cmd.run();
      assert.fail('Should have thrown an error');
    } catch (e) {
      assert(e instanceof Error);
      expect(e.name).to.equal('NoOrgError');
    }
  });
});
