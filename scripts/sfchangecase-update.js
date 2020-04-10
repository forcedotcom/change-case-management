#!/usr/bin/env node 

/** Script to initiate Change case creation  */
var shell = require('shelljs');

/** Environment variables */
var SF_CHANGE_CASE_BYPASS = false;
var SF_CHANGE_CASE_ID = process.argv[2];
var SF_CHANGE_CASE_URL = `https://gus.lightning.force.com/lightning/r/Case/${SF_CHANGE_CASE_ID}/view`;
var DEPLOYMENT_STATUS = 'Closed - Deploy Successful';


var instanceurl = 'https://gus.my.salesforce.com';
var alias = 'gus';

shell.exec(`sfdx force:auth:web:login --instanceurl=${instanceurl} --setalias=${alias}`);

//Do we need to add any logic to check if deployment was successful?


shell.exec(`sfdx force:data:record:update -s Case -i ${SF_CHANGE_CASE_ID} -v "Status='${DEPLOYMENT_STATUS}'" -u ${alias}`)
var result =shell.exec(`sfdx force:data:soql:query -q "SELECT Status FROM Case where Id='${SF_CHANGE_CASE_ID}'" -u gus`);
console.log(`Status of the case after update: `, result.stdout);