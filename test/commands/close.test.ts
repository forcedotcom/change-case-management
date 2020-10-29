import { $$, expect, test } from '@salesforce/command/lib/test';
import { ConfigFile, Connection } from '@salesforce/core';

describe('close', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ success: true, records: [] });
    })
    .do(() => {
      $$.SANDBOX.stub(ConfigFile.prototype, 'unlink').callsFake(() => Promise.resolve());
      $$.setConfigStubContents('ChangeConfig', {contents: {implementationSteps: [{Id: '12345678'}]}});
      const body = JSON.stringify({results: [{Id: '12345678'}]});
    $$.SANDBOX.stub(Connection.prototype, 'requestRaw').resolves({body: [body]})
    })
    .stdout()
    .command(['close', '--targetusername', 'test@org.com', '-i', '00X123456789123'])
    .it('runs close --targetusername test@org.com -i 00x1234567889123', ctx => {
      expect(ctx.stdout).to.contain('Successfully stopped implementation steps 12345678');
    });
});
