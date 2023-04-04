# check.description

check the status of a change case record

# create.description

create a change case record based on a template ID with one implementation step

# create.flags.templateid.description

change case template id

# create.flags.release.description

schedule build of the new release

# create.flags.location.description

url of the source control location

# create.flags.configurationitem.description

Full path from the configuration item, ex: Salesforce.SF_Off_Core.DeveloperTools.NPM

# close.description

stops the implementation steps, and closes the change case record

# command.flags.changecaseid.description

change case id

# command.flags.dryrun.description

run the command without making any API calls - all calls will be 'successful'

# close.flags.status.summary

What the status of the implementation steps should be set to

# NoOrgError

The command needs either a target org specified via flag or an environment variable: %s
