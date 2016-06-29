var serialport = require('serialport');

var openPort = function(dev) {
  var SerialPort = serialport.SerialPort;

  // Open serial port on cmmm port with a 500k baudRate
  return new SerialPort(dev, {
    baudRate: 500000,
    // Call 'data' event with a 'line' of data whenever <EOL> (CRLF) is received.
    parser: serialport.parsers.readline('\r\n')
  });
};

var RequestCommands = {
  Current_Config: '#\x04C0'
};

var ReceivedCommands = {
  Current_Setup: '#C2-M:'
};

module.exports = {
  getCurrentConfig: function(callback) {
    // Use the serial port specified by the third command line argument.
    var port = openPort(process.argv[2]);

    // 'open' event - called when the serial port actually opens.
    port.on('open', function() {
      // console.log('Port opened.');
      port.write(RequestCommands.Current_Config);
    });

    // Event called whenever a line of data is received:
    port.on('data', function(data) {
      // console.log('Line received: ' + data);
      if (data.startsWith(ReceivedCommands.Current_Setup)) {
        if (typeof callback == 'function') callback({
          mainModel: data.substr(6, 3),
          expansionModel: data.substr(10, 3),
          firmwareVersion: data.substr(14, 5)
        });
        port.close();
      }
    });
  }
};
