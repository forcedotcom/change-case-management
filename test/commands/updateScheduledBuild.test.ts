/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { $$, expect, test } from '@salesforce/command/lib/test';
import { Connection } from '@salesforce/core';

describe('updateScheduledBuild', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => Promise.resolve({}))
    .do(() => {
      $$.SANDBOX.stub(Connection.prototype, 'query').resolves({
        done: true,
        totalSize: 1,
        records: [{ Id: '12345678' }],
      });
    })
    .stdout()
    .command(['updateScheduledBuild', '--targetusername', 'test@org.com', '-i', 'W-123456', '-b', 'build1'])
    .it('runs updateScheduledBuild --targetusername test@org.com -i W-123456 -b build1', (ctx) => {
      expect(ctx.stdout).to.contain('Work Item W-123456 updated with scheduled build build1');
    });
});
