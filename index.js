// Test code to interface with RF Explorer via serial port.
// Requires firmware version 1.12+

var _ = require('underscore'),
    rfe = require('./RFExplorer.js');

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
  console.log(data.join(','));

  // console.log(_.max(data));
});
