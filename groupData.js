
var _ = require('lodash');
var fs = require('fs');
var filteredAuudit = require('./data/filteredAudit.json');

// Filter data to only contain updateNodeProperties audit records
function filterUpdateAction(data) {
    var updateActionRecords = _.filter(data, function(auditRecord) {
        return auditRecord.values['/alfresco-access/transaction/action'] == 'updateNodeProperties';
    });
    return updateActionRecords;
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function stripUselessData(data) {
    var strippedCtsBeta = replaceAll(data, '{http://cts-beta.homeoffice.gov.uk/model/content/1.0}', '');
    var strippedAlfrescoData = replaceAll(strippedCtsBeta, '{http://www.alfresco.org/model/content/1.0}', '');
    var strippedForumData = replaceAll(strippedAlfrescoData, '{http://www.alfresco.org/model/forum/1.0}', '');
    return _.trimRight(_.trimLeft(strippedForumData, '{'), '}');
}

function parseToAndFrom(data) {
    var propertyPairs = data.split(',');
    var json = {};
    _.forEach(propertyPairs, function(propertyPairString) {
        var propertyAndValue = propertyPairString.split('=');
        var property = _.trim(propertyAndValue[0]);
        var value = _.trim(propertyAndValue[1]);
        json[property] = value;
    });
    return json;
}

function human(data) {
    if(typeof data == 'undefined') {
        return 'N/A';
    } else {
        return data;
    }
}

// Determine if a case made it to Dispatch Response by only ever touching one user
function determineSingleUserDispatch(reportData) {
    var warning = "";
    if(typeof reportData.dispatchResponse !== 'undefined') {

        var particpants = [reportData.draftResponseUser,
            reportData.scsApprovalUser,
            reportData.spadsApprovalUser,
            reportData.parlyApprovalUser,
            reportData.ministersSignOffUser,
            reportData.lordMinistersSignOffUser,
            reportData.permSecApprovalUser,
            reportData.dispatchResponseUser];

        var validParticipants = _.filter(particpants, function(participant){
            return typeof participant !== 'undefined';
        });

        if(_.uniq(validParticipants).length === 1) {
            warning = "WARNING";
        }
    }
    return warning;
}

function generateCSV(reportDataList) {
    var reportString = '';
    reportString += 'Node, Draft Response, Draft Response User, ' +
        'SCS Approval, SCS Approval User, ' +
        'SPADS Approval, SPADS Approval User, ' +
        'Parly Approval, Parly Approval User, ' +
        'Ministers Sign Off, Ministers Sign Off User, ' +
        'Lord Ministers Sign Off, Lord Ministers Sign Off User, ' +
        'Perm Sec Approval, Perm Sec Approval User, ' +
        'Dispatch Response, Dispatch Response User, ' +
        'Single User Warning, ' +
        '\n';
    _.forEach(reportDataList, function(reportData) {
        reportString += reportData.alfrescoNode + ','
        + human(reportData.draftResponse) + ','
        + human(reportData.draftResponseUser) + ','
        + human(reportData.scsApproval) + ','
        + human(reportData.scsApprovalUser) + ','
        + human(reportData.spadsApproval) + ','
        + human(reportData.spadsApprovalUser) + ','
        + human(reportData.parlyApproval) + ','
        + human(reportData.parlyApprovalUser) + ','
        + human(reportData.ministersSignOff) + ','
        + human(reportData.ministersSignOffUser) + ','
        + human(reportData.lordMinistersSignOff) + ','
        + human(reportData.lordMinistersSignOffUser) + ','
        + human(reportData.permSecApproval) + ','
        + human(reportData.permSecApprovalUser) + ','
        + human(reportData.dispatchResponse) + ','
        + human(reportData.dispatchResponseUser) + ','
        + determineSingleUserDispatch(reportData) + ','
        + '\n';
    });
    fs.writeFileSync("./data/result.csv", reportString);
}

function filterData() {
    var reportDataList = [];

    // Filter for updateNodeProperties audit records
    var updateActionRecords = filterUpdateAction(filteredAuudit.entries);

    // Group records by Alfresco Node
    var groupedRecords = _.groupBy(updateActionRecords, function(auditRecord) {
        return auditRecord.values['/alfresco-access/transaction/node'];
    });

    var alfrescoNodes = _.keys(groupedRecords);
    _.forEach(alfrescoNodes, function(alfrescoNode) {
        var reportData = {};
        reportData.alfrescoNode = alfrescoNode;
        var auditRecordsPerNode = groupedRecords[alfrescoNode];

        _.forEach(auditRecordsPerNode, function(auditRecord) {
            var rawToString = auditRecord.values['/alfresco-access/transaction/properties/to'];
            var rawFromString = auditRecord.values['/alfresco-access/transaction/properties/from'];
            if(typeof rawToString === 'undefined' || typeof rawFromString === 'undefined') {
                return;
            }

            var toString = stripUselessData(rawToString);
            var fromString = stripUselessData(rawFromString);
            var to = parseToAndFrom(toString);
            var from = parseToAndFrom(fromString);
            var toHasCaseTask = _.has(to, 'caseTask');
            var fromHasCaseTask = _.has(from, 'caseTask');

            if(toHasCaseTask && fromHasCaseTask) {
                var fromAssignedTeam = from['assignedTeam'];
                var toAssignedTeam = to['assignedTeam'];
                var toCaseTask = to['caseTask'];
                var fromCaseTask = from['caseTask'];

                if(toCaseTask === 'Draft response') {
                    reportData.draftResponse = auditRecord.time;
                    reportData.draftResponseUser = auditRecord.user;
                } else if(toCaseTask == 'SCS approval') {
                    reportData.scsApproval = auditRecord.time;
                    reportData.scsApprovalUser = auditRecord.user;
                } else if(toCaseTask == 'SpAds approval') {
                    reportData.spadsApproval = auditRecord.time;
                    reportData.spadsApprovalUser = auditRecord.user;
                } else if(toCaseTask == 'Parly approval') {
                    reportData.parlyApproval = auditRecord.time;
                    reportData.parlyApprovalUser = auditRecord.user;
                } else if(toCaseTask == 'Minister\'s sign-off') {
                    reportData.ministersSignOff = auditRecord.time;
                    reportData.ministersSignOffUser = auditRecord.user;
                } else if(toCaseTask == 'Dispatch response') {
                    reportData.dispatchResponse = auditRecord.time;
                    reportData.dispatchResponseUser = auditRecord.user;
                } else if(toCaseTask == 'Buff print run') {
                    reportData.buffPrintRun = auditRecord.time;
                    reportData.buffPrintRunUser = auditRecord.user;
                } else if(toCaseTask == 'Lords Minister\'s sign-off') {
                    reportData.lordMinistersSignOff = auditRecord.time;
                    reportData.lordMinistersSignOffUser = auditRecord.user;
                } else if(toCaseTask == 'Perm Sec approval') {
                    reportData.permSecApproval = auditRecord.time;
                    reportData.permSecApprovalUser = auditRecord.user;
                } else if(toCaseTask == 'Parliamentary Under Secretary sign-off') {
                    reportData.parlyUnderSecSignOff = auditRecord.time;
                    reportData.parlyUnderSecSignOffUser = auditRecord.user;
                } else if(toCaseTask == 'Amend response') {
                    // do nothing
                } else if(toCaseTask == 'Create case') {
                    // do nothing
                } else if(toCaseTask == 'Deleted') {
                    // do nothing
                } else if(toCaseTask == 'None') {
                    // do nothing
                } else if(toCaseTask == 'Completed') {
                    // do nothing
                } else {
                    console.log('Missing handling: ' + toCaseTask);
                    console.log('\n');
                    console.log('user : ' + auditRecord.user);
                    console.log('date : ' + auditRecord.time);
                    console.log('from CaseTask: ' + fromCaseTask + ' to CaseTask: ' + toCaseTask);
                    console.log('from Team: ' + fromAssignedTeam + ' to Team: ' + toAssignedTeam);
                }
            }
        });
        reportDataList.push(reportData);
    });
    return reportDataList;
}

generateCSV(filterData());