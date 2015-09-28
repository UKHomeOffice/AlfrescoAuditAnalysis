// Assumes we have a number of Alfresco json files in ../data directory

var _ = require('lodash');
var audit = require('./data/audit.json');
var audit1 = require('./data/audit1.json');
var audit2 = require('./data/audit2.json');
var fs = require('fs');

function readJsonFiles(auditRecords, interests, auditRecordsOfInterest) {

    _.forEach(auditRecords.entries, function(auditRecord) {
        var user = auditRecord.user;
        var values = auditRecord.values;
        var path = values['/alfresco-access/transaction/path'];

        _.forEach(interests, function(interest) {
            if(typeof path != 'undefined' && path.indexOf(interest) > -1) {
                auditRecordsOfInterest.push(auditRecord);
                return false;
            }
        });

    });
}

function writeFilteredRecordsToFile(auditRecordsOfInterest) {
    var json = { "count": 0, "entries": [] };
    json.count - auditRecordsOfInterest.length;
    json.entries = auditRecordsOfInterest;
    fs.writeFile("./data/filteredAudit.json", JSON.stringify(json, null, 4), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

}

var auditRecordsOfInterest = [];
readJsonFiles(audit, ['LPQ', 'OPQ', 'NPQ'], auditRecordsOfInterest);
readJsonFiles(audit1, ['LPQ', 'OPQ', 'NPQ'], auditRecordsOfInterest);
readJsonFiles(audit2, ['LPQ', 'OPQ', 'NPQ'], auditRecordsOfInterest);
console.log(auditRecordsOfInterest.length);
writeFilteredRecordsToFile(auditRecordsOfInterest);



