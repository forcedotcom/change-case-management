#!/usr/bin/env node 

/** Script to initiate Change case creation  */
var shell = require('shelljs');

/** Environment variables */
var SF_CHANGE_CASE_BYPASS = false;
var SF_CHANGE_CASE_ID = process.argv[2];
var SF_CHANGE_CASE_URL = `https://gus.lightning.force.com/lightning/r/Case/${SF_CHANGE_CASE_ID}/view`;


var instanceurl = 'https://gus.my.salesforce.com';
var alias = 'gus';

shell.exec(`sfdx force:auth:web:login --instanceurl=${instanceurl} --setalias=${alias}`);

var status =shell.exec(`sfdx force:data:soql:query -q "SELECT Status FROM Case LIMIT 1" -u ${alias}`);
var data = shell.exec('sfdx force:data:record:get -s Case -i 500B0000005jQHhIAM -u gus');
console.log(status);
