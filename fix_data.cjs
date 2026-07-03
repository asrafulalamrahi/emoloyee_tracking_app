const fs = require('fs');
let data = fs.readFileSync('src/data.ts', 'utf8');

// The single line replacements created duplicates, so let's clean them up
data = data.replace(/deviceApprovalStatus: 'APPROVED', activationCode: 'ACT-9821', devicePlatform: 'Android', deviceImei: '351294857204918', appVersion: '2.4.1', osVersion: 'Android 14', /g, '');
data = data.replace(/deviceApprovalStatus: 'APPROVED', activationCode: 'ACT-9821', devicePlatform: 'iOS', deviceImei: '351294857204918', appVersion: '2.4.1', osVersion: 'iOS 17.2', /g, '');

data = data.replace(/deviceApprovalStatus: 'APPROVED', activationCode: 'ACT-9821', devicePlatform: 'Android', deviceImei: '351294857204918', appVersion: '2.4.1', osVersion: 'Android 14',/g, '');
data = data.replace(/deviceApprovalStatus: 'APPROVED', activationCode: 'ACT-9821', devicePlatform: 'iOS', deviceImei: '351294857204918', appVersion: '2.4.1', osVersion: 'iOS 17.2',/g, '');


// Let's just find each employee object and make sure they have the fields, or replace the whole file content.
// Since data.ts is not extremely complex, let's just use regex to insert the default fields.
// First remove all deviceApprovalStatus and activationCode... lines if they exist, but maybe they are multiline.
data = data.replace(/ *deviceApprovalStatus: '.*?'.*\n/g, '');
data = data.replace(/ *activationCode: '.*?'.*\n/g, '');
data = data.replace(/ *devicePlatform: '.*?'.*\n/g, '');
data = data.replace(/ *deviceImei: '.*?'.*\n/g, '');
data = data.replace(/ *appVersion: '.*?'.*\n/g, '');
data = data.replace(/ *osVersion: '.*?'.*\n/g, '');

// Wait, the "internetStatus: 'online', " replacement put things on one line.
// So let's replace "internetStatus: 'online', deviceApprovalStatus..." with just "internetStatus: 'online'," first.
let prev = '';
while (data !== prev) {
  prev = data;
  data = data.replace(/internetStatus: '(online|offline)', deviceApprovalStatus: 'APPROVED', activationCode: 'ACT-9821', devicePlatform: '(Android|iOS)', deviceImei: '351294857204918', appVersion: '2.4.1', osVersion: '(Android 14|iOS 17\.2)',/g, "internetStatus: '$1',");
}

// Ensure the new pending employee is untouched if it was already formatted. Let's just add to everyone:
data = data.replace(/(internetStatus: 'online',)/g, "$1\n    deviceApprovalStatus: 'APPROVED',\n    activationCode: 'ACT-9821',\n    devicePlatform: 'Android',\n    deviceImei: '351294857204918',\n    appVersion: '2.4.1',\n    osVersion: 'Android 14',");

data = data.replace(/(internetStatus: 'offline',)/g, "$1\n    deviceApprovalStatus: 'NOT_ACTIVATED',\n    activationCode: 'ACT-0000',\n    devicePlatform: 'iOS',\n    deviceImei: '351294857204918',\n    appVersion: '2.4.1',\n    osVersion: 'iOS 17.2',");

fs.writeFileSync('src/data.ts', data);
