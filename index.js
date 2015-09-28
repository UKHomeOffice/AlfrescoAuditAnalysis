var json2csv = require('json2csv');
var fs = require('fs-extra');
var _ = require('lodash');
var fields = ['id', 'application', 'user', 'time', 'values', 'field6'];
var jsonData;
var valColumns = ['user', 'sub-actions', 'action', 'to', 'from'];
var props = [
	"/alfresco-access/transaction/action",
	"/alfresco-access/transaction/user",
	"/alfresco-access/transaction/properties/to",
	"/alfresco-access/transaction/properties/from",
	"/alfresco-access/transaction/sub-actions"
];

fs.readJson('./output/output.json', function (err, packageObj) {
	if (err) console.log(err);
 // console.log(packageObj)
 //jsonData = JSON.parse(packageObj);
 var entries = packageObj.entries;
 console.log(entries[0].values);
 jsonData = entries;

 _.each(entries, function (entry) {
 	console.log("88888888888888888888888888");
 	var values = entry.values;
 	_.each(values, function (value, key) {
 		for (prop in props) {
 			if (props[prop] === key) {
 				//console.log(key);
 				var propKey = key.substring(key.lastIndexOf('/') + 1);
 				if (_.contains(valColumns, propKey)){
 					console.log(propKey + "---->" + value);
 				}
 			}
 		}
 	});
 });

 // for(var x = 0; x < entries.length; x++){
 // 	var values = entries[x].values;
 // 	//var jsonValues = JSON.parse(values);
 // 	for(var z = 0; z < values.length; z++){
 // 	// 	var user = values[z]./alfresco-access/transaction/user;

 // 	// 	console.log(user);
 // 	}

 // }

 //jsonCsv(jsonData);
});
 
 function jsonCsv(jsonData) {
 	json2csv({ data: jsonData, fields: fields, nested: true }, function(err, csv) {
  		if (err) console.log(err);
  		fs.writeFile('./output/data.csv', csv, function(err) {
  			if (err) throw err;
    		console.log('file saved');
  		})
	});
 }
