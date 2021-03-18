/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@salesforce/command/lib/test';
import { env } from '@salesforce/kit';

describe('command option', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ success: true });
    })
    .do((ctx) => {
      ctx.bypass = env.getBoolean('SF_CHANGE_CASE_BYPASS');
      env.setBoolean('SF_CHANGE_CASE_BYPASS', true);
    })
    .finally((ctx) => {
      env.setBoolean('SF_CHANGE_CASE_BYPASS', ctx.bypass as boolean);
    })
    .stdout()
    .command(['close', '--targetusername', 'test@org.com', '-i', '00X123456789123'])
    .it('bypass environment variable bypasses command', (ctx) => {
      expect(ctx.stdout).to.contain(
        'Change case management command was skipped because SF_CHANGE_CASE_BYPASS was set.'
      );
    });
});
