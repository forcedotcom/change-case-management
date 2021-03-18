/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@salesforce/command/lib/test';

describe('check', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ Status: 'Approved, Scheduled' });
    })
    .stdout()
    .command(['check', '--targetusername', 'test@org.com', '-i', '00X123456789123'])
    .it('runs check --targetusername test@org.com -i 00x1234567889123', (ctx) => {
      expect(ctx.stdout).to.contain('is approved');
    });

  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({
        records: [{ Id: 'test', Status: 'Approved, Scheduled' }],
      });
    })
    .stdout()
    .command([
      'check',
      '--targetusername',
      'test@org.com',
      '-r',
      'offcore.tooling.XX.XX.XX',
      '-l',
      'https://github.com/myorg/myrepo',
    ])
    .it('runs check --targetusername test@org.com -i 00x1234567889123', (ctx) => {
      expect(ctx.stdout).to.contain('is approved');
    });
});
