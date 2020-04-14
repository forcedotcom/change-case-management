@salesforce/change-case-management
=============

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
