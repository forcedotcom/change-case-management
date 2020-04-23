import { expect, test } from '@salesforce/command/lib/test';

describe('check', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ Status: 'Approved' });
    })
    .stdout()
    .command(['check', '--targetusername', 'test@org.com', '-i', '00X123456789123'])
    .it('runs check --targetusername test@org.com -i 00x1234567889123', ctx => {
      expect(ctx.stdout).to.contain('is approved');
    });

  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({records: [{ Id: 'test', Status: 'Approved' }]});
    })
    .stdout()
    .command(['check', '--targetusername', 'test@org.com', '-r', 'offcore.tooling.XX.XX.XX', '-l', 'https://github.com/myorg/myrepo'])
    .it('runs check --targetusername test@org.com -i 00x1234567889123', ctx => {
      expect(ctx.stdout).to.contain('is approved');
    });
});
