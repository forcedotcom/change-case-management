#!/usr/bin/env node 

/** Script to initiate Change case creation  */
var shell = require('shelljs');


var instanceurl = 'https://gus.my.salesforce.com';
var alias = 'gus';
var SF_CHANGE_CASE_TEMPLATE_ID = '500B0000005YGshIAG'; // this will not change

shell.exec(`sfdx force:auth:web:login --instanceurl=${instanceurl} --setalias=${alias}`);

var data = shell.exec(`sfdx force:data:record:get -s Case -i ${SF_CHANGE_CASE_TEMPLATE_ID} -u gus --json`);

const templateSchema = JSON.parse(data.stdout).result;
console.log(templateSchema.RecordTypeId);

/*
BusinessHoursId:01mB00000004DeZIAU
"Origin"=Web - Wizard"
"Subject= Salesforce CLI Release",
"Description= This category covers the standard weekly release process for the Salesforce CLI and VSCode Extensions. The same process/pipeline is also used for e-releases when needed.",
"Priority= None",
 "CurrencyIsoCode= USD",
"OwnerId= 005B0000005LiTVIA0",
"SM_Vendor_Tech_Dispatched__c= false,
"SM_Backout_Plan__c": "We can revert all artifacts and packages in minutes by changing the stable channel pointer or the @latest tag pointer. With exception of VSCode, which has to revert the change and fix forward. To fix forward on all repositories, it usually takes around an 45 minutes after the change has been merged to run the integration, smoke, and release jobs.",
"SM_Email_ref__c": "[ ref:00DTDpvc.500B5YGsh:ref ]",
"SM_GUS_Scheduled_Build__c": "47.18.x",
 "How_was_the_rollback_plan_tested__c": "Update to point @latest back to a previous stable label.",
 "If_Manual_how_was_this_tested__c": "Depends on the change but here's a template on common testing flows we run manually https://salesforce.quip.com/uDgrAGiPYODw",
"If_Not_Tested_please_explain__c": null,
"Test_Environment__c": "https://salesforce.quip.com/cYUZAhHMJ1fS",
"Testing_Method__c": "Automated and Manual",
"Was_Rollback_or_rap__c": "Yes",
"What_is_the_stagger_plan__c": "All built artifacts and aggregate-plugin packages are first released to a canary tag/channel. All integration and smoke tests are required for the promote to a stable tag/channel. Some smaller dependent libraries follow semantic versioning and can choose to use a canary deployment or not, but customers can control the upgrade rules they want for non-canary deployments.",
"Why_is_the_rollback_plan_not_tested__c": null,
"SM_Pipeline__c": "aC3B0000000CaR8KAK",
"SM_Risk_Summary__c": "Worst case scenario: CLI commands won't work and customers can't push/pull metadata to/from the org. This can also break CI jobs. Work-around: write code in VS Code or in their org directly using online tools. Remediation will fix <1 hr from discovery.",
"SM_Verification_Plan__c": "PRs in all repos require passing unit tests with stored code coverage. All releases require passing integration and smoke tests before getting promoted to a stable tag/channel. All changes must be QA’d and and the work item must be closed before being published to external customers. Metrics on usage and errors are collected and visualized through AppInsights.",
"SM_ChangeType__c": "a8hB00000004DIzIAM",
"SM_Change_Category__c": "a8gB0000000Cci0IAC",
"Infrastructure__c": "SF Shared Infra",
"SM_AppServerRestartReqd__c": "No App Tier Restart Required (Default value)",
"RMA_Email__c": "sfdcrma@salesforce.com",
 "SM_Source_Control_Location__c": "https://github.com/forcedotcom/salesforcedx-vscode",
"SM_Source_Control_Tool__c": "GitHub",
"SM_Business_Reason__c": "Project Work"


*/


shell.exec('sfdx force:date:record:create -s Case -v  ')