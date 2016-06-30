// Test code to interface with RF Explorer via serial port.
// Requires firmware version 1.12+

var _ = require('underscore'),
    rfe = require('./RFExplorer.js');

// rfe.getCurrentConfig(process.argv[2], function(config) {
//   console.log('Main Model: ' + config.mainModel);
//   console.log('Expansion Model: ' + config.expansionModel);
//   console.log('Firmware Version: ' + config.firmwareVersion);
// });

var conn = rfe.connection(process.argv[2]);
conn.on('setup', function(data) {
  console.log('Main Model: ' + data.mainModel);
  console.log('Expansion Model: ' + data.expansionModel);
  console.log('Firmware Version: ' + data.firmwareVersion);
});
conn.on('config', function(data) {
  console.log(data);
});
var count = 0;

conn.on('data', function(data) {
  if (_.find(data, function(val) { return val != -126.5; })) {
    console.log(data.join(','));
  }
});
