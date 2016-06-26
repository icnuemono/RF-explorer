var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var port = new SerialPort(process.argv[2], {
  baudRate: 500000,
  parser: serialport.parsers.readline('\n')
});

port.on('open', function() {
  console.log('Port opened.');
  port.write('#\x04C0');
});

port.on('data', function(data) {
  console.log('Line received: ' + data);
});
