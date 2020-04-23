import { expect, test } from '@salesforce/command/lib/test';

describe('check', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ success: true });
    })
    .stdout()
    .command(['update', '--targetusername', 'test@org.com', '-i', '00X123456789123'])
    .it('runs update --targetusername test@org.com -i 00x1234567889123', ctx => {
      expect(ctx.stdout).to.contain('set to Closed - Deploy Successful');
    });
});
