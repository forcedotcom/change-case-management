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
| SF_CHANGE_CASE_CONFIGURATION_ITEM | Full path from the configuration item, ex: Salesforce.SF_Off_Core.DeveloperTools.NPM. |

<!-- install -->

## Installing

<!-- usage -->

```sh-session
$ npm install -g @salesforce/change-case-management
$ sfchangecase COMMAND
running command...
$ sfchangecase (--version)
@salesforce/change-case-management/2.2.0 linux-x64 node-v18.20.2
$ sfchangecase --help [COMMAND]
USAGE
  $ sfchangecase COMMAND
...
```

<!-- usagestop -->

## Commands

<!-- commands -->

- [`sfchangecase close`](#sfchangecase-close)
- [`sfchangecase create`](#sfchangecase-create)

## `sfchangecase close`

Close a change case and stop its implementation steps.

```
USAGE
  $ sfchangecase close -o <value> [--json] [--flags-dir <value>] [-i <value>] [-r <value> -l <value>] [-s
    Implemented - per plan|Not Implemented|Rolled back - with no impact] [--dry-run]

FLAGS
  -i, --change-case-id=<value>  change case id
  -l, --location=<value>        url of the source control location
  -o, --target-org=<value>      (required) For testing, you can supply a username/alias.  It will also parse the org
                                from the environment: SF_CHANGE_CASE_SFDX_AUTH_URL
  -r, --release=<value>         schedule build of the new release
  -s, --status=<option>         [default: Implemented - per plan] What the status of the implementation steps should be
                                set to.
                                <options: Implemented - per plan|Not Implemented|Rolled back - with no impact>
      --dry-run                 run the command without making any API calls - all calls will be 'successful'

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/close.ts](https://github.com/forcedotcom/change-case-management/blob/2.2.0/src/commands/close.ts)_

## `sfchangecase create`

create a change case record based on a template ID with one implementation step

```
USAGE
  $ sfchangecase create -o <value> -i <value> -c <value> [--json] [--flags-dir <value>] [-r <value> -l
    <value>] [--dry-run]

FLAGS
  -c, --configuration-item=<value>  (required) Full path from the configuration item, ex:
                                    Salesforce.SF_Off_Core.DeveloperTools.NPM
  -i, --template-id=<value>         (required) change case template id
  -l, --location=<value>            url of the source control location
  -o, --target-org=<value>          (required) For testing, you can supply a username/alias.  It will also parse the org
                                    from the environment: SF_CHANGE_CASE_SFDX_AUTH_URL
  -r, --release=<value>             schedule build of the new release
      --dry-run                     run the command without making any API calls - all calls will be 'successful'

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [src/commands/create.ts](https://github.com/forcedotcom/change-case-management/blob/2.2.0/src/commands/create.ts)_

<!-- commandsstop -->
