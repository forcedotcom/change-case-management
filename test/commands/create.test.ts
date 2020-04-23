import { expect, test } from '@salesforce/command/lib/test';

describe('check', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({
        RecordTypeId: '012B0000000EGnTIAW',
        // This is part of the create request. We should assert on the second call
        success: true,
        id: 'test'
      });
    })
    .stdout()
    .command(['create', '--targetusername', 'test@org.com', '-i', '00X123456789123', '-b', 'test.build', '-l', 'testlocation'])
    .it('runs create --targetusername test@org.com -i 00x1234567889123 -b test.build', ctx => {
      expect(ctx.stdout).to.contain('test created');
    });
});
