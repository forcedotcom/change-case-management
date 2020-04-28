import { expect, test } from '@salesforce/command/lib/test';

describe('check', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({
        RecordTypeId: '012B0000000EGnTIAW',
        // This is part of the create request. We should assert on the second call
        success: true,
        id: 'test',
        records: []
      });
    })
    .stdout()
    .command(['create', '--targetusername', 'test@org.com', '-i', '00X123456789123', '-r', 'test.build', '-l', 'https://github.com/myorg/myrepo'])
    .it('runs create --targetusername test@org.com -i 00x1234567889123 -b test.build', ctx => {
      expect(ctx.stdout).to.contain('test created');
    });

  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({
        RecordTypeId: '012B0000000EGnTIAW',
        // This is part of the create request. We should assert on the second call
        success: true,
        id: 'test',
        // Return a record for the check query
        records: [{}]
      });
    })
    .stderr()
    .command(['create', '--targetusername', 'test@org.com', '-i', '00X123456789123', '-r', 'test.build', '-l', 'https://github.com/myorg/myrepo'])
    .it('create fails if change case already exist', ctx => {
      expect(ctx.stderr).to.contain('already a release associated');
    });
});
