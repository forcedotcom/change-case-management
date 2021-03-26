# Salesforce Change Case Management

Manage change case records in a release management system in Salesforce using something like [Agile Accelerator](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000000ps3jEAA). This uses two record types on Case that to manage changes to tools and services during a release; Change Case and Change Case Template. It creates the change case, checks the release is approved, and closes the change case when the release is in the wild.

The typical flow would be:

1. Build and test staged artifacts.
1. Create a change case before doing a release. - `sfchangecase create`
1. Check the release is approved. - `sfchangecase check`
1. Release the artifacts to production.
1. Close the change case that the release is deployed. - `sfchangecase close`

If there is a lot of time during stage 2 (not part of the same CD process), record the change case ID to be used in step 3 and 5.

## Configuration

All options are configurable by environment variables and are prefixed with `SF_CHANGE_CASE`. All command parameters can use environment variable as defaults. They are snake cased with the prefix.

The most important environment variable is for authentication. Set `SF_CHANGE_CASE_SFDX_AUTH_URL` to the SFDX auth url to the org in which the change cases will be created.

**All command configuration:**
| Environment Variable | Description |
| ---------------------------- | ----------- |
| SF_CHANGE_CASE_SFDX_AUTH_URL | The SFDX auth url to authenticate to a Salesforce org that the change cases belong to. |
| SF_CHANGE_CASE_BYPASS | Skip the change case command. |
| SF_CHANGE_CASE_DRYRUN | Run the command without making any DML to an org. Authentication is still required. |

**Create command configuration:**
| Environment Variable | Description |
| --------------------------------------------- | ----------- |
| SF_CHANGE_CASE_CHANGE_RECORD_TYPE_ID | The case record type ID for a change case. This will be the different for different orgs. |
| SF_CHANGE_CASE_CHANGE_TEMPLATE_RECORD_TYPE_ID | The case record type ID for a change case template. This will be the different for different orgs. |

<!-- install -->

## Installing

<!-- usage -->
```sh-session
$ npm install -g @salesforce/change-case-management
$ sfchangecase COMMAND
running command...
$ sfchangecase (-v|--version|version)
@salesforce/change-case-management/1.3.4 linux-x64 node-v12.18.4
$ sfchangecase --help [COMMAND]
USAGE
  $ sfchangecase COMMAND
...
```
<!-- usagestop -->

## Commands

<!-- commands -->
* [`sfchangecase check [-i <id>] [-r <string> -l <url>] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-check--i-id--r-string--l-url---bypass---dryrun--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfchangecase close [-i <id>] [-r <string> -l <url>] [-s Implemented - per plan|Not Implemented|Rolled back - with no impact] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-close--i-id--r-string--l-url--s-implemented---per-plannot-implementedrolled-back---with-no-impact---bypass---dryrun--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfchangecase create -i <id> -r <string> -c <string> [-l <url>] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-create--i-id--r-string--c-string--l-url---bypass---dryrun--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfchangecase check [-i <id>] [-r <string> -l <url>] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

check the status of a change case record

```
USAGE
  $ sfchangecase check [-i <id>] [-r <string> -l <url>] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] 
  [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --changecaseid=changecaseid                                                   change case id
  -l, --location=location                                                           url of the source control location
  -r, --release=release                                                             schedule build of the new release

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --dryrun                                                                          run the command without making any
                                                                                    API calls - all calls will be
                                                                                    'successful'

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [src/commands/check.ts](https://github.com/forcedotcom/change-case-management/blob/v1.3.4/src/commands/check.ts)_

## `sfchangecase close [-i <id>] [-r <string> -l <url>] [-s Implemented - per plan|Not Implemented|Rolled back - with no impact] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

stops the implementation steps, and closes the change case record

```
USAGE
  $ sfchangecase close [-i <id>] [-r <string> -l <url>] [-s Implemented - per plan|Not Implemented|Rolled back - with no 
  impact] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --changecaseid=changecaseid                                                     change case id
  -l, --location=location                                                             url of the source control location
  -r, --release=release                                                               schedule build of the new release

  -s, --status=(Implemented - per plan|Not Implemented|Rolled back - with no impact)  [default: Implemented - per plan]
                                                                                      What the status of the
                                                                                      implementation steps should be set
                                                                                      to

  -u, --targetusername=targetusername                                                 username or alias for the target
                                                                                      org; overrides default target org

  --apiversion=apiversion                                                             override the api version used for
                                                                                      api requests made by this command

  --bypass                                                                            bypass the change case commands

  --dryrun                                                                            run the command without making any
                                                                                      API calls - all calls will be
                                                                                      'successful'

  --json                                                                              format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)    [default: warn] logging level for
                                                                                      this command invocation
```

_See code: [src/commands/close.ts](https://github.com/forcedotcom/change-case-management/blob/v1.3.4/src/commands/close.ts)_

## `sfchangecase create -i <id> -r <string> -c <string> [-l <url>] [--bypass] [--dryrun] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

create a change case record based on a template ID with one implementation step

```
USAGE
  $ sfchangecase create -i <id> -r <string> -c <string> [-l <url>] [--bypass] [--dryrun] [-u <string>] [--apiversion 
  <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configurationitem=configurationitem                                         (required) What change
                                                                                    implementation to use

  -i, --templateid=templateid                                                       (required) change case template id

  -l, --location=location                                                           url of the source control location

  -r, --release=release                                                             (required) schedule build of the new
                                                                                    release

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --dryrun                                                                          run the command without making any
                                                                                    API calls - all calls will be
                                                                                    'successful'

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [src/commands/create.ts](https://github.com/forcedotcom/change-case-management/blob/v1.3.4/src/commands/create.ts)_
<!-- commandsstop -->
