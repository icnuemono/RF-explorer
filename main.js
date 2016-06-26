var serialport = require('serialport');  //load serialport module
var SerialPort = serialport.SerialPort;  //
var port = new SerialPort(process.argv[2], { //open serial port on specified port with a 500k baudRate
  baudRate: 500000,
  parser: serialport.parsers.readline('\n')   //parse recieved lines
});

port.on('open', function() {   // callback to acknoledge that port has been opened
  console.log('Port opened.'); // print "Port Opened"
  port.write('#\x04C0');    //send command to RF Explorer
});

port.on('data', function(data) {    //Callback that print recieved data 
  console.log('Line received: ' + data);
});
