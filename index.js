// jshint esversion: 6

// Test code to interface with RF Explorer via serial port.
// Requires firmware version 1.12+

let _ = require('underscore'),
    rfe = require('./RFExplorer.js');

let conn = rfe.connection(process.argv[2]);

conn.on('setup', (data) => {
  console.log(`Main Model: ${data.mainModel}`);
  console.log(`Expansion Model: ${data.expansionModel}`);
  console.log(`Firmware Version: ${data.firmwareVersion}`);
});

conn.on('config', (data) => {
  console.log(data);
});
let count = 0;

conn.on('data', (data) => {
  console.log(data.join(','));

  // console.log(_.max(data));
});
