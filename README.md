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
@salesforce/change-case-management/1.1.0 linux-x64 node-v14.0.0
$ sfchangecase --help [COMMAND]
USAGE
  $ sfchangecase COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfchangecase check [-i <id>] [-r <string> -l <url>] [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-check--i-id--r-string--l-url---bypass--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfchangecase create -i <id> -r <string> [-l <url>] [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-create--i-id--r-string--l-url---bypass--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfchangecase update [-i <id>] [-r <string> -l <url>] [-s Closed - Deploy Successful|Closed - Not Executed] [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfchangecase-update--i-id--r-string--l-url--s-closed---deploy-successfulclosed---not-executed---bypass--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfchangecase check [-i <id>] [-r <string> -l <url>] [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

check the status of a change case record

```
USAGE
  $ sfchangecase check [-i <id>] [-r <string> -l <url>] [--bypass] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --changecaseid=changecaseid                                                   change case id
  -l, --location=location                                                           url of the source control location
  -r, --release=release                                                             schedule build of the new release

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [lib/commands/check.js](https://github.com/forcedotcom/change-case-management/blob/v1.1.0/lib/commands/check.js)_

## `sfchangecase create -i <id> -r <string> [-l <url>] [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

create a change case record based on a template ID

```
USAGE
  $ sfchangecase create -i <id> -r <string> [-l <url>] [--bypass] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --templateid=templateid                                                       (required) change case template id
  -l, --location=location                                                           url of the source control location

  -r, --release=release                                                             (required) schedule build of the new
                                                                                    release

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [lib/commands/create.js](https://github.com/forcedotcom/change-case-management/blob/v1.1.0/lib/commands/create.js)_

## `sfchangecase update [-i <id>] [-r <string> -l <url>] [-s Closed - Deploy Successful|Closed - Not Executed] [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

update the status of a change case record

```
USAGE
  $ sfchangecase update [-i <id>] [-r <string> -l <url>] [-s Closed - Deploy Successful|Closed - Not Executed] 
  [--bypass] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --changecaseid=changecaseid                                                   change case id
  -l, --location=location                                                           url of the source control location
  -r, --release=release                                                             schedule build of the new release

  -s, --status=(Closed - Deploy Successful|Closed - Not Executed)                   [default: Closed - Deploy
                                                                                    Successful] ad

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --bypass                                                                          bypass the change case commands

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [lib/commands/update.js](https://github.com/forcedotcom/change-case-management/blob/v1.1.0/lib/commands/update.js)_
<!-- commandsstop -->
