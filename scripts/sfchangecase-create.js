#!/usr/bin/env node 

/** Script to initiate Change case creation  */
var shell = require('shelljs');


var instanceurl = 'https://gus.my.salesforce.com';
var alias = 'gus';
var change_case_template_id = '500B0000005YGpYIAW';

shell.exec(`sfdx force:auth:web:login --instanceurl=${instanceurl} --setalias=${alias}`);









