// Test code to interface with RF Explorer via serial port.
// Requires firmware version 1.12+

var rfe = require('./RFExplorer.js');

rfe.getCurrentConfig(function(config) {
  console.log('Main Model: ' + config.mainModel);
  console.log('Expansion Model: ' + config.expansionModel);
  console.log('Firmware Version: ' + config.firmwareVersion);
});
