/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { $$, expect, test } from '@salesforce/command/lib/test';
import { Connection } from '@salesforce/core';

describe('create', () => {
  test
    .env({ SF_CHANGE_CASE_CONFIGURATION_ITEM: 'NPM' })
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({
        RecordTypeId: '012B0000000EGnTIAW',
        // This is part of the create request. We should assert on the second call
        success: true,
        id: 'test',
        records: [],
      });
    })
    .do(() => {
      $$.SANDBOX.stub(Connection.prototype, 'requestRaw').resolves({
        body: '{"id": "00X123456", "implementationSteps": [{"Id": "123"}], "results": [{"id": "123"}]}',
      });
    })
    .stdout()
    .command([
      'create',
      '--targetusername',
      'test@org.com',
      '-i',
      '00X123456789123',
      '-r',
      'test.build',
      '-l',
      'https://github.com/myorg/myrepo',
    ])
    .it('runs create --targetusername test@org.com -i 00x1234567889123 -b test.build', (ctx) => {
      expect(ctx.stdout).to.contain('Release 00X123456 created');
    });

  test
    .env({ SF_CHANGE_CASE_CONFIGURATION_ITEM: 'NPM' })
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({
        RecordTypeId: '012B0000000EGnTIAW',
        // This is part of the create request. We should assert on the second call
        success: true,
        id: 'test',
        // Return a record for the check query
        records: [{ Id: 'test', Status: 'Closed' }],
      });
    })
    .stderr()
    .command([
      'create',
      '--targetusername',
      'test@org.com',
      '-i',
      '00X123456789123',
      '-r',
      'test.build',
      '-l',
      'https://github.com/myorg/myrepo',
    ])
    .it('create fails if change case already exist', (ctx) => {
      expect(ctx.stderr).to.contain('test is already closed');
    });
});
