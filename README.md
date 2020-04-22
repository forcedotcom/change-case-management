@salesforce/change-case-management
=============

Manage change case records in a release management system in Salesforce using something like [Agile Accelerator](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000000ps3jEAA). This uses two record types on Case that to manage changes to tools and services during a release; Change Case and Change Case Template. It creates the change case, checks the release is approved, and updates the change case when the release is in the wild.

The typical flow would be:

1. Create a change case before doing a release. - `sfchangecase create`
1. Build and test staged artifacts.
1. Check the release is approved. - `sfchangecase check`
1. Release the artifacts to production.
1. Update the change case that the release is deployed. - `sfchangecase update`

If there is a lot of time during stage 2 (not part of the same CD process), record the change case ID to be used in step 3 and 5.

<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g @salesforce/change-case-management
$ sfchangecase COMMAND
running command...
$ sfchangecase (-v|--version|version)
@salesforce/change-case-management/1.0.0 darwin-x64 node-v12.16.1
$ sfchangecase --help [COMMAND]
USAGE
  $ sfchangecase COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfchangecase check -i <id> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-check--i-id---bypass--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfchangecase create -i <id> -b <string> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-create--i-id--b-string---bypass--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfchangecase update -i <id> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-update--i-id---bypass--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfchangecase check -i <id> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

check the status of a change case record

```
USAGE
  $ sfchangecase check -i <id> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --changecaseid=changecaseid                                                   (required) change case id

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

## `sfchangecase create -i <id> -b <string> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

create a change case record based on a template ID

```
USAGE
  $ sfchangecase create -i <id> -b <string> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --schedulebuild=schedulebuild                                                 (required) schedule build of the new
                                                                                    release

  -i, --templateid=templateid                                                       (required) change case template id

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

## `sfchangecase update -i <id> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

update the status of a change case record

```
USAGE
  $ sfchangecase update -i <id> [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --changecaseid=changecaseid                                                   (required) change case id

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```
<!-- commandsstop -->
