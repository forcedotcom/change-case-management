import { expect, test } from '@salesforce/command/lib/test';
import { env } from '@salesforce/kit';

describe('command option', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ success: true });
    })
    .do(ctx => {
      ctx.bypass = env.getBoolean('SF_CHANGE_CASE_BYPASS');
      env.setBoolean('SF_CHANGE_CASE_BYPASS', true);
    })
    .finally(ctx => {
      env.setBoolean('SF_CHANGE_CASE_BYPASS', ctx.bypass);
    })
    .stdout()
    .command(['close', '--targetusername', 'test@org.com', '-i', '00X123456789123'])
    .it('bypass environment variable bypasses command', ctx => {
      expect(ctx.stdout).to.contain('Change case management command was skipped because SF_CHANGE_CASE_BYPASS was set.');
    });
});
